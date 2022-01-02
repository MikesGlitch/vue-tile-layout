<template>
  <div ref="tileGameContainer">
    <grid-layout
      v-model:layout="layout"
      class="tile-game"
      :style="tileGameStyle"
      :margin="[0, 0]"
      :vertical-compact="true"
      :col-num="numTiles"
      :max-rows="numTiles"
      :is-draggable="true"
      :is-resizable="false"
      :row-height="tileWidth"
      :prevent-collision="true"
    >
      <grid-item
        v-for="item in layout"
        :key="item.i"
        :class="`tile tile--${item.tile}`"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        :static="item.static"
        :is-draggable="item.isDraggable"
        @move="onMove"
        @moved="onMoved"
      >   
      </grid-item>
    </grid-layout>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { GridLayout, GridItem } from 'vue-tile-layout'

const tileWidth = ref(100)
const numTiles = 3
const tileGameStyle = computed(() => {
  const fullWidth = tileWidth.value * numTiles
  return { width: fullWidth + 'px', height: fullWidth + 'px' }
})

const tileGameContainer = ref<HTMLDivElement | null>(null)

// Todo - get the types
const layout = ref<{ x: number, y: number, w: number, h: number, i: string, tile: string, static?: boolean, isDraggable?: boolean }[]>([
  { x: 0, y: 1, w: 1, h: 1, i: '0', tile: '0' },
  { x: 0, y: 0, w: 1, h: 1, i: '1', tile: '1' },
  { x: 1, y: 1, w: 1, h: 1, i: '2', tile: '2' },
  { x: 2, y: 1, w: 1, h: 1, i: '3', tile: '3' },
  { x: 1, y: 2, w: 1, h: 1, i: '4', tile: '4' },
  { x: 2, y: 0, w: 1, h: 1, i: '5', tile: '5' },
  { x: 0, y: 2, w: 1, h: 1, i: '6', tile: '6' },
  { x: 2, y: 2, w: 1, h: 1, i: '7', tile: '7' },
  { x: 1, y: 0, w: 1, h: 1, i: '8', tile: 'empty' }, // Empty tile
])

const allowTileToMove = (x: number, y: number) => {
  const item = layout.value.find((item) => item.x === x && item.y === y)
  if (item) {
    item.static = false
    item.isDraggable = true
  }
}

const onMove = (i: string, newX: number, newY: number) => {
  let layoutItemMovingFrom = layout.value.find((layoutItem) => layoutItem.i === i)!
  
  // it's only valid to move to the empty tile
  let emptyTile = layout.value.find((layoutItem) => layoutItem.tile === 'empty')!

  const isMovingHorizontally = newX >= emptyTile.x && newX < emptyTile.x + emptyTile.w && layoutItemMovingFrom.y == emptyTile.y && i != emptyTile.i
  if (isMovingHorizontally) {
    let initialX = layoutItemMovingFrom.x
    let finalX = emptyTile.x
    layoutItemMovingFrom.x = finalX
    emptyTile.x = initialX
  }

  const isMovingVertically = newY >= emptyTile.y && newY < emptyTile.y + 1 && layoutItemMovingFrom.x == emptyTile.x && i != emptyTile.i
  if (isMovingVertically) {
    let initialY = layoutItemMovingFrom.y
    let finalY = emptyTile.y
    layoutItemMovingFrom.y = finalY
    emptyTile.y = initialY
  }
}

const onMoved = () => setupBoard()

const setupBoard = () => {
  layout.value.forEach((item) => {
    item.static = true
    item.isDraggable = false
  })

  const emptyTile = layout.value.find((item) => item.tile === 'empty')!
  emptyTile.isDraggable = false
  emptyTile.static = false

  // get positions that can move into the empty tile
  // dragging x when it's 1 on either side
  const leftSide = emptyTile.x - 1
  const rightSide = emptyTile.x + 1
  const validLeftX = leftSide >= 0 ? leftSide : undefined
  const validRightX = rightSide <= numTiles - 1 ? rightSide : undefined

  if (validLeftX !== undefined) {
    allowTileToMove(validLeftX, emptyTile.y)
  }

  if (validRightX !== undefined) {
    allowTileToMove(validRightX, emptyTile.y)
  }

  const bottomSide = emptyTile.y - 1
  const topSide = emptyTile.y + 1
  const validBottomY = bottomSide >= 0 ? bottomSide : undefined
  const validTopY = topSide <= numTiles - 1 ? topSide : undefined

  if (validBottomY !== undefined) {
    allowTileToMove(emptyTile.x, validBottomY)
  }

  if (validTopY !== undefined) {
    allowTileToMove(emptyTile.x, validTopY)
  }
}

const adjustTileSize = () => {
  if (tileGameContainer.value) {
    // Adjusting the size of the tiles etc based on the size of the container
    tileWidth.value = tileGameContainer.value.offsetWidth / numTiles
  }
}

onMounted(() => {
  adjustTileSize()
  window.addEventListener('resize', () => adjustTileSize(), true)
  setupBoard()
})
</script>

<style lang="scss">
.tile-game {
  .tile {
    background: url(https://source.unsplash.com/900x900/?pets,cat,dogs,puppy,kitten);
    background-size: 300%;
    border: 1px solid black;
    width: 100%; 
    height: 100%; 
    text-align: center;
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
    border: none;
  }
}
</style>
