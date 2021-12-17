<template>
  {{ layout }}
  <!-- {{ GridItem }} -->
  <!-- <GridLayout v-model:layout="layout" :is-draggable="true" :is-resizable="true">
    <GridItem v-for="item in layout" :key="item.i" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i">
      <div style="width: 100%; height: 100%; text-align: center; border: 1px solid black">
        <span>{{ item.i }}</span>
        <p>Maybe put layout item settings here and allow configuring them in the demo</p>
      </div>
    </GridItem>
</GridLayout> -->
</template>

<script lang="ts" setup>
import { ref } from 'vue'
// import { GridItem } from 'vue-griddy'

const test = 'Example 1 hello'
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
