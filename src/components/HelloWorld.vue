<template>
  <div>
    {{ msg }}
    DON'T FORGET TO TAKE FROM THE VUE3 BRANCH OF VUE-GRID-LAYOUT
  </div>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue'

defineProps({
  msg: {
    type: String,
    required: true,
  },
})
</script>
