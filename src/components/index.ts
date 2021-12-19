import { App } from 'vue'
import GridItem from './GridItem.vue'
import GridLayout from './GridLayout.vue'

export { GridItem, GridLayout }

export const install = (app: App): void => {
  app.component('GridLayout', GridLayout)
  app.component('GridItem', GridItem)
}

export default install
