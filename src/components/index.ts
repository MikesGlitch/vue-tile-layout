import { App } from 'vue'
import GridItem from './GridItem.vue'
import GridLayout from './GridLayout.vue'

// Install to allow us to do setup via app.use(VueTileLayout)
export const install = (app: App): void => {
  app.component('GridLayout', GridLayout)
  app.component('GridItem', GridItem)
}

// Defualt export is install so we have access to VueTileLayout (for install)
export default install
