<template>
  <div ref="item" class="vue-grid-item" :class="classObj" :style="style">
    <slot></slot>
    <span v-if="resizableAndNotStatic" ref="handle" :class="resizableHandleClass"></span>
  </div>
</template>

<script lang="ts" setup>
import { setTopLeft, setTopRight, setTransformRtl, setTransform } from '@/helpers/utils'
import { getControlPosition, createCoreData } from '@/helpers/draggableUtils'
import { getColsFromBreakpoint } from '@/helpers/responsiveUtils'
import { inject, ref, computed, watch, onBeforeUnmount, onMounted } from 'vue'

import '@interactjs/auto-start/index.prod'
import '@interactjs/actions/drag/index.prod'
import '@interactjs/actions/resize/index.prod'
import '@interactjs/modifiers/index.prod'
import '@interactjs/dev-tools/index.prod' // consider removing
import interact from '@interactjs/interact/index.prod'
import { Emitter } from 'mitt'
import {
  Events,
  SetColNumEvent,
  SetDraggableEvent,
  SetMaxRowsEvent,
  SetResizableEvent,
  SetRowHeightEvent,
  UpdateWidthEvent,
} from '@/components/eventBus'
import { LayoutItemInjectable } from './LayoutTypes'

const emit = defineEmits<{
  (e: 'container-resized', i: string, h: number, w: number, height: number, width: number): void
  (e: 'resize', i: string, h: number, w: number, height: number, width: number): void
  (e: 'resized', i: string, h: number, w: number, height: number, width: number): void
  (e: 'move', i: string, x: number, y: number): void
  (e: 'moved', i: string, x: number, y: number): void
}>()

