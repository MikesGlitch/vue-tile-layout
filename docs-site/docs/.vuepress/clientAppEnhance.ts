import { defineClientAppEnhance } from '@vuepress/client'
import SlidingPuzzle from './components/SlidingPuzzle.vue'
import 'vue-griddy/dist/style.css'

export default defineClientAppEnhance(({ app, router, siteData }) => {
  app.component('SlidingPuzzle', SlidingPuzzle)
})