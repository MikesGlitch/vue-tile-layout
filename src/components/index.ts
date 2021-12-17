import { App } from 'vue'
import GridItem from './GridItem.vue'
import GridLayout from './GridLayout.vue'
import Test from './Test.vue'

export { default as GridItem } from './GridItem.vue'
export { default as GridLayout } from './GridLayout.vue'
export { default as Test } from './Test.vue'

export const install = (app: App): void => {
  app.component('GridLayout', GridLayout)
  app.component('GridItem', GridItem)
  app.component('Test', Test)
}

export default { install }
