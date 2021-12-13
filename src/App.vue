<template>
  <h1>DON'T FORGET TO TAKE FROM THE VUE3 BRANCH OF VUE-GRID-LAYOUT</h1>
  <h5>TODOS:</h5>
  <ul>
    <li>Remove any features you dont want and make some examples</li>
    <li>Rename the component and do a full separation from vue-grid-layout</li>
    <li>Potentially start adding VueUse and removing some of the code in the utils</li>
    <li>Move this page to website documentation? It's basically what I want but I need the package separate</li>
  </ul>

  <div>
    <h1>Settings</h1>
    <h5>Layout</h5>
    <div>
      <label for="autoSize">AutoSize</label>
      <input id="autoSize" v-model="layoutSettings.autoSize" type="checkbox" />
    </div>
    <div>
      <label for="colNum">colNum</label>
      <input id="colNum" v-model="layoutSettings.colNum" type="number" />
    </div>
    <div>
      <label for="rowHeight">rowHeight</label>
      <input id="rowHeight" v-model="layoutSettings.rowHeight" type="number" />
    </div>
    <div>
      <label for="maxRows">maxRows</label>
      <input id="maxRows" v-model="layoutSettings.maxRows" type="number" />
    </div>
    <div>
      <label for="isDraggable">isDraggable</label>
      <input id="isDraggable" v-model="layoutSettings.isDraggable" type="checkbox" />
    </div>
    <div>
      <label for="isResizable">isResizable</label>
      <input id="isResizable" v-model="layoutSettings.isResizable" type="checkbox" />
    </div>
    <div>
      <label for="isResizable">isMirrored</label>
      <input id="isResizable" v-model="layoutSettings.isMirrored" type="checkbox" />
    </div>
    <div>
      <label for="useCssTransforms">useCssTransforms</label>
      <input id="useCssTransforms" v-model="layoutSettings.useCssTransforms" type="checkbox" />
    </div>
    <div>
      <label for="verticalCompact">verticalCompact</label>
      <input id="verticalCompact" v-model="layoutSettings.verticalCompact" type="checkbox" />
    </div>
    <div>
      <label for="responsive">responsive</label>
      <input id="responsive" v-model="layoutSettings.responsive" type="checkbox" />
    </div>
    <div>
      <label for="preventCollision">preventCollision</label>
      <input id="preventCollision" v-model="layoutSettings.preventCollision" type="checkbox" />
    </div>
    <div>
      <label for="useStyleCursor">useStyleCursor</label>
      <input id="useStyleCursor" v-model="layoutSettings.useStyleCursor" type="checkbox" />
    </div>
    <button @click="reloadWithDelay">Reload with delay</button>
  </div>

  <grid-layout
    v-model:layout="layout"
    :auto-size="layoutSettings.autoSize"
    :col-num="layoutSettings.colNum"
    :row-height="layoutSettings.rowHeight"
    :max-rows="layoutSettings.maxRows"
    :is-draggable="layoutSettings.isDraggable"
    :is-resizable="layoutSettings.isResizable"
    :is-mirrored="layoutSettings.isMirrored"
    :use-css-transforms="layoutSettings.useCssTransforms"
    :vertical-compact="layoutSettings.verticalCompact"
    :responsive="layoutSettings.responsive"
    :prevent-collision="layoutSettings.preventCollision"
    :use-style-cursor="layoutSettings.useStyleCursor"
  >
    <grid-item v-for="item in layout" :key="item.i" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i">
      <div style="width: 100%; height: 100%; text-align: center; border: 1px solid black">
        <span>{{ item.i }}</span>
        <p>Maybe put layout item settings here and allow configuring them in the demo</p>
      </div>
    </grid-item>
  </grid-layout>

  <pre>
    {{ layout }}
  </pre>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import GridItem from './components/GridItem.vue'
import GridLayout from './components/GridLayout.vue'

const layoutSettings = ref({
  autoSize: true,
  colNum: 12,
  rowHeight: 50,
  maxRows: Infinity,
  isDraggable: true,
  isResizable: true,
  isMirrored: false,
  useCssTransforms: true,
  verticalCompact: true,
  responsive: false,
  preventCollision: false,
  useStyleCursor: true,
})

const reloadWithDelay = () => {
  const oldLayout = [...layout.value]
  layout.value = []
  setTimeout(() => {
    layout.value = oldLayout
  }, 3000)
}

const layout = ref([
  { x: 0, y: 0, w: 2, h: 2, i: '0' },
  { x: 2, y: 0, w: 2, h: 4, i: '1' },
  { x: 4, y: 0, w: 2, h: 5, i: '2' },
  { x: 6, y: 0, w: 2, h: 3, i: '3' },
  { x: 2, y: 4, w: 2, h: 3, i: '4' },
  { x: 4, y: 5, w: 2, h: 3, i: '5' },
  { x: 0, y: 2, w: 2, h: 5, i: '6' },
  { x: 2, y: 7, w: 2, h: 5, i: '7' },
  { x: 4, y: 8, w: 2, h: 5, i: '8' },
  { x: 6, y: 3, w: 2, h: 4, i: '9' },
  { x: 0, y: 7, w: 2, h: 4, i: '10' },
  { x: 2, y: 19, w: 2, h: 4, i: '11' },
  { x: 0, y: 14, w: 2, h: 5, i: '12' },
  { x: 2, y: 14, w: 2, h: 5, i: '13' },
  { x: 4, y: 13, w: 2, h: 4, i: '14' },
  { x: 6, y: 7, w: 2, h: 4, i: '15' },
  { x: 0, y: 19, w: 2, h: 5, i: '16' },
  { x: 8, y: 0, w: 2, h: 2, i: '17' },
  { x: 0, y: 11, w: 2, h: 3, i: '18' },
  { x: 2, y: 12, w: 2, h: 2, i: '19' },
])
</script>
