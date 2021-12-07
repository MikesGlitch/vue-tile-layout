<template>
  <div>
    {{ msg }}
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
