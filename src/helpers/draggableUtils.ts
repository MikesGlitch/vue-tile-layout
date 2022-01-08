// Get {x, y} positions from event.
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getControlPosition = (e: any) => offsetXYFromParentOf(e)

// Get from offsetParent
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function offsetXYFromParentOf(evt: { target: { offsetParent: HTMLElement }; clientX: number; clientY: number }) {
  const offsetParent = evt.target.offsetParent || document.body
  const offsetParentRect = offsetParent === document.body ? { left: 0, top: 0 } : offsetParent.getBoundingClientRect()
  const x = evt.clientX + offsetParent.scrollLeft - offsetParentRect.left
  const y = evt.clientY + offsetParent.scrollTop - offsetParentRect.top
  return { x, y }
}

// Create an data object exposed by <DraggableCore>'s events
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createCoreData(lastX: number, lastY: number, x: number, y: number) {
  // State changes are often (but not always!) async. We want the latest value.
  const isStart = isNaN(lastX)

  if (isStart) {
    // If this is our first move, use the x and y as last coords.
    return {
      deltaX: 0,
      deltaY: 0,
      lastX: x,
      lastY: y,
      x: x,
      y: y,
    }
  } else {
    // Otherwise calculate proper values.
    return {
      deltaX: x - lastX,
      deltaY: y - lastY,
      lastX: lastX,
      lastY: lastY,
      x: x,
      y: y,
    }
  }
}
