import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import NavBar from '../NavBar.vue'
import router from '@/router'
import en from '@/locales/en.json'

const messages = {
  'en': en
}

const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages
})

describe('NavBar', () => {
  it('renders properly', () => {
    const wrapper = mount(NavBar, {
      global: {
        plugins: [i18n, router]
      }
    })
    expect(wrapper.text()).toContain('Front')
    expect(wrapper.text()).toContain('About')
    expect(wrapper.get('#navbar-home').text()).toBe('Front')
    expect(wrapper.get('#navbar-about').text()).toBe('About')
  })
})
