<template>
  <h5>Still todo:</h5>
  <ul>
    <li>MaxRows only applies to items when dragging or resizing, if you drag to position 0,0 when the column already has the max rows, it will allow it and the col will have one over the max rows</li>
    <li>Figure out a way to do rules on whether or not something can move. Here we want to validate whether something can move to a place</li>
    <li>https://github.com/MikesGlitch/agnostos/blob/master/pet-dating/sapper-ui/src/components/slidingPuzzle.svelte</li>
    <li>May need to create an event to allow re-structuring on the layout based on a drag position. Instead of it default to a "stack" it needs to allow configuration to potentially allow the tile to switch places</li>
  </ul>

<div ref="tileGameContainer">
  <grid-layout
    class="tile-game"
    :style="tileGameStyle"
    v-model:layout="layout"
    :margin="[0, 0]"
    :verticalCompact="true"
    :colNum="numTiles"
    :maxRows="numTiles"
    :is-draggable="true"
    :is-resizable="false"
    :rowHeight="tileWidth"
  >
    <grid-item
      :class="`tile tile--${item.tile}`"
      v-for="item in layout"
      :key="item.i"
      :x="item.x"
      :y="item.y"
      :w="item.w"
      :h="item.h"
      :i="item.i"
    >
      <div style="width: 100%; height: 100%; text-align: center; border: 1px solid black">
        <span>{{ item.i }}</span>
      </div>
    </grid-item>
  </grid-layout>
  </div>
  <pre>
    {{ layout }}
  </pre>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { GridLayout, GridItem } from 'vue-griddy'

const tileWidth = ref(100)
const numTiles = 3
const tileGameStyle = computed(() => {
  const fullWidth = tileWidth * numTiles
  return { width: fullWidth + 'px', height: fullWidth + 'px' }
})

const tileGameContainer = ref<HtmlDivElement | null>(null)

const layout = ref([
  { x: 0, y: 0, w: 1, h: 1, i: '0', tile: '0' },
  { x: 1, y: 0, w: 1, h: 1, i: '1', tile: '1' },
  { x: 2, y: 0, w: 1, h: 1, i: '2', tile: '2' },
  { x: 0, y: 1, w: 1, h: 1, i: '3', tile: '3' },
  { x: 1, y: 1, w: 1, h: 1, i: '4', tile: '4' },
  { x: 2, y: 1, w: 1, h: 1, i: '5', tile: '5' },
  { x: 0, y: 2, w: 1, h: 1, i: '6', tile: '6' },
  { x: 1, y: 2, w: 1, h: 1, i: '7', tile: '7' },
  { x: 2, y: 2, w: 1, h: 1, i: '8', tile: 'empty' }, // Empty - needs to be empty tile to allow for dragging on top of
])

const setupBoard = () => {  
    if (tileGameContainer.value) {
      // Adjusting the size of the tiles etc based on the size of the container
      tileWidth.value = tileGameContainer.value.offsetWidth / numTiles
    }
}

onMounted(() => {
  setupBoard()
  window.addEventListener('resize', (event) => setupBoard(), true)
})
</script>

<style lang="scss">
.tile-game {
  .tile {
    background: url(https://source.unsplash.com/900x900/?pets,cat,dogs,puppy,kitten);
    background-size: 300%;
  }
  .tile--0 {
    background-position: top left;
  }
  .tile--1 {
    background-position: top center;
  }
  .tile--2 {
    background-position: top right;
  }
  .tile--3 {
    background-position: center left;
  }
  .tile--4 {
    background-position: center;
  }
  .tile--5 {
    background-position: center right;
  }
  .tile--6 {
    background-position: bottom left;
  }
  .tile--7 {
    background-position: bottom center;
  }

  .tile--empty {
    background: transparent;
  }
}
</style>