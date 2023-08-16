import { defineStore } from 'pinia'

export const useContextStore = defineStore('context', {
  state: () => ({
    language: '',
  }),
  actions: {
    setLanguage(language: string) {
      this.language = language
    }
  }
})
