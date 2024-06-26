<template>
  <div id="content">
    <h1>Juttukaveri</h1>

    <p id="languageChoice">
      <a href=""
        @click.prevent="setCurrentLanguage('en-US')"
        :class="{ 'selectedText': currentLanguage === 'en-US' }"
      >English</a> |
      <a href=""
        @click.prevent="setCurrentLanguage('fi-FI')"
        :class="{ 'selectedText': currentLanguage === 'fi-FI' }"
      >Suomi</a> |
      <a href=""
        @click.prevent="setCurrentLanguage('cmn-CN')"
        :class="{ 'selectedText': currentLanguage === 'cmn-CN' }"
      >中文</a>
    </p>
    <h2 id="statusText" :class="statusClass">{{ statusText }}</h2>

    <p id="instructions">{{ instructions }}</p>

    <p v-if="sessionId || replyCount > 0"> {{ t('Replies today') }}: {{ replyCount }} / 10</p>

    <div id="settings" v-if="state === 'setup'" class="settingsTable">
      <div class="settingRow">
        <label for="selectCharacterMenu">{{ t('Choose role') }}:</label>
        <select name="character" id="selectCharacterMenu" v-model="character">
          <option value="teacher">{{ t('Kindergarten teacher') }}</option>
          <option value="none">{{ t('No role') }}</option>
        </select>
      </div>
      <div class="settingRow" v-if="character == 'teacher'">
        <label for="inputAge">{{ t('Age of child') }}:</label>
        <input type="number" min="1" max="18" name="age" id="inputAge" v-model="age" />
      </div>
      <div class="settingRow">
        <label for="echoCheckbox">{{ t('Echo') }}</label>
        <input type="checkbox" id="echoCheckbox" checked=false name="echo" v-model="echo">
        <div class="settingDescription">{{ t('echoDescription') }}</div>
      </div>
    </div>

    <p>
      <button
        class="largeButton"
        id="beginChatButton"
        v-if="beginChatButtonShown"
        @click="beginChat"
      >
        {{ t('Begin chat') }}
      </button>
      <button
        class="largeButton"
        id="startButton"
        v-if="startButtonShown"
        :disabled="!startButtonEnabled"
        @click="startRecording"
      >
        {{ t('Start recording') }}
      </button>
      <button
        class="largeButton"
        id="stopButton"
        v-if="stopButtonShown"
        :disabled="!stopButtonEnabled"
        @click="stopRecording"
        >
          {{ t('Stop recording') }}
      </button>
    </p>
    <div id="chatBox">
      <p v-for="(line, index) in contextStore.chatLog" :key="'line_' + index" :class="line.type">
        {{ line.text }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref, watch } from 'vue'
import { useContextStore } from '@/stores/context'
// import { apiClient } from '@/backend'
import { useI18n } from 'vue-i18n'

const contextStore = useContextStore()

const currentLanguage = ref('')
const statusText = ref('')
const statusClass = ref('white-bg')
const beginChatButtonShown = ref(true)
const startButtonShown = ref(false)
const stopButtonShown = ref(false)
const startButtonEnabled = ref(true)
const stopButtonEnabled = ref(true)
const character = ref('teacher')
const age = ref(3)
const echo = ref(false)
const instructions  = ref('')
const replyCount = ref(0)

let audioContext: any
let mediaRecorder: any
let sessionId = ''
let chunks: any[] = []
let state = 'setup'
let server = import.meta.env.VITE_BACKEND_URL
let clientIP = ''

const { t, locale, availableLocales } = useI18n({
  inheritLocale: true,
  useScope: 'global'
})

if (!server) {
  server = 'http://127.0.0.1:8000'
}

onBeforeMount(() => {
  currentLanguage.value = 'fi-FI'
  contextStore.setLanguage('fi-FI')
  fetch('https://api64.ipify.org?format=json')
  .then(response => response.json())
  .then(data => {
    clientIP = data.ip; // This contains the client's IP address
    console.log(`Client IP address: ${clientIP}`);
  })
  .catch(error => {
    console.error('Error fetching client IP:', error);
  });
})

