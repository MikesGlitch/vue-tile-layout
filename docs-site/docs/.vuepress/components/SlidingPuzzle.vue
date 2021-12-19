<template>
  <h5>Still todo:</h5>
  <ul>
    <li>Max rows doesnt seem to work - 3 rows should be max</li>
    <li>Figure out a way to do rules on whether or not something can move.  Here we want to validate whether something can move to a place</li>
  </ul>

  <grid-layout class="tile-game" v-model:layout="layout" :margin="[0, 0]" :verticalCompact="true" :colNum="3" :maxRows="3" :is-draggable="true" :is-resizable="true" :rowHeight="220">
    <grid-item :class="`tile tile--${item.tile}`" v-for="item in layout" :key="item.i" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i">
      <div style="width: 100%; height: 100%; text-align: center; border: 1px solid black">
        <span>{{ item.i }}</span>
      </div>
    </grid-item>
  </grid-layout>
  <pre>
    {{ layout }}
  </pre>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { GridLayout, GridItem } from 'vue-griddy'

const layout = ref([
  { x: 0, y: 0, w: 1, h: 1, i: '0', tile: '0' },
  { x: 1, y: 0, w: 1, h: 1, i: '1', tile: '1' },
  { x: 2, y: 0, w: 1, h: 1, i: '2', tile: '2' },
  { x: 0, y: 1, w: 1, h: 1, i: '3', tile: '3' },
  { x: 1, y: 1, w: 1, h: 1, i: '4', tile: '4' },
  { x: 2, y: 1, w: 1, h: 1, i: '5', tile: '5' },
  { x: 0, y: 2, w: 1, h: 1, i: '6', tile: '6' },
  { x: 1, y: 2, w: 1, h: 1, i: '7', tile: '7' },
  { x: 2, y: 2, w: 1, h: 1, i: '8', tile: 'empty' },
])
</script>

<style lang="scss">
    .tile-game {
        height: 660px; 
        width: 660px;
        // margin: 0 auto;
        // display: grid;
        // grid-column-end: span 3;
        // grid-gap: 2px;
        // grid-template-areas: 
        //     "A B C"
        //     "D E F"
        //     "G H I";
        
        .tile {
            background: url(https://source.unsplash.com/900x900/?pets,cat,dogs,puppy,kitten);
            background-size: 300%;
        }
        .tile--0 { background-position: top left; }
        .tile--1 { background-position: top center; }
        .tile--2 { background-position: top right; }
        .tile--3 { background-position: center left; }
        .tile--4 { background-position: center; }
        .tile--5 { background-position: center right; }
        .tile--6 { background-position: bottom left; }
        .tile--7 { background-position: bottom center; }
        
        .tile--empty {
            background: transparent;
        }
    }
</style>