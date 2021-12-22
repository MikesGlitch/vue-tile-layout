export interface UpdateWidthEvent {
  width: number
}

export interface SetColNumEvent {
  colNum: number
}

export interface SetRowHeightEvent {
  rowHeight: number
}

export interface SetDraggableEvent {
  isDraggable: boolean
}

export interface SetResizableEvent {
  isResizable: boolean
}

export interface SetMaxRowsEvent {
  maxRows: number
}

export interface DragEvent {
  eventType: string
  i: string
  x: number
  y: number
  h: number
  w: number
}

export interface ResizeEvent {
  eventType?: string
  i?: string
  x?: number
  y?: number
  h?: number
  w?: number
}

export type Events = {
  updateWidth: UpdateWidthEvent
  setColNum: SetColNumEvent
  setRowHeight: SetRowHeightEvent
  setDraggable: SetDraggableEvent
  setResizable: SetResizableEvent
  setMaxRows: SetMaxRowsEvent
  resize: ResizeEvent
  compact: unknown
  drag: DragEvent
}