const props: Readonly<LayoutItemInjectable> = defineProps({
  isDraggable: {
    type: Boolean,
    required: false,
    default: null,
  },
  isResizable: {
    type: Boolean,
    required: false,
    default: null,
  },
  static: {
    type: Boolean,
    required: false,
    default: false,
  },
  minH: {
    type: Number,
    required: false,
    default: 1,
  },
  minW: {
    type: Number,
    required: false,
    default: 1,
  },
  maxH: {
    type: Number,
    required: false,
    default: Infinity,
  },
  maxW: {
    type: Number,
    required: false,
    default: Infinity,
  },
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
  w: {
    type: Number,
    required: true,
  },
  h: {
    type: Number,
    required: true,
  },
  i: {
    type: String,
    required: true,
  },
  dragIgnoreFrom: {
    type: String,
    required: false,
    default: 'a, button',
  },
  dragAllowFrom: {
    type: String,
    required: false,
    default: null,
  },
  resizeIgnoreFrom: {
    type: String,
    required: false,
    default: 'a, button',
  },
  preserveAspectRatio: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const eventBus = inject<Emitter<Events>>('eventBus')!
const layout: any = inject('layout')

const item = ref<HTMLDivElement | null>(null)
let interactObj: any = null
let cols = ref(1)
let containerWidth = ref<number>(100)
let rowHeight = ref(30)
let margin = [10, 10]
let maxRows = Infinity
let draggable = ref<boolean | null>(null)
let resizable = ref<boolean | null>(null)
let useCssTransforms = true
let useStyleCursor = true
let isDragging = ref(false)
let dragging: { top: number; left: number } | null = null
let isResizing = ref(false)
let resizing: { width: number; height: number } | null = null
let lastX = NaN
let lastY = NaN
let lastW = NaN
let lastH = NaN
const style: any = ref({})
let dragEventSet = false
let resizeEventSet = false
let previousW: number | null = null
let previousH: number | null = null
let previousX: number | null = null
let previousY: number | null = null
// eslint-disable-next-line vue/no-setup-props-destructure
let innerX = props.x
// eslint-disable-next-line vue/no-setup-props-destructure
let innerY = props.y
// eslint-disable-next-line vue/no-setup-props-destructure
let innerW = props.w
// eslint-disable-next-line vue/no-setup-props-destructure
let innerH = props.h

const resizableAndNotStatic = computed(() => resizable.value && !props.static)
const isAndroid = computed(() => navigator.userAgent.toLowerCase().indexOf('android') !== -1)
const draggableOrResizableAndNotStatic = computed(() => (draggable.value || resizable.value) && !props.static)

const classObj = computed(() => {
  return {
    'vue-resizable': resizableAndNotStatic.value,
    static: props.static,
    resizing: isResizing.value,
    'vue-draggable-dragging': isDragging.value,
    cssTransforms: useCssTransforms,
    'render-rtl': layout.isMirrored,
    'disable-userselect': isDragging.value,
    'no-touch': isAndroid.value && draggableOrResizableAndNotStatic.value,
  }
})

const resizableHandleClass = computed(() => {
  if (layout.isMirrored) {
    return 'vue-resizable-handle vue-rtl-resizable-handle'
  } else {
    return 'vue-resizable-handle'
  }
})

watch(
  () => props.isDraggable,
  (newValue) => {
    draggable.value = newValue
  }
)

watch(
  () => props.static,
  () => {
    tryMakeDraggable()
    tryMakeResizable()
  }
)

watch(
  () => layout.useStyleCursor,
  () => {
    if (interactObj) {
      interactObj.styleCursor(layout.useStyleCursor)
    }
  }
)

watch(draggable, () => {
  tryMakeDraggable()
})

watch(
  () => props.isResizable,
  (newValue) => {
    resizable.value = newValue
  }
)

watch(resizable, () => {
  tryMakeResizable()
})

watch(rowHeight, () => {
  createStyle()
  emitContainerResized()
})

watch([containerWidth, cols], () => {
  tryMakeResizable()
  createStyle()
  emitContainerResized()
})

watch(
  () => props.x,
  (newVal) => {
    innerX = newVal
    createStyle()
  }
)

watch(
  () => props.y,
  (newVal) => {
    innerY = newVal
    createStyle()
  }
)

watch(
  () => props.h,
  (newVal) => {
    innerH = newVal
    createStyle()
  }
)

watch(
  () => props.w,
  (newVal) => {
    innerW = newVal
    createStyle()
  }
)

watch(
  () => layout.isMirrored,
  () => {
    tryMakeResizable()
    createStyle()
  }
)

watch([() => props.minH, () => props.maxH, () => props.minW, () => props.maxW], () => {
  tryMakeResizable()
})

watch(
  () => layout.margin,
  () => {
    if (!margin || (margin[0] == margin[0] && margin[1] == margin[1])) {
      return
    }
    margin = margin.map((m) => Number(m))
    createStyle()
    emitContainerResized()
  }
)

const updateWidthHandler = (event: UpdateWidthEvent) => {
  updateWidth(event.width)
}

const compactHandler = () => {
  compact()
}

const setDraggableHandler = (event: SetDraggableEvent) => {
  if (props.isDraggable === null) {
    draggable.value = event.isDraggable
  }
}

const setResizableHandler = (event: SetResizableEvent) => {
  if (props.isResizable === null) {
    resizable.value = event.isResizable
  }
}

const setRowHeightHandler = (event: SetRowHeightEvent) => {
  rowHeight.value = event.rowHeight
}

const setMaxRowsHandler = (event: SetMaxRowsEvent) => {
  maxRows = event.maxRows
}

const setColNumHandler = (event: SetColNumEvent) => {
  cols.value = event.colNum
}

eventBus.on('updateWidth', updateWidthHandler)
eventBus.on('compact', compactHandler)
eventBus.on('setDraggable', setDraggableHandler)
eventBus.on('setResizable', setResizableHandler)
eventBus.on('setRowHeight', setRowHeightHandler)
eventBus.on('setMaxRows', setMaxRowsHandler)
eventBus.on('setColNum', setColNumHandler)

onBeforeUnmount(() => {
  eventBus.off('updateWidth', updateWidthHandler)
  eventBus.off('compact', compactHandler)
  eventBus.off('setDraggable', setDraggableHandler)
  eventBus.off('setResizable', setResizableHandler)
  eventBus.off('setRowHeight', setRowHeightHandler)
  eventBus.off('setMaxRows', setMaxRowsHandler)
  eventBus.off('setColNum', setColNumHandler)
  if (interactObj) {
    interactObj.unset() // destroy interact intance
  }
})

onMounted(() => {
  if (layout.responsive && layout.lastBreakpoint) {
    cols.value = getColsFromBreakpoint(layout.lastBreakpoint, layout.cols)
  } else {
    cols.value = layout.colNum
  }

  rowHeight.value = layout.rowHeight
  margin = layout.margin ? layout.margin : [10, 10]
  maxRows = layout.maxRows

  if (props.isDraggable === null) {
    draggable.value = layout.isDraggable
  } else {
    draggable.value = props.isDraggable
  }

  if (props.isResizable === null) {
    resizable.value = layout.isResizable
  } else {
    resizable.value = props.isResizable
  }

  useCssTransforms = layout.useCssTransforms
  useStyleCursor = layout.useStyleCursor
  createStyle()
})

const createStyle = () => {
  if (props.x + props.w > cols.value) {
    innerX = 0
    innerW = props.w > cols.value ? cols.value : props.w
  } else {
    innerX = props.x
    innerW = props.w
  }

  let pos = calcPosition(innerX, innerY, innerW, innerH)
  if (isDragging.value && dragging) {
    pos.top = dragging.top
    //                    Add rtl support
    if (layout.isMirrored) {
      pos.right = dragging.left
    } else {
      pos.left = dragging.left
    }
  }

  if (isResizing.value && resizing) {
    pos.width = resizing.width
    pos.height = resizing.height
  }
  let styleValue
  // CSS Transforms support (default)
  if (useCssTransforms) {
    //                    Add rtl support
    if (layout.isMirrored) {
      styleValue = setTransformRtl(pos.top, pos.right!, pos.width, pos.height)
    } else {
      styleValue = setTransform(pos.top, pos.left!, pos.width, pos.height)
    }
  } else {
    // top,left (slow)
    //                    Add rtl support
    if (layout.isMirrored) {
      styleValue = setTopRight(pos.top, pos.right!, pos.width, pos.height)
    } else {
      styleValue = setTopLeft(pos.top, pos.left!, pos.width, pos.height)
    }
  }
  style.value = styleValue
}

const emitContainerResized = () => {
  let styleProps: Record<string, number> = { width: 0, height: 0 }
  for (let prop of Object.keys(styleProps)) {
    let val = style.value[prop]
    let matches = val.match(/^(\d+)px$/)
    if (!matches) return
    styleProps[prop] = matches[1] as number // number of px (without px suffix)
  }

  emit('container-resized', props.i, props.h, props.w, styleProps.height, styleProps.width)
}

const handleResize = (event: any) => {
  if (props.static) return
  const position = getControlPosition(event)
  // Get the current drag point from the event. This is used as the offset.
  if (position == null) return // not possible but satisfies flow
  const { x, y } = position
  const newSize = { width: 0, height: 0 }
  let pos

  switch (event.type) {
    case 'resizestart': {
      previousW = innerW
      previousH = innerH
      pos = calcPosition(innerX, innerY, innerW, innerH)
      newSize.width = pos.width
      newSize.height = pos.height
      resizing = newSize
      isResizing.value = true
      break
    }
    case 'resizemove': {
      if (resizing) {
        const coreEvent = createCoreData(lastW, lastH, x, y)
        if (layout.isMirrored) {
          newSize.width = resizing.width - coreEvent.deltaX
        } else {
          newSize.width = resizing.width + coreEvent.deltaX
        }
        newSize.height = resizing.height + coreEvent.deltaY
        ///console.log("### resize => " + event.type + ", deltaX=" + coreEvent.deltaX + ", deltaY=" + coreEvent.deltaY);
        resizing = newSize
      }
      break
    }
    case 'resizeend': {
      //console.log("### resize end => x=" +this.innerX + " y=" + this.innerY + " w=" + this.innerW + " h=" + this.innerH);
      pos = calcPosition(innerX, innerY, innerW, innerH)
      newSize.width = pos.width
      newSize.height = pos.height
      //                        console.log("### resize end => " + JSON.stringify(newSize));
      resizing = null
      isResizing.value = false
      break
    }
  }
  // Get new WH
  pos = calcWH(newSize.height, newSize.width)
  if (pos.w < props.minW) {
    pos.w = props.minW
  }
  if (pos.w > props.maxW) {
    pos.w = props.maxW
  }
  if (pos.h < props.minH) {
    pos.h = props.minH
  }
  if (pos.h > props.maxH) {
    pos.h = props.maxH
  }
  if (pos.h < 1) {
    pos.h = 1
  }
  if (pos.w < 1) {
    pos.w = 1
  }
  lastW = x
  lastH = y
  if (innerW !== pos.w || innerH !== pos.h) {
    // console.log('resize')
    emit('resize', props.i, pos.h, pos.w, newSize.height, newSize.width)
  }
  if (event.type === 'resizeend' && (previousW !== innerW || previousH !== innerH)) {
    // console.log('resizeend')
    emit('resized', props.i, pos.h, pos.w, newSize.height, newSize.width)
  }

  eventBus?.emit('resizeItem', {
    eventType: event.type,
    i: props.i,
    x: innerX,
    y: innerY,
    h: pos.h,
    w: pos.w,
  })
}

const handleDrag = (event: any) => {
  if (props.static) return
  if (isResizing.value) return
  const position = getControlPosition(event)
  // Get the current drag point from the event. This is used as the offset.
  if (position === null) return // not possible but satisfies flow
  const { x, y } = position
  // let shouldUpdate = false;
  let newPosition = { top: 0, left: 0 }
  switch (event.type) {
    case 'dragstart': {
      previousX = innerX
      previousY = innerY
      let parentRect = event.target.offsetParent.getBoundingClientRect()
      let clientRect = event.target.getBoundingClientRect()
      if (layout.isMirrored) {
        newPosition.left = (clientRect.right - parentRect.right) * -1
      } else {
        newPosition.left = clientRect.left - parentRect.left
      }
      newPosition.top = clientRect.top - parentRect.top
      dragging = newPosition
      isDragging.value = true
      break
    }
    case 'dragend': {
      if (!isDragging.value) return
      let parentRect = event.target.offsetParent.getBoundingClientRect()
      let clientRect = event.target.getBoundingClientRect()
      //                        Add rtl support
      if (layout.isMirrored) {
        newPosition.left = (clientRect.right - parentRect.right) * -1
      } else {
        newPosition.left = clientRect.left - parentRect.left
      }
      newPosition.top = clientRect.top - parentRect.top
      dragging = null
      isDragging.value = false
      // shouldUpdate = true;
      break
    }
    case 'dragmove': {
      const coreEvent = createCoreData(lastX, lastY, x, y)
      // Add rtl support
      if (dragging) {
        if (layout.isMirrored) {
          newPosition.left = dragging.left - coreEvent.deltaX
        } else {
          newPosition.left = dragging.left + coreEvent.deltaX
        }
        newPosition.top = dragging.top + coreEvent.deltaY
        dragging = newPosition
      }
      break
    }
  }
  // Get new XY
  let pos
  if (layout.isMirrored) {
    pos = calcXY(newPosition.top, newPosition.left)
  } else {
    pos = calcXY(newPosition.top, newPosition.left)
  }
  lastX = x
  lastY = y
  if (innerX !== pos.x || innerY !== pos.y) {
    emit('move', props.i, pos.x, pos.y)
  }
  if (event.type === 'dragend' && (previousX !== innerX || previousY !== innerY)) {
    emit('moved', props.i, pos.x, pos.y)
  }
  eventBus?.emit('dragItem', {
    eventType: event.type,
    i: props.i,
    x: pos.x,
    y: pos.y,
    h: innerH,
    w: innerW,
  })
}

const calcPosition = (x: number, y: number, w: number, h: number) => {
  const colWidth = calcColWidth()
  // add rtl support
  let out
  if (layout.isMirrored) {
    out = {
      right: Math.round(colWidth * x + (x + 1) * margin[0]),
      top: Math.round(rowHeight.value * y + (y + 1) * margin[1]),
      // 0 * Infinity === NaN, which causes problems with resize constriants;
      // Fix this if it occurs.
      // Note we do it here rather than later because Math.round(Infinity) causes deopt
      width: w === Infinity ? w : Math.round(colWidth * w + Math.max(0, w - 1) * margin[0]),
      height: h === Infinity ? h : Math.round(rowHeight.value * h + Math.max(0, h - 1) * margin[1]),
    }
  } else {
    out = {
      left: Math.round(colWidth * x + (x + 1) * margin[0]),
      top: Math.round(rowHeight.value * y + (y + 1) * margin[1]),
      // 0 * Infinity === NaN, which causes problems with resize constriants;
      // Fix this if it occurs.
      // Note we do it here rather than later because Math.round(Infinity) causes deopt
      width: w === Infinity ? w : Math.round(colWidth * w + Math.max(0, w - 1) * margin[0]),
      height: h === Infinity ? h : Math.round(rowHeight.value * h + Math.max(0, h - 1) * margin[1]),
    }
  }
  return out
}

/**
 * Translate x and y coordinates from pixels to grid units.
 * @param  {Number} top  Top position (relative to parent) in pixels.
 * @param  {Number} left Left position (relative to parent) in pixels.
 * @return {Object} x and y in grid units.
 */
// TODO check if this function needs change in order to support rtl.
const calcXY = (top: number, left: number) => {
  const colWidth = calcColWidth()
  let x = Math.round((left - margin[0]) / (colWidth + margin[0]))
  let y = Math.round((top - margin[1]) / (rowHeight.value + margin[1]))
  // Capping

  x = Math.max(Math.min(x, cols.value - innerW), 0)
  y = Math.max(Math.min(y, maxRows - innerH), 0)
  return { x, y }
}

const calcColWidth = () => {
  return (containerWidth.value - margin[0] * (cols.value + 1)) / cols.value
}

/**
 * Given a height and width in pixel values, calculate grid units.
 * @param  {Number} height Height in pixels.
 * @param  {Number} width  Width in pixels.
 * @param  {Boolean} autoSizeFlag  function autoSize identifier.
 * @return {Object} w, h as grid units.
 */
const calcWH = (height: number, width: number, autoSizeFlag = false) => {
  const colWidth = calcColWidth()
  let w = Math.round((width + margin[0]) / (colWidth + margin[0]))
  let h = 0
  if (!autoSizeFlag) {
    h = Math.round((height + margin[1]) / (rowHeight.value + margin[1]))
  } else {
    h = Math.ceil((height + margin[1]) / (rowHeight.value + margin[1]))
  }
  // Capping
  w = Math.max(Math.min(w, cols.value - innerX), 0)
  h = Math.max(Math.min(h, maxRows - innerY), 0)
  return { w, h }
}

const updateWidth = (width: number, colNum = null) => {
  containerWidth.value = width
  if (colNum !== undefined && colNum !== null) {
    cols.value = colNum
  }
}

const compact = () => {
  createStyle()
}

const tryMakeDraggable = () => {
  if (interactObj === null || interactObj === undefined) {
    interactObj = interact(item.value)
  }
  if (draggable.value && !props.static) {
    const opts = {
      ignoreFrom: props.dragIgnoreFrom,
      allowFrom: props.dragAllowFrom,
    }
    interactObj.draggable(opts)
    /*this.interactObj.draggable({allowFrom: '.vue-draggable-handle'});*/
    if (!dragEventSet) {
      dragEventSet = true
      interactObj.on('dragstart dragmove dragend', function (event: any) {
        handleDrag(event)
      })
    }
  } else {
    interactObj.draggable({
      enabled: false,
    })
  }
}

const tryMakeResizable = () => {
  if (interactObj === null || interactObj === undefined) {
    interactObj = interact(item.value)
    if (!useStyleCursor) {
      interactObj.styleCursor(false)
    }
  }
  if (resizable.value && !props.static) {
    let maximum = calcPosition(0, 0, props.maxW, props.maxH)
    let minimum = calcPosition(0, 0, props.minW, props.minH)
    // console.log("### MAX " + JSON.stringify(maximum));
    // console.log("### MIN " + JSON.stringify(minimum));

    let opts: any = {
      // preserveAspectRatio: true,
      // allowFrom: "." + this.resizableHandleClass,
      edges: {
        left: layout.isMirrored,
        right: !layout.isMirrored,
        bottom: true,
        top: false,
      },
      ignoreFrom: props.resizeIgnoreFrom,
      restrictSize: {
        min: {
          height: minimum.height,
          width: minimum.width,
        },
        max: {
          height: maximum.height,
          width: maximum.width,
        },
      },
    }

    if (props.preserveAspectRatio) {
      opts.modifiers = [
        interact.modifiers.aspectRatio({
          ratio: 'preserve',
        }),
      ]
    }

    interactObj.resizable(opts)
    if (!resizeEventSet) {
      resizeEventSet = true
      interactObj.on('resizestart resizemove resizeend', function (event: any) {
        handleResize(event)
      })
    }
  } else {
    interactObj.resizable({
      enabled: false,
    })
  }
}
</script>

<style scoped>
.vue-grid-item {
  transition: all 200ms ease;
  transition-property: left, top, right;
  /* add right for rtl */
}

.vue-grid-item.no-touch {
  -ms-touch-action: none;
  touch-action: none;
}

.vue-grid-item.cssTransforms {
  transition-property: transform;
  left: 0;
  right: auto;
}

.vue-grid-item.cssTransforms.render-rtl {
  left: auto;
  right: 0;
}

.vue-grid-item.resizing {
  opacity: 0.6;
  z-index: 3;
}

.vue-grid-item.vue-draggable-dragging {
  transition: none;
  z-index: 3;
}

.vue-grid-item.vue-grid-placeholder {
  background: red;
  opacity: 0.2;
  transition-duration: 100ms;
  z-index: 2;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -o-user-select: none;
  user-select: none;
}

.vue-grid-item > .vue-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  bottom: 0;
  right: 0;
  background: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pg08IS0tIEdlbmVyYXRvcjogQWRvYmUgRmlyZXdvcmtzIENTNiwgRXhwb3J0IFNWRyBFeHRlbnNpb24gYnkgQWFyb24gQmVhbGwgKGh0dHA6Ly9maXJld29ya3MuYWJlYWxsLmNvbSkgLiBWZXJzaW9uOiAwLjYuMSAgLS0+DTwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DTxzdmcgaWQ9IlVudGl0bGVkLVBhZ2UlMjAxIiB2aWV3Qm94PSIwIDAgNiA2IiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjojZmZmZmZmMDAiIHZlcnNpb249IjEuMSINCXhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiDQl4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjZweCIgaGVpZ2h0PSI2cHgiDT4NCTxnIG9wYWNpdHk9IjAuMzAyIj4NCQk8cGF0aCBkPSJNIDYgNiBMIDAgNiBMIDAgNC4yIEwgNCA0LjIgTCA0LjIgNC4yIEwgNC4yIDAgTCA2IDAgTCA2IDYgTCA2IDYgWiIgZmlsbD0iIzAwMDAwMCIvPg0JPC9nPg08L3N2Zz4=');
  background-position: bottom right;
  padding: 0 3px 3px 0;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: se-resize;
}

.vue-grid-item > .vue-rtl-resizable-handle {
  bottom: 0;
  left: 0;
  background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAuMDAwMDAwMDAwMDAwMDAyIiBoZWlnaHQ9IjEwLjAwMDAwMDAwMDAwMDAwMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDwhLS0gQ3JlYXRlZCB3aXRoIE1ldGhvZCBEcmF3IC0gaHR0cDovL2dpdGh1Yi5jb20vZHVvcGl4ZWwvTWV0aG9kLURyYXcvIC0tPgogPGc+CiAgPHRpdGxlPmJhY2tncm91bmQ8L3RpdGxlPgogIDxyZWN0IGZpbGw9Im5vbmUiIGlkPSJjYW52YXNfYmFja2dyb3VuZCIgaGVpZ2h0PSIxMiIgd2lkdGg9IjEyIiB5PSItMSIgeD0iLTEiLz4KICA8ZyBkaXNwbGF5PSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgeT0iMCIgeD0iMCIgaGVpZ2h0PSIxMDAlIiB3aWR0aD0iMTAwJSIgaWQ9ImNhbnZhc0dyaWQiPgogICA8cmVjdCBmaWxsPSJ1cmwoI2dyaWRwYXR0ZXJuKSIgc3Ryb2tlLXdpZHRoPSIwIiB5PSIwIiB4PSIwIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIi8+CiAgPC9nPgogPC9nPgogPGc+CiAgPHRpdGxlPkxheWVyIDE8L3RpdGxlPgogIDxsaW5lIGNhbnZhcz0iI2ZmZmZmZiIgY2FudmFzLW9wYWNpdHk9IjEiIHN0cm9rZS1saW5lY2FwPSJ1bmRlZmluZWQiIHN0cm9rZS1saW5lam9pbj0idW5kZWZpbmVkIiBpZD0ic3ZnXzEiIHkyPSItNzAuMTc4NDA3IiB4Mj0iMTI0LjQ2NDE3NSIgeTE9Ii0zOC4zOTI3MzciIHgxPSIxNDQuODIxMjg5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlPSIjMDAwIiBmaWxsPSJub25lIi8+CiAgPGxpbmUgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2UtbGluZWNhcD0idW5kZWZpbmVkIiBzdHJva2UtbGluZWpvaW49InVuZGVmaW5lZCIgaWQ9InN2Z181IiB5Mj0iOS4xMDY5NTciIHgyPSIwLjk0NzI0NyIgeTE9Ii0wLjAxODEyOCIgeDE9IjAuOTQ3MjQ3IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KICA8bGluZSBzdHJva2UtbGluZWNhcD0idW5kZWZpbmVkIiBzdHJva2UtbGluZWpvaW49InVuZGVmaW5lZCIgaWQ9InN2Z183IiB5Mj0iOSIgeDI9IjEwLjA3MzUyOSIgeTE9IjkiIHgxPSItMC42NTU2NCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9IiM2NjY2NjYiIGZpbGw9Im5vbmUiLz4KIDwvZz4KPC9zdmc+);
  background-position: bottom left;
  padding-left: 3px;
  background-repeat: no-repeat;
  background-origin: content-box;
  cursor: sw-resize;
  right: auto;
}

.vue-grid-item.disable-userselect {
  user-select: none;
}
</style>
