import { defineClientAppEnhance } from '@vuepress/client'
import SlidingPuzzle from './components/SlidingPuzzle.vue'
import 'vue-griddy/style' // temporary until we get the styles bundled in with js

export default defineClientAppEnhance(({ app, router, siteData }) => {
  app.component('SlidingPuzzle', SlidingPuzzle)
})