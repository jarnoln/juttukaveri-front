import { defineStore } from 'pinia'
import { type ChatLine, type Message } from  '@/types'

export const useContextStore = defineStore('context', {
  state: () => ({
    language: '',
    messages: [] as Message[],
    chatLog: [] as ChatLine[]
  }),
  actions: {
    clear() {
      this.messages = []
      this.chatLog = []
    },
    setLanguage(language: string) {
      console.log('contextStore::setLanguage: ', language)
      this.language = language
    },
    initializeContext() {
      const age = 3
      let greet = ''
      let context = ''
      if (this.language === 'en-US') {
        greet = 'Hello! Who are you?'
        context = `You are a friendly kindergarten teacher. You are chatting with ${age} year old child.`
      } else if (this.language === 'fi-FI') {
        greet = 'Hei! Kuka sinä olet?'
        context = `Olet ystävällinen lastenopettaja. Keskustelet ${age}-vuotiaan lapsen kanssa.
          Pidä vastaukset lyhyinä ja yksinkertaisina, lapsella on lyhyt keskittymiskyky eikä
          jaksa kuunnella kovin pitkiä vastauksia.
          Vältä vaikeita sanoja.`
      }
      this.chatLog.push({
        type: 'response',
        text: greet
      })
      console.log('Initialized context:', context)
      this.messages = [
        {'role': 'system', 'content': context},
        {'role': 'assistant', 'content': greet},
      ]
    },
    addMessage(message: Message) {
      this.messages.push(message)
    },
    addChatLine(line: ChatLine) {
      this.chatLog.push(line)
    }
  }
})
