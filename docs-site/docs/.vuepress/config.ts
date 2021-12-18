import { defineUserConfig } from 'vuepress'
import type { DefaultThemeOptions } from 'vuepress'

export default defineUserConfig<DefaultThemeOptions>({
  base: '/vue-griddy/',
  bundler: '@vuepress/bundler-vite',
  bundlerConfig: {
    viteOptions: {
      server: {
        fs: {
          strict: false,
        },
      },
    },
  },
  lang: 'en-US',
  title: 'Hello VuePress 1',
  description: 'Just playing around',

  themeConfig: {
    logo: 'https://vuejs.org/images/logo.png',
  },
})