function setCurrentLanguage(code: string) {
  currentLanguage.value = code
}

watch(currentLanguage, function(newValue) {
  contextStore.setLanguage(newValue)
  const localeCode = newValue.split('-')[0]
  console.log(availableLocales)
  console.log(locale.value)
  locale.value = localeCode
  instructions.value = t('basicInstructions')
})

function setState(newState: string) {
  /* states:
      setup
      playback - Playing greeting or response
      ready - Waiting for user to start recording
      recording
      processing - Waiting for response from server
  */
  console.log('setState:', newState)
  state = newState
  statusText.value = t(state)
  if (state == 'playback') {
    beginChatButtonShown.value = false
    startButtonShown.value = true
    startButtonEnabled.value = false
    stopButtonShown.value = false
  } else if (state == 'ready') {
    beginChatButtonShown.value = false
    startButtonShown.value = true
    startButtonEnabled.value = true
    statusClass.value = 'white-bg'
  } else if (state == 'recording') {
    startButtonShown.value = false
    stopButtonShown.value = true
    stopButtonEnabled.value = true
    statusClass.value = 'red-bg'
  } else if (state == 'processing') {
    stopButtonEnabled.value = false
    statusClass.value = 'white-bg'
  } else if (state == 'error') {
    statusClass.value = 'red-bg'
    startButtonEnabled.value = false
    beginChatButtonShown.value = false
  } else {
    console.warn('Unknown state:', state)
    statusClass.value = 'red-bg'
  }
}

function playResponseEnded() {
  if (replyCount.value < 10) {
    setState('ready')
  } else {
    setState('error')
    statusText.value = t('Daily message count exceeded')
  }
}

function startSession() {
  const path = '/api01/start_session'
  const formData = new FormData()
  formData.append('ip',clientIP)
  return fetch(server + path, {
    method: 'POST',
    body: formData,
  })
  .then(function(response) {
    console.log(response)
    return response.json()
  })
  .then(function(data) {
    console.log(data)
    sessionId = data['id']
    replyCount.value = parseInt(data['repliesToday'])
    console.log('sessionId', sessionId)
    if (sessionId === '') {
      console.warn('No session ID received')
      console.log(data['message'])
      setState('error')
      statusText.value = t(data['message'])
    } else {
      playGreeting();
      instructions.value = t('playbackInstructions')
      contextStore.initializeContext(character.value, age.value)
    }
  })
  .catch(function(error) {
    console.error('Error:', error);
    setState('error')
    statusText.value = 'Error starting dession:' + error
  })
}

async function playGreeting() {
  let audioUrl = 'https://public-bucket-jk.s3.eu-central-1.amazonaws.com/hello_who_are_you.mp3'
  if (currentLanguage.value === 'fi-FI') {
    audioUrl = 'https://public-bucket-jk.s3.eu-central-1.amazonaws.com/hei_kuka_sina_olet.mp3'
  }
  const audio = new Audio(audioUrl)
  startButtonEnabled.value = false
  audio.addEventListener('ended', playResponseEnded)
  audio.play()
}

async function playWaitASecond() {
  let audioUrl = 'https://public-bucket-jk.s3.eu-central-1.amazonaws.com/hmm_en.mp3'
  if (currentLanguage.value === 'fi-FI') {
    audioUrl = 'https://public-bucket-jk.s3.eu-central-1.amazonaws.com/odota_hetki_kun_mietin.mp3'
  }
  const audio = new Audio(audioUrl)
  audio.play()
}

function playResponse(audioUrl: string) {
  const audio = new Audio(audioUrl);
  audio.addEventListener('ended', playResponseEnded)
  audio.play();
}

function beginChat() {
  console.log('beginChat')
  setState('playback')
  startSession()
}

