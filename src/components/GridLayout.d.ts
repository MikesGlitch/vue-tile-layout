import { VNode } from 'vue'
import { ClassComponent } from './ts-helpers'

export interface GridLayoutProps {
  autoSize?: boolean
  colNum?: number
  rowHeight?: number
  maxRows?: number
  margin?: Array<any>
  isDraggable?: boolean
  isResizable?: boolean
  isMirrored?: boolean
  useCssTransforms?: boolean
  verticalCompact?: boolean
  layout: Array<any>
  responsive?: boolean
  responsiveLayouts?: object
  breakpoints?: object
  cols?: object
  preventCollision?: boolean
  useStyleCursor?: boolean
}

// eslint-disable-next-line @typescript-eslint/ban-types
export declare type GridLayoutEmits = {}

export interface GridLayoutSlots {
  /**
   * Custom content template
   */
  default: () => VNode[]
}

declare class GridLayout extends ClassComponent<GridLayoutProps, GridLayoutSlots, GridLayoutEmits> {}

export default GridLayout
