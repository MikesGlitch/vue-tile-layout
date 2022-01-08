<template>
  <div ref="item" class="vue-grid-layout" :style="mergedStyle">
    <slot></slot>
    <grid-item
      v-show="isDragging"
      class="vue-grid-placeholder"
      :x="placeholder.x"
      :y="placeholder.y"
      :w="placeholder.w"
      :h="placeholder.h"
      :i="placeholder.i"
    ></grid-item>
  </div>
</template>

<script lang="ts" setup>
import mitt from 'mitt'
import { watch, nextTick, onBeforeUnmount, onBeforeMount, onMounted, ref, reactive, provide } from 'vue'

import { useResizeObserver } from '@vueuse/core'

import {
  bottom,
  compact,
  getLayoutItem,
  moveElement,
  validateLayout,
  cloneLayout,
  getAllCollisions,
  LayoutItemRequired,
} from '@/helpers/utils'

import {
  getBreakpointFromWidth,
  getColsFromBreakpoint,
  findOrGenerateResponsiveLayout,
} from '@/helpers/responsiveUtils'

import GridItem from './GridItem.vue'
import { DragItemEvent, Events, ResizeItemEvent } from '@/helpers/eventBus'

const props = defineProps({
  // If true, the container height swells and contracts to fit contents
  autoSize: {
    type: Boolean,
    default: true,
  },
  colNum: {
    type: Number,
    default: 12,
  },
  rowHeight: {
    type: Number,
    default: 150,
  },
  maxRows: {
    type: Number,
    default: Infinity, // MaxRows only applies to items when dragging or resizing, if you drag to position 0,0 when the column already has the max rows, it will allow it and the col will have one over the max rows
  },
  margin: {
    type: Array,
    default: function () {
      return [10, 10]
    },
  },
  isDraggable: {
    type: Boolean,
    default: true,
  },
  isResizable: {
    type: Boolean,
    default: true,
  },
  isMirrored: {
    type: Boolean,
    default: false,
  },
  useCssTransforms: {
    type: Boolean,
    default: true,
  },
  verticalCompact: {
    type: Boolean,
    default: true,
  },
  layout: {
    type: Array,
    required: true,
  },
  responsive: {
    type: Boolean,
    default: false,
  },
  responsiveLayouts: {
    type: Object,
    default: function () {
      return {}
    },
  },
  breakpoints: {
    type: Object,
    default: function () {
      return { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
    },
  },
  cols: {
    type: Object,
    default: function () {
      return { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }
    },
  },
  preventCollision: {
    type: Boolean,
    default: false,
  },
  useStyleCursor: {
    type: Boolean,
    default: true,
  },
})

const eventBus = mitt<Events>()
provide('eventBus', eventBus)
provide('layout', props)
const width = ref<number>(100) // default 100 - same on grid item
const mergedStyle = ref({})
let lastLayoutLength = 0
const isDragging = ref(false)
const placeholder = reactive<LayoutItemRequired>({
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  i: '-1',
})
let layouts: any = {} // array to store all layouts from different breakpoints
let lastBreakpoint: any = null // store last active breakpoint
let originalLayout: any = null // store original Layout
const item = ref<HTMLDivElement | null>(null)

const emit = defineEmits<{
  (e: 'layout-ready', layout: Array<unknown>): void
  (e: 'update:layout', layout: Array<unknown> | null): void
  (e: 'layout-created', layout: Array<unknown> | null): void
  (e: 'layout-before-mount', layout: Array<unknown> | null): void
  (e: 'layout-mounted', layout: Array<unknown> | null): void
  (e: 'layout-updated', layout: Array<unknown> | null): void
  (e: 'breakpoint-changed', newBreakpoint: string, layout: Array<unknown> | null): void
}>()

watch(
  () => width.value,
  (newval, oldval) => {
    nextTick(function () {
      eventBus.emit('updateWidth', { width: width.value })
      if (oldval === null) {
        /*
            If oldval == null is when the width has never been
            set before. That only occurs when mouting is
            finished, and onContainerResize has been called and
            this.width has been changed the first time after it
            got set to null in the constructor. It is now time
            to issue layout-ready events as the GridItems have
            their sizes configured properly.

            The reason for emitting the layout-ready events on
            the next tick is to allow for the newly-emitted
            updateWidth event (above) to have reached the
            children GridItem-s and had their effect, so we're
            sure that they have the final size before we emit
            layout-ready (for this GridLayout) and
            item-layout-ready (for the GridItem-s).

            This way any client event handlers can reliably
            invistigate stable sizes of GridItem-s.
        */
        nextTick(() => {
          emit('layout-ready', props.layout)
        })
      }
      updateHeight()
    })
  }
)

watch(
  () => props.layout,
  () => {
    layoutUpdate()
  }
)

watch(
  () => props.colNum,
  (val) => eventBus.emit('setColNum', { colNum: val })
)

watch(
  () => props.rowHeight,
  () => eventBus.emit('setRowHeight', { rowHeight: props.rowHeight })
)

watch(
  () => props.isDraggable,
  () => eventBus.emit('setDraggable', { isDraggable: props.isDraggable })
)

watch(
  () => props.isResizable,
  () => eventBus.emit('setResizable', { isResizable: props.isResizable })
)

watch(
  () => props.responsive,
  () => {
    if (!props.responsive) {
      emit('update:layout', originalLayout)
      eventBus.emit('setColNum', { colNum: props.colNum })
    }
    onContainerResize()
  }
)

watch(
  () => props.maxRows,
  () => eventBus.emit('setMaxRows', { maxRows: props.maxRows })
)

watch(
  () => props.margin,
  () => updateHeight()
)

onBeforeUnmount(() => {
  //Remove listeners
  eventBus.off('resizeItem', resizeItemEventHandler)
  eventBus.off('dragItem', dragItemEventHandler)
})

onBeforeMount(() => {
  emit('layout-before-mount', props.layout)
})

onMounted(() => {
  emit('layout-mounted', props.layout)
  nextTick(function () {
    validateLayout(props.layout as any)

    originalLayout = props.layout
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    nextTick(function () {
      onContainerResize()
      initResponsiveFeatures()

      compact(props.layout as any, props.verticalCompact)

      emit('layout-updated', props.layout)

      updateHeight()
      nextTick(function () {
        useResizeObserver(item.value, () => {
          onContainerResize()
        })
      })
    })
  })
})
const layoutUpdate = () => {
  if (props.layout !== undefined && originalLayout !== null) {
    if (props.layout.length !== originalLayout.length) {
      // console.log("### LAYOUT UPDATE!", this.layout.length, this.originalLayout.length);

      let diff = findDifference(props.layout, originalLayout)
      if (diff.length > 0) {
        // console.log(diff);
        if (props.layout.length > originalLayout.length) {
          originalLayout = originalLayout.concat(diff)
        } else {
          originalLayout = originalLayout.filter((obj: { i: any }) => {
            return !diff.some((obj2: any) => {
              return obj.i === obj2.i
            })
          })
        }
      }

      lastLayoutLength = props.layout.length
      initResponsiveFeatures()
    }

    compact(props.layout as unknown as any, props.verticalCompact)
    eventBus.emit('updateWidth', { width: width.value })
    updateHeight()

    emit('layout-updated', props.layout)
  }
}
const updateHeight = () => {
  mergedStyle.value = {
    height: containerHeight(),
  }
}
const onContainerResize = () => {
  if (item.value !== null && item.value !== undefined) {
    width.value = item.value.offsetWidth
  }

  if (props.responsive) responsiveGridLayout()
  compact(props.layout as any, props.verticalCompact)
  eventBus.emit('compact')
  updateHeight()
  eventBus.emit('updateWidth', { width: width.value }) // fixes reload with delay issue, should it be in resize? or is there a better way to deal with this?
}
const containerHeight = () => {
  if (!props.autoSize) return
  const containerHeight =
    bottom(props.layout as any) * (props.rowHeight + (props.margin as any)[1]) + (props.margin as any)[1] + 'px'
  return containerHeight
}
const dragItemEventHandler = (event: DragItemEvent) => {
  // eventName: string, id: string, x: number | undefined, y: number, h: any, w: any
  const { eventType, i, x, y, h, w } = event
  let l = getLayoutItem(props.layout as any, i) as any
  //GetLayoutItem sometimes returns null object
  if (l === undefined || l === null) {
    l = { x: 0, y: 0 }
  }

  if (eventType === 'dragmove' || eventType === 'dragstart') {
    placeholder.i = i
    placeholder.x = l.x
    placeholder.y = l.y
    placeholder.w = w
    placeholder.h = h
    nextTick(function () {
      isDragging.value = true
    })
    eventBus.emit('updateWidth', { width: width.value })
  } else {
    nextTick(function () {
      isDragging.value = false
    })
  }

  // Move the element to the dragged location.
  emit('update:layout', moveElement(props.layout as any, l, x, y, true, props.preventCollision))
  compact(props.layout as any, props.verticalCompact)
  // needed because vue can't detect changes on array element properties
  eventBus.emit('compact')
  updateHeight()
  if (eventType === 'dragend') emit('layout-updated', props.layout)
}
const resizeItemEventHandler = (event: ResizeItemEvent) => {
  const { eventType, i, x, y, h, w } = event
  let l = getLayoutItem(props.layout as any, i) as any
  //GetLayoutItem sometimes return null object
  if (l === undefined || l === null) {
    l = { h: 0, w: 0 }
  }

  let hasCollisions
  if (props.preventCollision) {
    const collisions = getAllCollisions(props.layout as any, { ...l, w, h } as any).filter(
      (layoutItem) => layoutItem.i !== l.i
    )
    hasCollisions = collisions.length > 0

    // If we're colliding, we need adjust the placeholder.
    if (hasCollisions) {
      // adjust w && h to maximum allowed space
      let leastX = Infinity,
        leastY = Infinity
      collisions.forEach((layoutItem) => {
        if (layoutItem.x > l.x) leastX = Math.min(leastX, layoutItem.x)
        if (layoutItem.y > l.y) leastY = Math.min(leastY, layoutItem.y)
      })

      if (Number.isFinite(leastX)) l.w = leastX - l.x
      if (Number.isFinite(leastY)) l.h = leastY - l.y
    }
  }

  if (!hasCollisions) {
    // Set new width and height.
    l.w = w
    l.h = h
  }

  if (eventType === 'resizestart' || eventType === 'resizemove') {
    placeholder.i = i
    placeholder.x = x
    placeholder.y = y
    placeholder.w = l.w
    placeholder.h = l.h
    nextTick(() => (isDragging.value = true))

    eventBus.emit('updateWidth', { width: width.value })
  } else {
    nextTick(() => (isDragging.value = false))
  }

  if (props.responsive) responsiveGridLayout()

  compact(props.layout as any, props.verticalCompact)
  eventBus.emit('compact')
  updateHeight()

  if (eventType === 'resizeend') emit('layout-updated', props.layout)
}

// finds or generates new layouts for set breakpoints
const responsiveGridLayout = () => {
  let newBreakpoint = getBreakpointFromWidth(props.breakpoints, width.value as any)
  let newCols = getColsFromBreakpoint(newBreakpoint, props.cols)

  // save actual layout in layouts
  if (lastBreakpoint != null && !(layouts as any)[lastBreakpoint])
    (layouts as any)[lastBreakpoint] = cloneLayout(props.layout as any)

  // Find or generate a new layout.
  let layout = findOrGenerateResponsiveLayout(
    originalLayout,
    layouts,
    props.breakpoints,
    newBreakpoint,
    lastBreakpoint,
    newCols,
    props.verticalCompact
  )

  // Store the new layout.
  layouts[newBreakpoint] = layout

  if (lastBreakpoint !== newBreakpoint) {
    emit('breakpoint-changed', newBreakpoint, props.layout)
  }

  // new prop sync
  emit('update:layout', layout)

  lastBreakpoint = newBreakpoint
  eventBus.emit('setColNum', { colNum: getColsFromBreakpoint(newBreakpoint, props.cols) })
}

// clear all responsive layouts
const initResponsiveFeatures = () => {
  // clear layouts
  layouts = Object.assign({}, props.responsiveLayouts)
}

// find difference in layouts
const findDifference = (layout: unknown[], originalLayout: any[]) => {
  //Find values that are in result1 but not in result2
  let uniqueResultOne = layout.filter((obj: any) => {
    return !originalLayout.some(function (obj2: { i: any }) {
      return obj.i === obj2.i
    })
  })

  //Find values that are in result2 but not in result1
  let uniqueResultTwo = originalLayout.filter((obj: any) => {
    return !layout.some((obj2: any) => {
      return obj.i === obj2.i
    })
  })

  //Combine the two arrays of unique entries#
  return uniqueResultOne.concat(uniqueResultTwo)
}

eventBus.on('resizeItem', resizeItemEventHandler)
eventBus.on('dragItem', dragItemEventHandler)
emit('layout-created', props.layout)
</script>

<style scoped>
.vue-grid-layout {
  position: relative;
  transition: height 200ms ease;
}
</style>
