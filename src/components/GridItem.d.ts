import { VNode } from 'vue'
import { ClassComponent } from './ts-helpers'

export interface GridItemProps {
  isDraggable?: boolean
  isResizable?: boolean
  static?: boolean
  minH?: number
  minW?: number
  maxH?: number
  maxW?: number
  x: number
  y: number
  w: number
  h: number
  i: string
  dragIgnoreFrom?: string
  dragAllowFrom?: string
  resizeIgnoreFrom?: string
  preserveAspectRatio?: boolean
}

// eslint-disable-next-line @typescript-eslint/ban-types
export declare type GridItemEmits = {}

export interface GridItemSlots {
  /**
   * Custom content template
   */
  default: () => VNode[]
}

declare class GridItem extends ClassComponent<GridItemProps, GridItemSlots, GridItemEmits> {}

export default GridItem
