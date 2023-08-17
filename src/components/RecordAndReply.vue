<template>
  <div id="content">
    <h1>Juttukaveri</h1>

    <h2 id="statusText" :class="statusClass">{{ statusText }}</h2>

    <p id="instructions">{{ instructions }}</p>

    <div id="settings" v-if="state === 'setup'" class="settingsTable">
      <div class="settingRow">
        <label for="selectLanguageMenu">Valitse kieli:</label>
        <select name="language" id="selectLanguageMenu" v-model="currentLanguage">
          <option value="fi-FI">Suomi</option>
          <option value="en-US">English</option>
          <option value="cmn-CN">Mandarin</option>
        </select>
      </div>
      <div class="settingRow">
        <label for="selectCharacterMenu">Valitse rooli:</label>
        <select name="character" id="selectCharacterMenu" v-model="character">
          <option value="teacher">Päiväkodin opettaja</option>
          <option value="none">Ei roolia</option>
        </select>
      </div>
      <div class="settingRow" v-if="character == 'teacher'">
        <label for="inputAge">Lapsen ikä:</label>
        <input type="number" min="1" max="18" name="age" id="inputAge" v-model="age" />
      </div>
      <div class="settingRow">
        <label for="echoCheckbox">Kaiutus</label>
        <input type="checkbox" id="echoCheckbox" checked=false name="echo" v-model="echo">
        <div class="settingDescription">Vain toistaa, mitä kuulee. Ei käytä ChatGPT:tä.</div>
      </div>
    </div>

    <p>
      <button
        class="largeButton"
        id="beginChatButton"
        v-if="beginChatButtonShown"
        @click="beginChat"
      >
        Aloita keskustelu
      </button>
      <button
        class="largeButton"
        id="startButton"
        v-if="startButtonShown"
        :disabled="!startButtonEnabled"
        @click="startRecording"
      >
        Aloita nauhoitus
      </button>
      <button
        class="largeButton"
        id="stopButton"
        v-if="stopButtonShown"
        :disabled="!stopButtonEnabled"
        @click="stopRecording"
        >
        Lopeta nauhoitus
      </button>
    </p>
    <div id="chatBox">
      <p v-for="line in contextStore.chatLog" :class="line.type">
        {{ line.text }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref, watch } from 'vue'
import { useContextStore } from '@/stores/context'
import { apiClient } from '@/backend'

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
const instructions = ref('Tämä on äänikäyttöliittymä OpenAI:n ChatGPT:lle. Suunnattu lähinnä lapsille, koska tekstikäyttöliittymä on hieman hankala, jos ei osaa vielä lukea tai kirjoittaa. Paina alla olevaa nappia aloittaaksesi.')
let audioContext: any
let mediaRecorder: any
let sessionId = ''
let chunks: any[] = []
let state = 'setup'
let server = import.meta.env.VITE_BACKEND_URL
if (!server) {
  server = 'http://127.0.0.1:8000'
}


onBeforeMount(() => {
  currentLanguage.value = 'fi-FI'
  contextStore.setLanguage('fi-FI')
})

watch(currentLanguage, function(newValue) {
  contextStore.setLanguage(newValue)
})

function setState(newState: string) {
  /* states:
      setup
      playback - Playing greeting or response
      ready: -Waiting for user to start recording
      recording: 
      processing: - Waiting for response from server
  */
  console.log('setState:', newState)
  state = newState
  if (state == 'playback') {
    beginChatButtonShown.value = false
    startButtonShown.value = true
    startButtonEnabled.value = false
    stopButtonShown.value = false
    statusText.value = 'Odota'
  } else if (state == 'ready') {
    beginChatButtonShown.value = false
    startButtonShown.value = true
    startButtonEnabled.value = true
    statusText.value = 'Valmis'
    statusClass.value = 'white-bg'
  } else if (state == 'recording') {
    startButtonShown.value = false
    stopButtonShown.value = true
    stopButtonEnabled.value = true
    statusText.value = 'Tallennus käynnissä'
    statusClass.value = 'red-bg'
  } else if (state == 'processing') {
    stopButtonEnabled.value = false
    statusText.value = 'Odota hetki, kun mietin.'
    statusClass.value = 'white-bg'
  } else if (state == 'error') {
    statusText.value = 'Virhetilanne'
    statusClass.value = 'red-bg'
    startButtonEnabled.value = false
  } else {
    console.warn('Unknown state:', state)
    statusText.value = state
    statusClass.value = 'red-bg'
  }
}

function playResponseEnded() {
  setState('ready')
}

function startSession() {
  const path = '/api01/start_session'
  const formData = new FormData()
  console.log('startSession path:', path)
  apiClient.post(path, formData)
  .then(function(response) {
    console.log(response)
    console.log(response.data)
    sessionId = response.data['id']
    console.log('sessionId', sessionId)
  })
}

function playGreeting() {
  const audioUrl = 'https://public-bucket-jk.s3.eu-central-1.amazonaws.com/hei_kuka_sina_olet.mp3'
  const audio = new Audio(audioUrl)
  startButtonEnabled.value = false
  audio.addEventListener('ended', playResponseEnded)
  audio.play()
}

function playWaitASecond() {
  const audioUrl = 'https://public-bucket-jk.s3.eu-central-1.amazonaws.com/odota_hetki_kun_mietin.mp3'
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
  playGreeting();
  startSession();
  instructions.value = `Paina alla olevaa nappia aloittaaksesi nauhoituksen ja kun olet valmis, paina
      pysäytysnappia lopettaaksesi nauhoituksen. Vaihtoehtoisesti voit aloittaa nauhoituksen painamalla välilyönnin
      pohjaan ja päästää sen ylös, kun olet valmis. Sen jälkeen tallenne lähetetään ChatGPT:lle ja jonkin ajan kuluttua
      pitäisi kuulua vastaus.`
  contextStore.initializeContext(character.value, age.value)
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
    contextStore.addChatLine({ type: 'transcribed', text: transcription })
    contextStore.addChatLine({ type: 'response', text: responseText })
    contextStore.addMessage({ 'role': 'user', 'content': transcription })
    contextStore.addMessage({ 'role': 'assistant', 'content': responseText })
    setState('playback')
    playResponse(data['audioUrl']);
    console.log(contextStore.messages);
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