function submitRecording(audioBlob: Blob) {
  playWaitASecond()
  const formData = new FormData()
  formData.append('audio', audioBlob)
  formData.append('messages', JSON.stringify(contextStore.messages))
  formData.append('echo', echo.value == true ? 'yes' : '')
  formData.append('language', contextStore.language)
  formData.append('session', sessionId)
  const path = '/api01/submit_audio'
  console.log('submitAudio url:', path)
  console.log('data:', formData)
  fetch(server + path, {
    method: 'POST',
    body: formData,
  })
  .then(function(response) {
    console.log(response)
    return response.json()
  })
  .then(function(data) {
    console.log(data)
    const transcription = data['transcript']
    const responseText = data['responseText']
    console.log('Transcription:', transcription)
    if (!transcription && !responseText) {
      const message = data['message']
      if (message) {
        setState('error')
        statusText.value = message
        return
      }
    }
    contextStore.addChatLine({ type: 'transcribed', text: transcription })
    contextStore.addChatLine({ type: 'response', text: responseText })
    contextStore.addMessage({ 'role': 'user', 'content': transcription })
    contextStore.addMessage({ 'role': 'assistant', 'content': responseText })
    setState('playback')
    playResponse(data['audioUrl']);
    console.log(contextStore.messages);
    replyCount.value = replyCount.value + 1
  })
  .catch(function(error) {
    console.error('Error:', error);
    setState('error')
    statusText.value = 'Error submitting recording:' + error
  })
}

function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
      audioContext = new AudioContext()
      const options = {
        mimeType: "audio/webm"
      }
      mediaRecorder = new MediaRecorder(stream, options)
      setState('recording')
      mediaRecorder.addEventListener('dataavailable', function(event: any) {
        chunks.push(event.data);
      });

      mediaRecorder.addEventListener('stop', function() {
        setState('processing')
        const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });
        // const audioURL = URL.createObjectURL(audioBlob);
        // const audio = new Audio(audioURL);
        // audio.controls = true;
        // document.body.appendChild(audio);
        submitRecording(audioBlob);
      });

      mediaRecorder.start();
    })
    .catch(function(error) {
      console.error('Error accessing microphone:', error);
      setState('error')
      statusText.value = 'Error accessing microphone:' + error
    });
}

function stopRecording() {
  mediaRecorder.stop();
  chunks = [];
  audioContext.close();
}

function keyDownHandler(event: any) {
  console.log('Pressed key', event.code)
  if (event.code === 'Space') {
    if (state === 'ready') {
      startRecording()
    } else if (state === 'setup') {
      beginChat()
    }
  }
}

function keyUpHandler(event: any) {
  console.log('Released key', event.code)
  if (event.code === 'Space') {
    if (state === 'recording') {
      stopRecording()
    }
  }
}

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
</script>

<style scoped>
#content {
  padding: 0rem 2rem 0rem 2rem;
}

.red-bg {
  background-color: #ff2222;
}

.largeButton {
  font: inherit;
  font-size: xx-large;
  text-decoration: none;
  text-transform: uppercase;
  font-weight: bold;
  width: 100%;
  color: white;
  padding: 6rem 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.26);
  margin: 0 0.5rem 0 0;
}

button:disabled {
  color: #cccccc;
  box-shadow: 0 0px 0px rgba(0, 0, 0, 0);
}
.response {
  background-color: #bbbbbb;
  font-size: large;
}

.transcribed {
  background-color: #eeeeee;
  font-size: large;
}

#languageChoice {
  text-align: center;
}

.selectedText {
  font-weight: bold;
}

a {
  text-decoration: none;
  color: black;
  padding: 1rem;
}

a:visited {
  color:  black;
}

a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

#startButton, #beginChatButton {
  background-color: #00aa00;
  border: 2px solid #00aa00;
}

#stopButton {
  background-color: #cc0000;
  border: 2px solid #cc0000;
}

div.settingsTable {
  display: table;
}

div.settingRow {
  display: table-row;
}

label, input, select {
  display: table-cell;
  text-align: left;
  margin-bottom: 1rem;
  margin-left: 1rem;
}

div.settingDescription {
  display: table-cell;
}
</style>
