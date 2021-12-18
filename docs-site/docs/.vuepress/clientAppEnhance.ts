import { defineClientAppEnhance } from '@vuepress/client'
// import { install } from 'vue-griddy'
import vueGriddy from 'vue-griddy'
// import { Test } from 'vue-griddy'
import Example1 from './components/Example1.vue'

export default defineClientAppEnhance(({ app, router, siteData }) => {
  app.use(vueGriddy)
  app.component('Example1', Example1)
})