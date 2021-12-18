import { defineClientAppEnhance } from '@vuepress/client'
import Example1 from './components/Example1.vue'

export default defineClientAppEnhance(({ app, router, siteData }) => {
  app.component('Example1', Example1)
})