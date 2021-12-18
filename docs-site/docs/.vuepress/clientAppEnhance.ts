import { defineClientAppEnhance } from '@vuepress/client'
// import { Test } from 'vue-griddy'
// import install from 'vue-griddy'
// import VueGriddy from 'vue-griddy'
import Example1 from './components/Example1.vue'
// import VueGridLayout from 'vue-grid-layout'

export default defineClientAppEnhance(({ app, router, siteData }) => {
  // app.use(VueGridLayout)
  // app.component('Test', Test)
  // app.use(VueGriddy)
  app.component('Example1', Example1)
})