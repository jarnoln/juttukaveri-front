import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'

import RecordAndReply from '../RecordAndReply.vue'
import router from '@/router'
import en from '@/locales/en.json'
import fi from '@/locales/fi.json'

const messages = {
  'en': en,
  'fi': fi
}

const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages
})

describe('NavBar', () => {
  it('renders properly', () => {
    const wrapper = mount(RecordAndReply, {
      global: {
        plugins: [createPinia(), i18n, router]
      }
    })
    expect(wrapper.text()).toContain('Juttukaveri')
    expect(wrapper.get('#beginChatButton').text()).toBe('Begin conversation')
  })
})
