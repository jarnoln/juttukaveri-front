import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'

import App from './App.vue'
import router from './router'
import cmn from './locales/cmn.json'
import en from './locales/en.json'
import fi from './locales/fi.json'

const messages = {
  'cmn': cmn,
  'en': en,
  'fi': fi
}

const i18n = createI18n({
  locale: 'fi',
  fallbackLocale: 'en',
  messages
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')
