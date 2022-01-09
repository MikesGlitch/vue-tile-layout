export interface LayoutItemRequired {
  w: number
  h: number
  x: number
  y: number
  i: string
}

export interface LayoutItem extends LayoutItemRequired {
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  moved?: boolean
  static?: boolean
  isDraggable?: boolean
  isResizable?: boolean
  dragIgnoreFrom?: string
  dragAllowFrom?: string
  resizeIgnoreFrom?: string
  preserveAspectRatio?: boolean
  [key: string]: unknown
}

export interface LayoutItemInjectable extends LayoutItemRequired {
  // Same as LayoutItem but with default values set - so no undefined allowed
  minW: number
  minH: number
  maxW: number
  maxH: number
  moved?: boolean
  static: boolean
  isDraggable: boolean | null
  isResizable: boolean | null
  dragIgnoreFrom: string
  dragAllowFrom: string | null
  resizeIgnoreFrom: string
  preserveAspectRatio: boolean
}

export type Layout = Array<LayoutItem>

// Split this up into two? GridLayout and GridLayoutItem
