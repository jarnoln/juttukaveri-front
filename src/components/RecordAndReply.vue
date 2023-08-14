<script setup lang="ts">
</script>

<template>
  <div id="content">
    <h1>Juttukaveri</h1>

    <h2 id="statusText" class="white-bg"></h2>

    <p id="instructions">
      Tämä on äänikäyttöliittymä OpenAI:n ChatGPT:lle. Suunnattu lähinnä lapsille,
      koska tekstikäyttöliittymä on hieman hankala, jos ei osaa vielä lukea tai kirjoittaa.
      Paina alla olevaa nappia aloittaaksesi.
    </p>
    <p>
      <button class="largeButton" id="beginChatButton">Aloita keskustelu</button>
      <button class="largeButton" id="startButton" hidden>Aloita nauhoitus</button>
      <button class="largeButton" id="stopButton" hidden>Lopeta nauhoitus</button>
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
              disabled>
        Poista alustus lapselle
      </button>
      <label for="selectLanguageMenu">Valitse kieli:</label>
      <select name="language" id="selectLanguageMenu">
        <option value="fi-FI">Suomi</option>
        <option value="en-US">English</option>
        <option value="cmn-CN">Mandarin</option>
      </select>
    </p>
    <div id="chatBox"></div>
  </div>
</template>

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
