<template>
  <div id="content">
    <h1>Juttukaveri</h1>

    <h2 id="statusText" :class="statusClass">{{ statusText }}</h2>

    <p id="instructions">{{ instructions }}</p>
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
    <p>
      <span style="margin-right: 5rem">
        <input type="checkbox" id="echoCheckbox" checked=false name="echo">
        <label for="echoCheckbox">Kaiku</label>
        <span> - Vain toistaa, mitä kuulee. Ei käytä ChatGPT:tä.</span>
      </span>
      <button class="right" id="playButton">Toista alkutervehdys</button>
      <button class="right"
              id="clearContextButton"
              title="Poistaa kontekstin, jossa ChatGPT alustetaan vastaamaan lapselle. Sen sijaan se vastaa kuten normaalisti aikuisille."
              :disabled="!clearContextButtonEnabled">
        Poista alustus lapselle
      </button>
      <label for="selectLanguageMenu">Valitse kieli:</label>
      <select name="language" id="selectLanguageMenu">
        <option value="fi-FI">Suomi</option>
        <option value="en-US">English</option>
        <option value="cmn-CN">Mandarin</option>
      </select>
    </p>
    <div id="chatBox">
      <p v-for="line in chatLog" :class="line.type">
        {{ line.text }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

interface ChatLine {
  type: string,
  text: string
}

interface Message {
  role: string,
  content: string
}

const statusText = ref('Valmis')
const statusClass = ref('white-bg')
const language = ref('fi-FI')
const chatLog = ref<ChatLine[]>([])
const beginChatButtonShown = ref(true)
const startButtonShown = ref(false)
const stopButtonShown = ref(false)
const startButtonEnabled = ref(true)
const stopButtonEnabled = ref(true)
const clearContextButtonEnabled = ref(false)
const instructions = ref('Tämä on äänikäyttöliittymä OpenAI:n ChatGPT:lle. Suunnattu lähinnä lapsille, koska tekstikäyttöliittymä on hieman hankala, jos ei osaa vielä lukea tai kirjoittaa. Paina alla olevaa nappia aloittaaksesi.')
let audioContext: any
let mediaRecorder: any
let messages: Message[] = []
let sessionId = ''
let status = 'ready'
let chunks: any[] = []
let echo = ''

function enableRecord() {
  startButtonEnabled.value = true
}

function startSession() {
  const url = '/api01/start_session';
  const formData = new FormData();
  console.log('startSession url:', url);
  /* fetch(url, {
    method: 'POST',
    body: formData,
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    console.log(data)
    sessionId = data['id']
    console.log('sessionId', sessionId)
  }) */
}

function playGreeting() {
  const audioUrl = 'https://public-bucket-jk.s3.eu-central-1.amazonaws.com/hei_kuka_sina_olet.mp3'
  const audio = new Audio(audioUrl)
  startButtonEnabled.value = false
  audio.addEventListener('ended', enableRecord)
  audio.play()
}

function playWaitASecond() {
  const audioUrl = 'https://public-bucket-jk.s3.eu-central-1.amazonaws.com/odota_hetki_kun_mietin.mp3'
  const audio = new Audio(audioUrl)
  audio.play()
}

function playResponse(audioUrl: string) {
  const audio = new Audio(audioUrl);
  audio.addEventListener('ended', enableRecord)
  audio.play();
}

function initializeContext(language: string) {
  const age = 3
  let greet = ''
  let context = ''
  if (language === 'en-US') {
    greet = 'Hello! Who are you?'
    context = `You are a friendly kindergarten teacher. You are chatting with ${age} year old child.`
  } else if (language === 'fi-FI') {
    greet = 'Hei! Kuka sinä olet?'
    context = `Olet ystävällinen lastenopettaja. Keskustelet ${age}-vuotiaan lapsen kanssa.
      Pidä vastaukset lyhyinä ja yksinkertaisina, lapsella on lyhyt keskittymiskyky eikä
      jaksa kuunnella kovin pitkiä vastauksia.
      Vältä vaikeita sanoja.`
  }
  chatLog.value.push({
    type: 'response',
    text: greet
  })

  console.log('Initialized context:', context)
  return [
    {'role': 'system', 'content': context},
    {'role': 'assistant', 'content': greet},
  ];
}

function beginChat() {
  console.log('beginChat')
  playGreeting();
  startSession();
  beginChatButtonShown.value = false
  startButtonShown.value = true
  clearContextButtonEnabled.value = true
  instructions.value = `Paina alla olevaa nappia aloittaaksesi nauhoituksen ja kun olet valmis, paina
    pysäytysnappia lopettaaksesi nauhoituksen. Vaihtoehtoisesti voit aloittaa nauhoituksen painamalla välilyönnin
    pohjaan ja päästää sen ylös, kun olet valmis. Sen jälkeen tallenne lähetetään ChatGPT:lle ja jonkin ajan kuluttua
    pitäisi kuulua vastaus.`
  messages = initializeContext(language.value)
}

function submitRecording(audioBlob: any) {
  playWaitASecond()
  const formData = new FormData()
  formData.append('audio', audioBlob)
  formData.append('messages', JSON.stringify(messages))
  formData.append('echo', echo)
  formData.append('language', language.value)
  formData.append('session', sessionId)
  const url = '/api01/submit_audio'
  console.log('submitAudio url:', url)
  console.log('data:', formData)
  /* fetch(url, {
    method: 'POST',
    body: formData,
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    console.log(data)
    const transcription = data['transcript'];
    const responseText = data['responseText'];
    console.log('Transcription:', transcription);
    document.getElementById('statusText').innerHTML = 'Valmis';
    startButton.removeAttribute('hidden');
    startButton.setAttribute('disabled', '');
    stopButton.removeAttribute('disabled');
    stopButton.setAttribute('hidden', '');
    const transcribedContainer = document.createElement("p");
    transcribedContainer.classList.add('transcribed')
    transcribedContainer.innerHTML = transcription;
    const responseContainer = document.createElement("p");
    responseContainer.classList.add('response')
    responseContainer.innerHTML = responseText;
    chatBox.prepend(transcribedContainer);
    chatBox.prepend(responseContainer);

    messages.push({ 'role': 'user', 'content': transcription })
    messages.push({ 'role': 'assistant', 'content': responseText })
    playResponse(data['audioUrl']);
    console.log(messages);
    status = 'ready';
    document.getElementById('statusText').innerHTML = 'Valmis';
  })
  .catch(function(error) {
    console.error('Error:', error);
    status = 'error';
  }); */
}

function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
      audioContext = new AudioContext()
      const options = {
        mimeType: "audio/webm"
      }
      mediaRecorder = new MediaRecorder(stream, options)
      status = 'recording'
      startButtonShown.value = false
      stopButtonShown.value = true
      statusText.value = 'Tallennus käynnissä'
      statusClass.value = 'red-bg'
      mediaRecorder.addEventListener('dataavailable', function(event) {
        chunks.push(event.data);
      });

      mediaRecorder.addEventListener('stop', function() {
        status = 'processing';
        stopButtonEnabled.value = false
        statusText.value = 'Odota hetki, kun mietin.'
        statusClass.value = 'white-bg'
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
      statusText.value = 'Error accessing microphone:' + error
      console.error('Error accessing microphone:', error);
    });
}

function stopRecording() {
  mediaRecorder.stop();
  status = 'stopped';
  chunks = [];
  audioContext.close();
}

function keyDownHandler(event: any) {
  console.log('Pressed key', event.code)
  if (event.code === 'Space') {
    if (status === 'ready') {
      startRecording()
    }
  }
}

function keyUpHandler(event: any) {
  console.log('Released key', event.code)
  if (event.code === 'Space') {
    if (status === 'recording') {
      stopRecording()
    }
  }
}

function clearContext() {
  messages = []
}

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
</style>
