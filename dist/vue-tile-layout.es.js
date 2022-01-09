var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a2, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a2, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a2, prop, b[prop]);
    }
  return a2;
};
var __spreadProps = (a2, b) => __defProps(a2, __getOwnPropDescs(b));
import { defineComponent, inject, ref, computed, watch, onBeforeUnmount, onMounted, openBlock, createElementBlock, normalizeClass, unref, normalizeStyle, renderSlot, createCommentVNode, getCurrentScope, onScopeDispose, provide, reactive, nextTick, onBeforeMount, withDirectives, createVNode, vShow } from "vue";
function bottom(layout) {
  let max = 0, bottomY;
  for (let i2 = 0, len = layout.length; i2 < len; i2++) {
    bottomY = layout[i2].y + layout[i2].h;
    if (bottomY > max)
      max = bottomY;
  }
  return max;
}
function cloneLayout(layout) {
  const newLayout = Array(layout.length);
  for (let i2 = 0, len = layout.length; i2 < len; i2++) {
    newLayout[i2] = cloneLayoutItem(layout[i2]);
  }
  return newLayout;
}
function cloneLayoutItem(layoutItem) {
  return JSON.parse(JSON.stringify(layoutItem));
}
function collides(l1, l2) {
  if (l1 === l2)
    return false;
  if (l1.x + l1.w <= l2.x)
    return false;
  if (l1.x >= l2.x + l2.w)
    return false;
  if (l1.y + l1.h <= l2.y)
    return false;
  if (l1.y >= l2.y + l2.h)
    return false;
  return true;
}
function compact(layout, verticalCompact) {
  const compareWith = getStatics(layout);
  const sorted = sortLayoutItemsByRowCol(layout);
  const out = Array(layout.length);
  for (let i2 = 0, len = sorted.length; i2 < len; i2++) {
    let l2 = sorted[i2];
    if (!l2.static) {
      l2 = compactItem(compareWith, l2, verticalCompact);
      compareWith.push(l2);
    }
    out[layout.indexOf(l2)] = l2;
    l2.moved = false;
  }
  return out;
}
function compactItem(compareWith, l2, verticalCompact) {
  if (verticalCompact) {
    while (l2.y > 0 && !getFirstCollision(compareWith, l2)) {
      l2.y--;
    }
  }
  let collides2;
  while (collides2 = getFirstCollision(compareWith, l2)) {
    l2.y = collides2.y + collides2.h;
  }
  return l2;
}
function correctBounds(layout, bounds) {
  const collidesWith = getStatics(layout);
  for (let i2 = 0, len = layout.length; i2 < len; i2++) {
    const l2 = layout[i2];
    if (l2.x + l2.w > bounds.cols)
      l2.x = bounds.cols - l2.w;
    if (l2.x < 0) {
      l2.x = 0;
      l2.w = bounds.cols;
    }
    if (!l2.static)
      collidesWith.push(l2);
    else {
      while (getFirstCollision(collidesWith, l2)) {
        l2.y++;
      }
    }
  }
  return layout;
}
function getLayoutItem(layout, id) {
  for (let i2 = 0, len = layout.length; i2 < len; i2++) {
    if (layout[i2].i === id)
      return layout[i2];
  }
}
function getFirstCollision(layout, layoutItem) {
  for (let i2 = 0, len = layout.length; i2 < len; i2++) {
    if (collides(layout[i2], layoutItem))
      return layout[i2];
  }
}
function getAllCollisions(layout, layoutItem) {
  return layout.filter((l2) => collides(l2, layoutItem));
}
function getStatics(layout) {
  return layout.filter((l2) => l2.static);
}
function moveElement(layout, l2, x, y, isUserAction, preventCollision) {
  if (l2.static)
    return layout;
  const oldX = l2.x;
  const oldY = l2.y;
  const movingUp = y && l2.y > y;
  if (typeof x === "number")
    l2.x = x;
  if (typeof y === "number")
    l2.y = y;
  l2.moved = true;
  let sorted = sortLayoutItemsByRowCol(layout);
  if (movingUp)
    sorted = sorted.reverse();
  const collisions = getAllCollisions(sorted, l2);
  if (preventCollision && collisions.length) {
    l2.x = oldX;
    l2.y = oldY;
    l2.moved = false;
    return layout;
  }
  for (let i2 = 0, len = collisions.length; i2 < len; i2++) {
    const collision = collisions[i2];
    if (collision.moved)
      continue;
    if (l2.y > collision.y && l2.y - collision.y > collision.h / 4)
      continue;
    if (collision.static) {
      layout = moveElementAwayFromCollision(layout, collision, l2, isUserAction);
    } else {
      layout = moveElementAwayFromCollision(layout, l2, collision, isUserAction);
    }
  }
  return layout;
}
function moveElementAwayFromCollision(layout, collidesWith, itemToMove, isUserAction) {
  const preventCollision = false;
  if (isUserAction) {
    const fakeItem = {
      x: itemToMove.x,
      y: itemToMove.y,
      w: itemToMove.w,
      h: itemToMove.h,
      i: "-1"
    };
    fakeItem.y = Math.max(collidesWith.y - itemToMove.h, 0);
    if (!getFirstCollision(layout, fakeItem)) {
      return moveElement(layout, itemToMove, void 0, fakeItem.y, isUserAction, preventCollision);
    }
  }
  return moveElement(layout, itemToMove, void 0, itemToMove.y + 1, isUserAction, preventCollision);
}
function setTransform(top, left, width, height) {
  const translate = "translate3d(" + left + "px," + top + "px, 0)";
  return {
    transform: translate,
    WebkitTransform: translate,
    MozTransform: translate,
    msTransform: translate,
    OTransform: translate,
    width: width + "px",
    height: height + "px",
    position: "absolute"
  };
}
function setTransformRtl(top, right, width, height) {
  const translate = "translate3d(" + right * -1 + "px," + top + "px, 0)";
  return {
    transform: translate,
    WebkitTransform: translate,
    MozTransform: translate,
    msTransform: translate,
    OTransform: translate,
    width: width + "px",
    height: height + "px",
    position: "absolute"
  };
}
function setTopLeft(top, left, width, height) {
  return {
    top: top + "px",
    left: left + "px",
    width: width + "px",
    height: height + "px",
    position: "absolute"
  };
}
function setTopRight(top, right, width, height) {
  return {
    top: top + "px",
    right: right + "px",
    width: width + "px",
    height: height + "px",
    position: "absolute"
  };
}
function sortLayoutItemsByRowCol(layout) {
  return [].concat(layout).sort(function(a2, b) {
    if (a2.y === b.y && a2.x === b.x) {
      return 0;
    }
    if (a2.y > b.y || a2.y === b.y && a2.x > b.x) {
      return 1;
    }
    return -1;
  });
}
function validateLayout(layout, contextName) {
  contextName = contextName || "Layout";
  const subProps = ["x", "y", "w", "h"];
  const keyArr = [];
  if (!Array.isArray(layout))
    throw new Error(contextName + " must be an array!");
  for (let i2 = 0, len = layout.length; i2 < len; i2++) {
    const item = layout[i2];
    for (let j = 0; j < subProps.length; j++) {
      if (typeof item[subProps[j]] !== "number") {
        throw new Error("VueGridLayout: " + contextName + "[" + i2 + "]." + subProps[j] + " must be a number!");
      }
    }
    if (item.i === void 0 || item.i === null) {
      throw new Error("VueGridLayout: " + contextName + "[" + i2 + "].i cannot be null!");
    }
    if (typeof item.i !== "number" && typeof item.i !== "string") {
      throw new Error("VueGridLayout: " + contextName + "[" + i2 + "].i must be a string or number!");
    }
    if (keyArr.indexOf(item.i) >= 0) {
      throw new Error("VueGridLayout: " + contextName + "[" + i2 + "].i must be unique!");
    }
    keyArr.push(item.i);
    if (item.static !== void 0 && typeof item.static !== "boolean") {
      throw new Error("VueGridLayout: " + contextName + "[" + i2 + "].static must be a boolean!");
    }
  }
}
const getControlPosition = (e2) => offsetXYFromParentOf(e2);
function offsetXYFromParentOf(evt) {
  const offsetParent = evt.target.offsetParent || document.body;
  const offsetParentRect = offsetParent === document.body ? { left: 0, top: 0 } : offsetParent.getBoundingClientRect();
  const x = evt.clientX + offsetParent.scrollLeft - offsetParentRect.left;
  const y = evt.clientY + offsetParent.scrollTop - offsetParentRect.top;
  return { x, y };
}
function createCoreData(lastX, lastY, x, y) {
  const isStart = isNaN(lastX);
  if (isStart) {
    return {
      deltaX: 0,
      deltaY: 0,
      lastX: x,
      lastY: y,
      x,
      y
    };
  } else {
    return {
      deltaX: x - lastX,
      deltaY: y - lastY,
      lastX,
      lastY,
      x,
      y
    };
  }
}
function getBreakpointFromWidth(breakpoints, width) {
  const sorted = sortBreakpoints(breakpoints);
  let matching = sorted[0];
  for (let i2 = 1, len = sorted.length; i2 < len; i2++) {
    const breakpointName = sorted[i2];
    if (width > breakpoints[breakpointName])
      matching = breakpointName;
  }
  return matching;
}
function getColsFromBreakpoint(breakpoint, cols) {
  if (!cols[breakpoint]) {
    throw new Error("ResponsiveGridLayout: `cols` entry for breakpoint " + breakpoint + " is missing!");
  }
  return cols[breakpoint];
}
function findOrGenerateResponsiveLayout(orgLayout, layouts, breakpoints, breakpoint, lastBreakpoint, cols, verticalCompact) {
  if (layouts[breakpoint])
    return cloneLayout(layouts[breakpoint]);
  let layout = orgLayout;
  const breakpointsSorted = sortBreakpoints(breakpoints);
  const breakpointsAbove = breakpointsSorted.slice(breakpointsSorted.indexOf(breakpoint));
  for (let i2 = 0, len = breakpointsAbove.length; i2 < len; i2++) {
    const b = breakpointsAbove[i2];
    if (layouts[b]) {
      layout = layouts[b];
      break;
    }
  }
  layout = cloneLayout(layout || []);
  return compact(correctBounds(layout, { cols }), verticalCompact);
}
function sortBreakpoints(breakpoints) {
  const keys = Object.keys(breakpoints);
  return keys.sort(function(a2, b) {
    return breakpoints[a2] - breakpoints[b];
  });
}
const e$b = { init(t2) {
  const l2 = t2;
  e$b.document = l2.document, e$b.DocumentFragment = l2.DocumentFragment || n$8, e$b.SVGElement = l2.SVGElement || n$8, e$b.SVGSVGElement = l2.SVGSVGElement || n$8, e$b.SVGElementInstance = l2.SVGElementInstance || n$8, e$b.Element = l2.Element || n$8, e$b.HTMLElement = l2.HTMLElement || e$b.Element, e$b.Event = l2.Event, e$b.Touch = l2.Touch || n$8, e$b.PointerEvent = l2.PointerEvent || l2.MSPointerEvent;
}, document: null, DocumentFragment: null, SVGElement: null, SVGSVGElement: null, SVGElementInstance: null, Element: null, HTMLElement: null, Event: null, Touch: null, PointerEvent: null };
function n$8() {
}
var s$d = e$b;
var o$h = (n2) => !(!n2 || !n2.Window) && n2 instanceof n2.Window;
let realWindow;
let n$7;
function init(o2) {
  realWindow = o2;
  const e2 = o2.document.createTextNode("");
  e2.ownerDocument !== o2.document && typeof o2.wrap == "function" && o2.wrap(e2) === e2 && (o2 = o2.wrap(o2)), n$7 = o2;
}
typeof window != "undefined" && window && init(window);
function getWindow(e2) {
  return o$h(e2) ? e2 : (e2.ownerDocument || e2).defaultView || n$7.window;
}
const e$a = (o2) => !!o2 && typeof o2 == "object", n$6 = (o2) => typeof o2 == "function";
var s$c = { window: (e2) => e2 === n$7 || o$h(e2), docFrag: (o2) => e$a(o2) && o2.nodeType === 11, object: e$a, func: n$6, number: (o2) => typeof o2 == "number", bool: (o2) => typeof o2 == "boolean", string: (o2) => typeof o2 == "string", element(o2) {
  if (!o2 || typeof o2 != "object")
    return false;
  const e2 = getWindow(o2) || n$7;
  return /object|function/.test(typeof e2.Element) ? o2 instanceof e2.Element : o2.nodeType === 1 && typeof o2.nodeName == "string";
}, plainObject: (o2) => e$a(o2) && !!o2.constructor && /function Object\b/.test(o2.constructor.toString()), array: (o2) => e$a(o2) && o2.length !== void 0 && n$6(o2.splice) };
const o$g = { init(n2) {
  const r2 = s$d.Element, s2 = n2.navigator || {};
  o$g.supportsTouch = "ontouchstart" in n2 || s$c.func(n2.DocumentTouch) && s$d.document instanceof n2.DocumentTouch, o$g.supportsPointerEvent = s2.pointerEnabled !== false && !!s$d.PointerEvent, o$g.isIOS = /iP(hone|od|ad)/.test(s2.platform), o$g.isIOS7 = /iP(hone|od|ad)/.test(s2.platform) && /OS 7[^\d]/.test(s2.appVersion), o$g.isIe9 = /MSIE 9/.test(s2.userAgent), o$g.isOperaMobile = s2.appName === "Opera" && o$g.supportsTouch && /Presto/.test(s2.userAgent), o$g.prefixedMatchesSelector = "matches" in r2.prototype ? "matches" : "webkitMatchesSelector" in r2.prototype ? "webkitMatchesSelector" : "mozMatchesSelector" in r2.prototype ? "mozMatchesSelector" : "oMatchesSelector" in r2.prototype ? "oMatchesSelector" : "msMatchesSelector", o$g.pEventTypes = o$g.supportsPointerEvent ? s$d.PointerEvent === n2.MSPointerEvent ? { up: "MSPointerUp", down: "MSPointerDown", over: "mouseover", out: "mouseout", move: "MSPointerMove", cancel: "MSPointerCancel" } : { up: "pointerup", down: "pointerdown", over: "pointerover", out: "pointerout", move: "pointermove", cancel: "pointercancel" } : null, o$g.wheelEvent = s$d.document && "onmousewheel" in s$d.document ? "mousewheel" : "wheel";
}, supportsTouch: null, supportsPointerEvent: null, isIOS7: null, isIOS: null, isIe9: null, isOperaMobile: null, prefixedMatchesSelector: null, pEventTypes: null, wheelEvent: null };
var t$7 = o$g;
const contains = (e2, n2) => e2.indexOf(n2) !== -1;
const merge = (e2, n2) => {
  for (const o2 of n2)
    e2.push(o2);
  return e2;
};
const from = (e2) => merge([], e2);
const findIndex = (e2, n2) => {
  for (let o2 = 0; o2 < e2.length; o2++)
    if (n2(e2[o2], o2, e2))
      return o2;
  return -1;
};
const find = (e2, n2) => e2[findIndex(e2, n2)];
function t$6(n2) {
  const s2 = {};
  for (const a2 in n2) {
    const f2 = n2[a2];
    s$c.plainObject(f2) ? s2[a2] = t$6(f2) : s$c.array(f2) ? s2[a2] = from(f2) : s2[a2] = f2;
  }
  return s2;
}
function n$5(n2, t2) {
  for (const o2 in t2)
    n2[o2] = t2[o2];
  return n2;
}
let e$9, t$5, n$4 = 0;
var o$f = { request: (t2) => e$9(t2), cancel: (e2) => t$5(e2), init(a2) {
  if (e$9 = a2.requestAnimationFrame, t$5 = a2.cancelAnimationFrame, !e$9) {
    const n2 = ["ms", "moz", "webkit", "o"];
    for (const i2 of n2)
      e$9 = a2[i2 + "RequestAnimationFrame"], t$5 = a2[i2 + "CancelAnimationFrame"] || a2[i2 + "CancelRequestAnimationFrame"];
  }
  e$9 = e$9 && e$9.bind(a2), t$5 = t$5 && t$5.bind(a2), e$9 || (e$9 = (e2) => {
    const t2 = Date.now(), i2 = Math.max(0, 16 - (t2 - n$4)), o2 = a2.setTimeout(() => {
      e2(t2 + i2);
    }, i2);
    return n$4 = t2 + i2, o2;
  }, t$5 = (e2) => clearTimeout(e2));
} };
function e$8(f2, i2, n2) {
  if (n2 = n2 || {}, s$c.string(f2) && f2.search(" ") !== -1 && (f2 = o$e(f2)), s$c.array(f2))
    return f2.reduce((t2, o2) => n$5(t2, e$8(o2, i2, n2)), n2);
  if (s$c.object(f2) && (i2 = f2, f2 = ""), s$c.func(i2))
    n2[f2] = n2[f2] || [], n2[f2].push(i2);
  else if (s$c.array(i2))
    for (const r2 of i2)
      e$8(f2, r2, n2);
  else if (s$c.object(i2))
    for (const r2 in i2)
      e$8(o$e(r2).map((r3) => `${f2}${r3}`), i2[r2], n2);
  return n2;
}
function o$e(r2) {
  return r2.trim().split(/ +/);
}
function s$b(t2, o2) {
  for (const i2 of o2) {
    if (t2.immediatePropagationStopped)
      break;
    i2(t2);
  }
}
class Eventable {
  constructor(t2) {
    this.options = void 0, this.types = {}, this.propagationStopped = false, this.immediatePropagationStopped = false, this.global = void 0, this.options = n$5({}, t2 || {});
  }
  fire(t2) {
    let o2;
    const i2 = this.global;
    (o2 = this.types[t2.type]) && s$b(t2, o2), !t2.propagationStopped && i2 && (o2 = i2[t2.type]) && s$b(t2, o2);
  }
  on(o2, s2) {
    const e2 = e$8(o2, s2);
    for (o2 in e2)
      this.types[o2] = merge(this.types[o2] || [], e2[o2]);
  }
  off(t2, o2) {
    const s2 = e$8(t2, o2);
    for (t2 in s2) {
      const o3 = this.types[t2];
      if (o3 && o3.length)
        for (const i2 of s2[t2]) {
          const t3 = o3.indexOf(i2);
          t3 !== -1 && o3.splice(t3, 1);
        }
    }
  }
  getRect(t2) {
    return null;
  }
}
function nodeContains(e2, t2) {
  if (e2.contains)
    return e2.contains(t2);
  for (; t2; ) {
    if (t2 === e2)
      return true;
    t2 = t2.parentNode;
  }
  return false;
}
function closest(e2, t2) {
  for (; s$c.element(e2); ) {
    if (matchesSelector(e2, t2))
      return e2;
    e2 = parentNode(e2);
  }
  return null;
}
function parentNode(e2) {
  let t2 = e2.parentNode;
  if (s$c.docFrag(t2)) {
    for (; (t2 = t2.host) && s$c.docFrag(t2); )
      ;
    return t2;
  }
  return t2;
}
function matchesSelector(t2, n2) {
  return n$7 !== realWindow && (n2 = n2.replace(/\/deep\//g, " ")), t2[t$7.prefixedMatchesSelector](n2);
}
function matchesUpTo(e2, t2, o2) {
  for (; s$c.element(e2); ) {
    if (matchesSelector(e2, t2))
      return true;
    if ((e2 = parentNode(e2)) === o2)
      return matchesSelector(e2, t2);
  }
  return false;
}
function getActualElement(e2) {
  return e2.correspondingUseElement || e2;
}
function getScrollXY(e2) {
  return { x: (e2 = e2 || n$7).scrollX || e2.document.documentElement.scrollLeft, y: e2.scrollY || e2.document.documentElement.scrollTop };
}
function getElementClientRect(e2) {
  const n2 = e2 instanceof s$d.SVGElement ? e2.getBoundingClientRect() : e2.getClientRects()[0];
  return n2 && { left: n2.left, right: n2.right, top: n2.top, bottom: n2.bottom, width: n2.width || n2.right - n2.left, height: n2.height || n2.bottom - n2.top };
}
function getElementRect(t2) {
  const n2 = getElementClientRect(t2);
  if (!t$7.isIOS7 && n2) {
    const e2 = getScrollXY(getWindow(t2));
    n2.left += e2.x, n2.right += e2.x, n2.top += e2.y, n2.bottom += e2.y;
  }
  return n2;
}
function trySelector(e2) {
  return !!s$c.string(e2) && (s$d.document.querySelector(e2), true);
}
function getStringOptionResult(o2, r2, i2) {
  return o2 === "parent" ? parentNode(i2) : o2 === "self" ? r2.getRect(i2) : closest(i2, o2);
}
function resolveRectLike(t2, e2, r2, n2) {
  let p2 = t2;
  return s$c.string(p2) ? p2 = getStringOptionResult(p2, e2, r2) : s$c.func(p2) && (p2 = p2(...n2)), s$c.element(p2) && (p2 = getElementRect(p2)), p2;
}
function rectToXY(t2) {
  return t2 && { x: "x" in t2 ? t2.x : t2.left, y: "y" in t2 ? t2.y : t2.top };
}
function xywhToTlbr(t2) {
  return !t2 || "left" in t2 && "top" in t2 || ((t2 = n$5({}, t2)).left = t2.x || 0, t2.top = t2.y || 0, t2.right = t2.right || t2.left + t2.width, t2.bottom = t2.bottom || t2.top + t2.height), t2;
}
function tlbrToXywh(t2) {
  return !t2 || "x" in t2 && "y" in t2 || ((t2 = n$5({}, t2)).x = t2.left || 0, t2.y = t2.top || 0, t2.width = t2.width || (t2.right || 0) - t2.x, t2.height = t2.height || (t2.bottom || 0) - t2.y), t2;
}
function addEdges(t2, o2, e2) {
  t2.left && (o2.left += e2.x), t2.right && (o2.right += e2.x), t2.top && (o2.top += e2.y), t2.bottom && (o2.bottom += e2.y), o2.width = o2.right - o2.left, o2.height = o2.bottom - o2.top;
}
var e$7 = (t2, i2, n2) => {
  const p2 = t2.options[n2], e2 = p2 && p2.origin || t2.options.origin, s2 = resolveRectLike(e2, t2, i2, [t2 && i2]);
  return rectToXY(s2) || { x: 0, y: 0 };
};
var n$3 = (t2, a2) => Math.sqrt(t2 * t2 + a2 * a2);
class BaseEvent {
  constructor(t2) {
    this.type = void 0, this.target = void 0, this.currentTarget = void 0, this.interactable = void 0, this._interaction = void 0, this.timeStamp = void 0, this.immediatePropagationStopped = false, this.propagationStopped = false, this._interaction = t2;
  }
  preventDefault() {
  }
  stopPropagation() {
    this.propagationStopped = true;
  }
  stopImmediatePropagation() {
    this.immediatePropagationStopped = this.propagationStopped = true;
  }
}
Object.defineProperty(BaseEvent.prototype, "interaction", { get() {
  return this._interaction._proxy;
}, set() {
} });
const defaults = { base: { preventDefault: "auto", deltaSource: "page" }, perAction: { enabled: false, origin: { x: 0, y: 0 } }, actions: {} };
class InteractEvent extends BaseEvent {
  constructor(s2, r2, h, n2, a2, p2, d2) {
    super(s2), this.target = void 0, this.currentTarget = void 0, this.relatedTarget = null, this.screenX = void 0, this.screenY = void 0, this.button = void 0, this.buttons = void 0, this.ctrlKey = void 0, this.shiftKey = void 0, this.altKey = void 0, this.metaKey = void 0, this.page = void 0, this.client = void 0, this.delta = void 0, this.rect = void 0, this.x0 = void 0, this.y0 = void 0, this.t0 = void 0, this.dt = void 0, this.duration = void 0, this.clientX0 = void 0, this.clientY0 = void 0, this.velocity = void 0, this.speed = void 0, this.swipe = void 0, this.timeStamp = void 0, this.axes = void 0, this.preEnd = void 0, a2 = a2 || s2.element;
    const c2 = s2.interactable, l2 = (c2 && c2.options || defaults).deltaSource, v = e$7(c2, a2, h), y = n2 === "start", g = n2 === "end", m2 = y ? this : s2.prevEvent, u2 = y ? s2.coords.start : g ? { page: m2.page, client: m2.client, timeStamp: s2.coords.cur.timeStamp } : s2.coords.cur;
    this.page = n$5({}, u2.page), this.client = n$5({}, u2.client), this.rect = n$5({}, s2.rect), this.timeStamp = u2.timeStamp, g || (this.page.x -= v.x, this.page.y -= v.y, this.client.x -= v.x, this.client.y -= v.y), this.ctrlKey = r2.ctrlKey, this.altKey = r2.altKey, this.shiftKey = r2.shiftKey, this.metaKey = r2.metaKey, this.button = r2.button, this.buttons = r2.buttons, this.target = a2, this.currentTarget = a2, this.preEnd = p2, this.type = d2 || h + (n2 || ""), this.interactable = c2, this.t0 = y ? s2.pointers[s2.pointers.length - 1].downTime : m2.t0, this.x0 = s2.coords.start.page.x - v.x, this.y0 = s2.coords.start.page.y - v.y, this.clientX0 = s2.coords.start.client.x - v.x, this.clientY0 = s2.coords.start.client.y - v.y, this.delta = y || g ? { x: 0, y: 0 } : { x: this[l2].x - m2[l2].x, y: this[l2].y - m2[l2].y }, this.dt = s2.coords.delta.timeStamp, this.duration = this.timeStamp - this.t0, this.velocity = n$5({}, s2.coords.velocity[l2]), this.speed = n$3(this.velocity.x, this.velocity.y), this.swipe = g || n2 === "inertiastart" ? this.getSwipe() : null;
  }
  getSwipe() {
    const t2 = this._interaction;
    if (t2.prevEvent.speed < 600 || this.timeStamp - t2.prevEvent.timeStamp > 150)
      return null;
    let e2 = 180 * Math.atan2(t2.prevEvent.velocityY, t2.prevEvent.velocityX) / Math.PI;
    e2 < 0 && (e2 += 360);
    const i2 = 112.5 <= e2 && e2 < 247.5, s2 = 202.5 <= e2 && e2 < 337.5;
    return { up: s2, down: !s2 && 22.5 <= e2 && e2 < 157.5, left: i2, right: !i2 && (292.5 <= e2 || e2 < 67.5), angle: e2, speed: t2.prevEvent.speed, velocity: { x: t2.prevEvent.velocityX, y: t2.prevEvent.velocityY } };
  }
  preventDefault() {
  }
  stopImmediatePropagation() {
    this.immediatePropagationStopped = this.propagationStopped = true;
  }
  stopPropagation() {
    this.propagationStopped = true;
  }
}
Object.defineProperties(InteractEvent.prototype, { pageX: { get() {
  return this.page.x;
}, set(t2) {
  this.page.x = t2;
} }, pageY: { get() {
  return this.page.y;
}, set(t2) {
  this.page.y = t2;
} }, clientX: { get() {
  return this.client.x;
}, set(t2) {
  this.client.x = t2;
} }, clientY: { get() {
  return this.client.y;
}, set(t2) {
  this.client.y = t2;
} }, dx: { get() {
  return this.delta.x;
}, set(t2) {
  this.delta.x = t2;
} }, dy: { get() {
  return this.delta.y;
}, set(t2) {
  this.delta.y = t2;
} }, velocityX: { get() {
  return this.velocity.x;
}, set(t2) {
  this.velocity.x = t2;
} }, velocityY: { get() {
  return this.velocity.y;
}, set(t2) {
  this.velocity.y = t2;
} } });
function warnOnce(e2, o2) {
  let r2 = false;
  return function() {
    return r2 || (n$7.console.warn(o2), r2 = true), e2.apply(this, arguments);
  };
}
function copyAction(n2, e2) {
  return n2.name = e2.name, n2.axis = e2.axis, n2.edges = e2.edges, n2;
}
function e$6(o2, t2) {
  for (const n2 in t2) {
    const r2 = e$6.prefixedPropREs;
    let i2 = false;
    for (const e2 in r2)
      if (n2.indexOf(e2) === 0 && r2[e2].test(n2)) {
        i2 = true;
        break;
      }
    i2 || typeof t2[n2] == "function" || (o2[n2] = t2[n2]);
  }
  return o2;
}
e$6.prefixedPropREs = { webkit: /(Movement[XY]|Radius[XY]|RotationAngle|Force)$/, moz: /(Pressure)$/ };
function copyCoords(t2, e2) {
  t2.page = t2.page || {}, t2.page.x = e2.page.x, t2.page.y = e2.page.y, t2.client = t2.client || {}, t2.client.x = e2.client.x, t2.client.y = e2.client.y, t2.timeStamp = e2.timeStamp;
}
function setCoordDeltas(t2, e2, o2) {
  t2.page.x = o2.page.x - e2.page.x, t2.page.y = o2.page.y - e2.page.y, t2.client.x = o2.client.x - e2.client.x, t2.client.y = o2.client.y - e2.client.y, t2.timeStamp = o2.timeStamp - e2.timeStamp;
}
function setCoordVelocity(t2, e2) {
  const o2 = Math.max(e2.timeStamp / 1e3, 1e-3);
  t2.page.x = e2.page.x / o2, t2.page.y = e2.page.y / o2, t2.client.x = e2.client.x / o2, t2.client.y = e2.client.y / o2, t2.timeStamp = o2;
}
function setZeroCoords(t2) {
  t2.page.x = 0, t2.page.y = 0, t2.client.x = 0, t2.client.y = 0;
}
function isNativePointer(t2) {
  return t2 instanceof s$d.Event || t2 instanceof s$d.Touch;
}
function getXY(t2, e2, o2) {
  return t2 = t2 || "page", (o2 = o2 || {}).x = e2[t2 + "X"], o2.y = e2[t2 + "Y"], o2;
}
function getPageXY(e2, o2) {
  return o2 = o2 || { x: 0, y: 0 }, t$7.isOperaMobile && isNativePointer(e2) ? (getXY("screen", e2, o2), o2.x += window.scrollX, o2.y += window.scrollY) : getXY("page", e2, o2), o2;
}
function getClientXY(e2, o2) {
  return o2 = o2 || {}, t$7.isOperaMobile && isNativePointer(e2) ? getXY("screen", e2, o2) : getXY("client", e2, o2), o2;
}
function getPointerId(t2) {
  return s$c.number(t2.pointerId) ? t2.pointerId : t2.identifier;
}
function setCoords(t2, e2, o2) {
  const n2 = e2.length > 1 ? pointerAverage(e2) : e2[0];
  getPageXY(n2, t2.page), getClientXY(n2, t2.client), t2.timeStamp = o2;
}
function getTouchPair(t2) {
  const e2 = [];
  return s$c.array(t2) ? (e2[0] = t2[0], e2[1] = t2[1]) : t2.type === "touchend" ? t2.touches.length === 1 ? (e2[0] = t2.touches[0], e2[1] = t2.changedTouches[0]) : t2.touches.length === 0 && (e2[0] = t2.changedTouches[0], e2[1] = t2.changedTouches[1]) : (e2[0] = t2.touches[0], e2[1] = t2.touches[1]), e2;
}
function pointerAverage(t2) {
  const e2 = { pageX: 0, pageY: 0, clientX: 0, clientY: 0, screenX: 0, screenY: 0 };
  for (const o2 of t2)
    for (const t3 in e2)
      e2[t3] += o2[t3];
  for (const o2 in e2)
    e2[o2] /= t2.length;
  return e2;
}
function touchBBox(t2) {
  if (!t2.length)
    return null;
  const e2 = getTouchPair(t2), o2 = Math.min(e2[0].pageX, e2[1].pageX), n2 = Math.min(e2[0].pageY, e2[1].pageY), r2 = Math.max(e2[0].pageX, e2[1].pageX), i2 = Math.max(e2[0].pageY, e2[1].pageY);
  return { x: o2, y: n2, left: o2, top: n2, right: r2, bottom: i2, width: r2 - o2, height: i2 - n2 };
}
function touchDistance(t2, e2) {
  const o2 = e2 + "X", r2 = e2 + "Y", i2 = getTouchPair(t2), c2 = i2[0][o2] - i2[1][o2], p2 = i2[0][r2] - i2[1][r2];
  return n$3(c2, p2);
}
function touchAngle(t2, e2) {
  const o2 = e2 + "X", n2 = e2 + "Y", r2 = getTouchPair(t2), i2 = r2[1][o2] - r2[0][o2], c2 = r2[1][n2] - r2[0][n2];
  return 180 * Math.atan2(c2, i2) / Math.PI;
}
function getPointerType(t2) {
  return s$c.string(t2.pointerType) ? t2.pointerType : s$c.number(t2.pointerType) ? [void 0, void 0, "touch", "pen", "mouse"][t2.pointerType] : /touch/.test(t2.type || "") || t2 instanceof s$d.Touch ? "touch" : "mouse";
}
function getEventTargets(t2) {
  const e2 = s$c.func(t2.composedPath) ? t2.composedPath() : t2.path;
  return [getActualElement(e2 ? e2[0] : t2.target), getActualElement(t2.currentTarget)];
}
function newCoords() {
  return { page: { x: 0, y: 0 }, client: { x: 0, y: 0 }, timeStamp: 0 };
}
function e$5(e2, n2) {
  if (n2.phaselessTypes[e2])
    return true;
  for (const r2 in n2.map)
    if (e2.indexOf(r2) === 0 && e2.substr(r2.length) in n2.phases)
      return true;
  return false;
}
function createInteractStatic(r2) {
  const c2 = (t2, e2) => {
    let o2 = r2.interactables.get(t2, e2);
    return o2 || (o2 = r2.interactables.new(t2, e2), o2.events.global = c2.globalEvents), o2;
  };
  return c2.getPointerAverage = pointerAverage, c2.getTouchBBox = touchBBox, c2.getTouchDistance = touchDistance, c2.getTouchAngle = touchAngle, c2.getElementRect = getElementRect, c2.getElementClientRect = getElementClientRect, c2.matchesSelector = matchesSelector, c2.closest = closest, c2.globalEvents = {}, c2.version = "1.10.11", c2.scope = r2, c2.use = function(t2, e2) {
    return this.scope.usePlugin(t2, e2), this;
  }, c2.isSet = function(t2, e2) {
    return !!this.scope.interactables.get(t2, e2 && e2.context);
  }, c2.on = warnOnce(function(t2, e2, s2) {
    if (s$c.string(t2) && t2.search(" ") !== -1 && (t2 = t2.trim().split(/ +/)), s$c.array(t2)) {
      for (const o2 of t2)
        this.on(o2, e2, s2);
      return this;
    }
    if (s$c.object(t2)) {
      for (const o2 in t2)
        this.on(o2, t2[o2], e2);
      return this;
    }
    return e$5(t2, this.scope.actions) ? this.globalEvents[t2] ? this.globalEvents[t2].push(e2) : this.globalEvents[t2] = [e2] : this.scope.events.add(this.scope.document, t2, e2, { options: s2 }), this;
  }, "The interact.on() method is being deprecated"), c2.off = warnOnce(function(t2, e2, s2) {
    if (s$c.string(t2) && t2.search(" ") !== -1 && (t2 = t2.trim().split(/ +/)), s$c.array(t2)) {
      for (const o2 of t2)
        this.off(o2, e2, s2);
      return this;
    }
    if (s$c.object(t2)) {
      for (const o2 in t2)
        this.off(o2, t2[o2], e2);
      return this;
    }
    if (e$5(t2, this.scope.actions)) {
      let o2;
      t2 in this.globalEvents && (o2 = this.globalEvents[t2].indexOf(e2)) !== -1 && this.globalEvents[t2].splice(o2, 1);
    } else
      this.scope.events.remove(this.scope.document, t2, e2, s2);
    return this;
  }, "The interact.off() method is being deprecated"), c2.debug = function() {
    return this.scope;
  }, c2.supportsTouch = () => t$7.supportsTouch, c2.supportsPointerEvent = () => t$7.supportsPointerEvent, c2.stop = function() {
    for (const t2 of this.scope.interactions.list)
      t2.stop();
    return this;
  }, c2.pointerMoveTolerance = function(t2) {
    return s$c.number(t2) ? (this.scope.interactions.pointerMoveTolerance = t2, this) : this.scope.interactions.pointerMoveTolerance;
  }, c2.addDocument = function(t2, e2) {
    this.scope.addDocument(t2, e2);
  }, c2.removeDocument = function(t2) {
    this.scope.removeDocument(t2);
  }, c2;
}
class Interactable {
  get _defaults() {
    return { base: {}, perAction: {}, actions: {} };
  }
  constructor(t2, e2, s2, o2) {
    this.options = void 0, this._actions = void 0, this.target = void 0, this.events = new Eventable(), this._context = void 0, this._win = void 0, this._doc = void 0, this._scopeEvents = void 0, this._rectChecker = void 0, this._actions = e2.actions, this.target = t2, this._context = e2.context || s2, this._win = getWindow(trySelector(t2) ? this._context : t2), this._doc = this._win.document, this._scopeEvents = o2, this.set(e2);
  }
  setOnEvents(t2, e2) {
    return s$c.func(e2.onstart) && this.on(t2 + "start", e2.onstart), s$c.func(e2.onmove) && this.on(t2 + "move", e2.onmove), s$c.func(e2.onend) && this.on(t2 + "end", e2.onend), s$c.func(e2.oninertiastart) && this.on(t2 + "inertiastart", e2.oninertiastart), this;
  }
  updatePerActionListeners(t2, e2, s2) {
    (s$c.array(e2) || s$c.object(e2)) && this.off(t2, e2), (s$c.array(s2) || s$c.object(s2)) && this.on(t2, s2);
  }
  setPerAction(e2, o2) {
    const i2 = this._defaults;
    for (const n2 in o2) {
      const r2 = n2, a2 = this.options[e2], l2 = o2[r2];
      r2 === "listeners" && this.updatePerActionListeners(e2, a2.listeners, l2), s$c.array(l2) ? a2[r2] = from(l2) : s$c.plainObject(l2) ? (a2[r2] = n$5(a2[r2] || {}, t$6(l2)), s$c.object(i2.perAction[r2]) && "enabled" in i2.perAction[r2] && (a2[r2].enabled = l2.enabled !== false)) : s$c.bool(l2) && s$c.object(i2.perAction[r2]) ? a2[r2].enabled = l2 : a2[r2] = l2;
    }
  }
  getRect(t2) {
    return t2 = t2 || (s$c.element(this.target) ? this.target : null), s$c.string(this.target) && (t2 = t2 || this._context.querySelector(this.target)), getElementRect(t2);
  }
  rectChecker(t2) {
    return s$c.func(t2) ? (this._rectChecker = t2, this.getRect = (t3) => {
      const e2 = n$5({}, this._rectChecker(t3));
      return "width" in e2 || (e2.width = e2.right - e2.left, e2.height = e2.bottom - e2.top), e2;
    }, this) : t2 === null ? (delete this.getRect, delete this._rectChecker, this) : this.getRect;
  }
  _backCompatOption(t2, e2) {
    if (trySelector(e2) || s$c.object(e2)) {
      this.options[t2] = e2;
      for (const s2 in this._actions.map)
        this.options[s2][t2] = e2;
      return this;
    }
    return this.options[t2];
  }
  origin(t2) {
    return this._backCompatOption("origin", t2);
  }
  deltaSource(t2) {
    return t2 === "page" || t2 === "client" ? (this.options.deltaSource = t2, this) : this.options.deltaSource;
  }
  context() {
    return this._context;
  }
  inContext(t2) {
    return this._context === t2.ownerDocument || nodeContains(this._context, t2);
  }
  testIgnoreAllow(t2, e2, s2) {
    return !this.testIgnore(t2.ignoreFrom, e2, s2) && this.testAllow(t2.allowFrom, e2, s2);
  }
  testAllow(t2, e2, s2) {
    return !t2 || !!s$c.element(s2) && (s$c.string(t2) ? matchesUpTo(s2, t2, e2) : !!s$c.element(t2) && nodeContains(t2, s2));
  }
  testIgnore(t2, e2, s2) {
    return !(!t2 || !s$c.element(s2)) && (s$c.string(t2) ? matchesUpTo(s2, t2, e2) : !!s$c.element(t2) && nodeContains(t2, s2));
  }
  fire(t2) {
    return this.events.fire(t2), this;
  }
  _onOff(t2, s2, o2, i2) {
    s$c.object(s2) && !s$c.array(s2) && (i2 = o2, o2 = null);
    const n2 = t2 === "on" ? "add" : "remove", r2 = e$8(s2, o2);
    for (let s3 in r2) {
      s3 === "wheel" && (s3 = t$7.wheelEvent);
      for (const e2 of r2[s3])
        e$5(s3, this._actions) ? this.events[t2](s3, e2) : s$c.string(this.target) ? this._scopeEvents[n2 + "Delegate"](this.target, this._context, s3, e2, i2) : this._scopeEvents[n2](this.target, s3, e2, i2);
    }
    return this;
  }
  on(t2, e2, s2) {
    return this._onOff("on", t2, e2, s2);
  }
  off(t2, e2, s2) {
    return this._onOff("off", t2, e2, s2);
  }
  set(t2) {
    const e2 = this._defaults;
    s$c.object(t2) || (t2 = {}), this.options = t$6(e2.base);
    for (const s2 in this._actions.methodDict) {
      const o2 = s2, i2 = this._actions.methodDict[o2];
      this.options[o2] = {}, this.setPerAction(o2, n$5(n$5({}, e2.perAction), e2.actions[o2])), this[i2](t2[o2]);
    }
    for (const e3 in t2)
      s$c.func(this[e3]) && this[e3](t2[e3]);
    return this;
  }
  unset() {
    if (s$c.string(this.target))
      for (const t2 in this._scopeEvents.delegatedEvents) {
        const e2 = this._scopeEvents.delegatedEvents[t2];
        for (let s2 = e2.length - 1; s2 >= 0; s2--) {
          const { selector: o2, context: i2, listeners: n2 } = e2[s2];
          o2 === this.target && i2 === this._context && e2.splice(s2, 1);
          for (let e3 = n2.length - 1; e3 >= 0; e3--)
            this._scopeEvents.removeDelegate(this.target, this._context, t2, n2[e3][0], n2[e3][1]);
        }
      }
    else
      this._scopeEvents.remove(this.target, "all");
  }
}
class InteractableSet {
  constructor(e2) {
    this.list = [], this.selectorMap = {}, this.scope = void 0, this.scope = e2, e2.addListeners({ "interactable:unset": ({ interactable: e3 }) => {
      const { target: s2, _context: o2 } = e3, c2 = s$c.string(s2) ? this.selectorMap[s2] : s2[this.scope.id], n2 = findIndex(c2, (t2) => t2.context === o2);
      c2[n2] && (c2[n2].context = null, c2[n2].interactable = null), c2.splice(n2, 1);
    } });
  }
  new(t2, e2) {
    e2 = n$5(e2 || {}, { actions: this.scope.actions });
    const o2 = new this.scope.Interactable(t2, e2, this.scope.document, this.scope.events), c2 = { context: o2._context, interactable: o2 };
    return this.scope.addDocument(o2._doc), this.list.push(o2), s$c.string(t2) ? (this.selectorMap[t2] || (this.selectorMap[t2] = []), this.selectorMap[t2].push(c2)) : (o2.target[this.scope.id] || Object.defineProperty(t2, this.scope.id, { value: [], configurable: true }), t2[this.scope.id].push(c2)), this.scope.fire("interactable:new", { target: t2, options: e2, interactable: o2, win: this.scope._win }), o2;
  }
  get(e2, s2) {
    const o2 = s2 && s2.context || this.scope.document, c2 = s$c.string(e2), n2 = c2 ? this.selectorMap[e2] : e2[this.scope.id];
    if (!n2)
      return null;
    const r2 = find(n2, (t2) => t2.context === o2 && (c2 || t2.interactable.inContext(e2)));
    return r2 && r2.interactable;
  }
  forEachMatch(t2, s2) {
    for (const o2 of this.list) {
      let c2;
      if ((s$c.string(o2.target) ? s$c.element(t2) && matchesSelector(t2, o2.target) : t2 === o2.target) && o2.inContext(t2) && (c2 = s2(o2)), c2 !== void 0)
        return c2;
    }
  }
}
class i$b {
  constructor(e2) {
    this.currentTarget = void 0, this.originalEvent = void 0, this.type = void 0, this.originalEvent = e2, e$6(this, e2);
  }
  preventOriginalDefault() {
    this.originalEvent.preventDefault();
  }
  stopPropagation() {
    this.originalEvent.stopPropagation();
  }
  stopImmediatePropagation() {
    this.originalEvent.stopImmediatePropagation();
  }
}
function a$5(e2) {
  if (!s$c.object(e2))
    return { capture: !!e2, passive: false };
  const t2 = n$5({}, e2);
  return t2.capture = !!e2.capture, t2.passive = !!e2.passive, t2;
}
var c$2 = { id: "events", install(s2) {
  var r2;
  const p2 = [], l2 = {}, c2 = [], u2 = { add: v, remove: d2, addDelegate(t2, s3, n2, r3, o2) {
    const i2 = a$5(o2);
    if (!l2[n2]) {
      l2[n2] = [];
      for (const e2 of c2)
        v(e2, n2, f2), v(e2, n2, g, true);
    }
    const p3 = l2[n2];
    let u3 = find(p3, (e2) => e2.selector === t2 && e2.context === s3);
    u3 || (u3 = { selector: t2, context: s3, listeners: [] }, p3.push(u3)), u3.listeners.push([r3, i2]);
  }, removeDelegate(e2, t2, s3, n2, r3) {
    const o2 = a$5(r3), i2 = l2[s3];
    let p3, c3 = false;
    if (i2)
      for (p3 = i2.length - 1; p3 >= 0; p3--) {
        const r4 = i2[p3];
        if (r4.selector === e2 && r4.context === t2) {
          const { listeners: e3 } = r4;
          for (let r5 = e3.length - 1; r5 >= 0; r5--) {
            const [a2, { capture: l3, passive: u3 }] = e3[r5];
            if (a2 === n2 && l3 === o2.capture && u3 === o2.passive) {
              e3.splice(r5, 1), e3.length || (i2.splice(p3, 1), d2(t2, s3, f2), d2(t2, s3, g, true)), c3 = true;
              break;
            }
          }
          if (c3)
            break;
        }
      }
  }, delegateListener: f2, delegateUseCapture: g, delegatedEvents: l2, documents: c2, targets: p2, supportsOptions: false, supportsPassive: false };
  function v(t2, s3, n2, r3) {
    const o2 = a$5(r3);
    let i2 = find(p2, (e2) => e2.eventTarget === t2);
    i2 || (i2 = { eventTarget: t2, events: {} }, p2.push(i2)), i2.events[s3] || (i2.events[s3] = []), t2.addEventListener && !contains(i2.events[s3], n2) && (t2.addEventListener(s3, n2, u2.supportsOptions ? o2 : o2.capture), i2.events[s3].push(n2));
  }
  function d2(t2, s3, n2, r3) {
    const o2 = a$5(r3), i2 = findIndex(p2, (e2) => e2.eventTarget === t2), l3 = p2[i2];
    if (!l3 || !l3.events)
      return;
    if (s3 === "all") {
      for (s3 in l3.events)
        l3.events.hasOwnProperty(s3) && d2(t2, s3, "all");
      return;
    }
    let c3 = false;
    const v2 = l3.events[s3];
    if (v2) {
      if (n2 === "all") {
        for (let e2 = v2.length - 1; e2 >= 0; e2--)
          d2(t2, s3, v2[e2], o2);
        return;
      }
      for (let e2 = 0; e2 < v2.length; e2++)
        if (v2[e2] === n2) {
          t2.removeEventListener(s3, n2, u2.supportsOptions ? o2 : o2.capture), v2.splice(e2, 1), v2.length === 0 && (delete l3.events[s3], c3 = true);
          break;
        }
    }
    c3 && !Object.keys(l3.events).length && p2.splice(i2, 1);
  }
  function f2(e2, s3) {
    const r3 = a$5(s3), p3 = new i$b(e2), c3 = l2[e2.type], [u3] = getEventTargets(e2);
    let v2 = u3;
    for (; s$c.element(v2); ) {
      for (let e3 = 0; e3 < c3.length; e3++) {
        const s4 = c3[e3], { selector: n2, context: o2 } = s4;
        if (matchesSelector(v2, n2) && nodeContains(o2, u3) && nodeContains(o2, v2)) {
          const { listeners: e4 } = s4;
          p3.currentTarget = v2;
          for (const [t2, { capture: s5, passive: n3 }] of e4)
            s5 === r3.capture && n3 === r3.passive && t2(p3);
        }
      }
      v2 = parentNode(v2);
    }
  }
  function g(e2) {
    return f2(e2, true);
  }
  return (r2 = s2.document) == null || r2.createElement("div").addEventListener("test", null, { get capture() {
    return u2.supportsOptions = true;
  }, get passive() {
    return u2.supportsPassive = true;
  } }), s2.events = u2, u2;
} };
class PointerInfo {
  constructor(i2, t2, o2, s2, e2) {
    this.id = void 0, this.pointer = void 0, this.event = void 0, this.downTime = void 0, this.downTarget = void 0, this.id = i2, this.pointer = t2, this.event = o2, this.downTime = s2, this.downTarget = e2;
  }
}
let _ProxyValues;
((t2) => {
  t2.interactable = "", t2.element = "", t2.prepared = "", t2.pointerIsDown = "", t2.pointerWasMoved = "", t2._proxy = "";
})(_ProxyValues || (_ProxyValues = {}));
let _ProxyMethods;
((t2) => {
  t2.start = "", t2.move = "", t2.end = "", t2.stop = "", t2.interacting = "";
})(_ProxyMethods || (_ProxyMethods = {}));
let a$4 = 0;
class Interaction {
  get pointerMoveTolerance() {
    return 1;
  }
  constructor({ pointerType: t2, scopeFire: e2 }) {
    this.interactable = null, this.element = null, this.rect = void 0, this._rects = void 0, this.edges = void 0, this._scopeFire = void 0, this.prepared = { name: null, axis: null, edges: null }, this.pointerType = void 0, this.pointers = [], this.downEvent = null, this.downPointer = {}, this._latestPointer = { pointer: null, event: null, eventTarget: null }, this.prevEvent = null, this.pointerIsDown = false, this.pointerWasMoved = false, this._interacting = false, this._ending = false, this._stopped = true, this._proxy = null, this.simulation = null, this.doMove = warnOnce(function(t3) {
      this.move(t3);
    }, "The interaction.doMove() method has been renamed to interaction.move()"), this.coords = { start: newCoords(), prev: newCoords(), cur: newCoords(), delta: newCoords(), velocity: newCoords() }, this._id = a$4++, this._scopeFire = e2, this.pointerType = t2;
    const i2 = this;
    this._proxy = {};
    for (const t3 in _ProxyValues)
      Object.defineProperty(this._proxy, t3, { get() {
        return i2[t3];
      } });
    for (const t3 in _ProxyMethods)
      Object.defineProperty(this._proxy, t3, { value: (...e3) => i2[t3](...e3) });
    this._scopeFire("interactions:new", { interaction: this });
  }
  pointerDown(t2, e2, i2) {
    const o2 = this.updatePointer(t2, e2, i2, true), n2 = this.pointers[o2];
    this._scopeFire("interactions:down", { pointer: t2, event: e2, eventTarget: i2, pointerIndex: o2, pointerInfo: n2, type: "down", interaction: this });
  }
  start(t2, i2, o2) {
    return !(this.interacting() || !this.pointerIsDown || this.pointers.length < (t2.name === "gesture" ? 2 : 1) || !i2.options[t2.name].enabled) && (copyAction(this.prepared, t2), this.interactable = i2, this.element = o2, this.rect = i2.getRect(o2), this.edges = this.prepared.edges ? n$5({}, this.prepared.edges) : { left: true, right: true, top: true, bottom: true }, this._stopped = false, this._interacting = this._doPhase({ interaction: this, event: this.downEvent, phase: "start" }) && !this._stopped, this._interacting);
  }
  pointerMove(t2, e2, o2) {
    this.simulation || this.modification && this.modification.endResult || this.updatePointer(t2, e2, o2, false);
    const n2 = this.coords.cur.page.x === this.coords.prev.page.x && this.coords.cur.page.y === this.coords.prev.page.y && this.coords.cur.client.x === this.coords.prev.client.x && this.coords.cur.client.y === this.coords.prev.client.y;
    let r2, h;
    this.pointerIsDown && !this.pointerWasMoved && (r2 = this.coords.cur.client.x - this.coords.start.client.x, h = this.coords.cur.client.y - this.coords.start.client.y, this.pointerWasMoved = n$3(r2, h) > this.pointerMoveTolerance);
    const p2 = this.getPointerIndex(t2), a2 = { pointer: t2, pointerIndex: p2, pointerInfo: this.pointers[p2], event: e2, type: "move", eventTarget: o2, dx: r2, dy: h, duplicate: n2, interaction: this };
    n2 || setCoordVelocity(this.coords.velocity, this.coords.delta), this._scopeFire("interactions:move", a2), n2 || this.simulation || (this.interacting() && (a2.type = null, this.move(a2)), this.pointerWasMoved && copyCoords(this.coords.prev, this.coords.cur));
  }
  move(t2) {
    t2 && t2.event || setZeroCoords(this.coords.delta), (t2 = n$5({ pointer: this._latestPointer.pointer, event: this._latestPointer.event, eventTarget: this._latestPointer.eventTarget, interaction: this }, t2 || {})).phase = "move", this._doPhase(t2);
  }
  pointerUp(t2, e2, i2, o2) {
    let n2 = this.getPointerIndex(t2);
    n2 === -1 && (n2 = this.updatePointer(t2, e2, i2, false));
    const s2 = /cancel$/i.test(e2.type) ? "cancel" : "up";
    this._scopeFire("interactions:" + s2, { pointer: t2, pointerIndex: n2, pointerInfo: this.pointers[n2], event: e2, eventTarget: i2, type: s2, curEventTarget: o2, interaction: this }), this.simulation || this.end(e2), this.removePointer(t2, e2);
  }
  documentBlur(t2) {
    this.end(t2), this._scopeFire("interactions:blur", { event: t2, type: "blur", interaction: this });
  }
  end(t2) {
    let e2;
    this._ending = true, t2 = t2 || this._latestPointer.event, this.interacting() && (e2 = this._doPhase({ event: t2, interaction: this, phase: "end" })), this._ending = false, e2 === true && this.stop();
  }
  currentAction() {
    return this._interacting ? this.prepared.name : null;
  }
  interacting() {
    return this._interacting;
  }
  stop() {
    this._scopeFire("interactions:stop", { interaction: this }), this.interactable = this.element = null, this._interacting = false, this._stopped = true, this.prepared.name = this.prevEvent = null;
  }
  getPointerIndex(e2) {
    const i2 = getPointerId(e2);
    return this.pointerType === "mouse" || this.pointerType === "pen" ? this.pointers.length - 1 : findIndex(this.pointers, (t2) => t2.id === i2);
  }
  getPointerInfo(t2) {
    return this.pointers[this.getPointerIndex(t2)];
  }
  updatePointer(t2, e2, i2, o2) {
    const n2 = getPointerId(t2);
    let r2 = this.getPointerIndex(t2), h = this.pointers[r2];
    return o2 = o2 !== false && (o2 || /(down|start)$/i.test(e2.type)), h ? h.pointer = t2 : (h = new PointerInfo(n2, t2, e2, null, null), r2 = this.pointers.length, this.pointers.push(h)), setCoords(this.coords.cur, this.pointers.map((t3) => t3.pointer), this._now()), setCoordDeltas(this.coords.delta, this.coords.prev, this.coords.cur), o2 && (this.pointerIsDown = true, h.downTime = this.coords.cur.timeStamp, h.downTarget = i2, e$6(this.downPointer, t2), this.interacting() || (copyCoords(this.coords.start, this.coords.cur), copyCoords(this.coords.prev, this.coords.cur), this.downEvent = e2, this.pointerWasMoved = false)), this._updateLatestPointer(t2, e2, i2), this._scopeFire("interactions:update-pointer", { pointer: t2, event: e2, eventTarget: i2, down: o2, pointerInfo: h, pointerIndex: r2, interaction: this }), r2;
  }
  removePointer(t2, e2) {
    const i2 = this.getPointerIndex(t2);
    if (i2 === -1)
      return;
    const o2 = this.pointers[i2];
    this._scopeFire("interactions:remove-pointer", { pointer: t2, event: e2, eventTarget: null, pointerIndex: i2, pointerInfo: o2, interaction: this }), this.pointers.splice(i2, 1), this.pointerIsDown = false;
  }
  _updateLatestPointer(t2, e2, i2) {
    this._latestPointer.pointer = t2, this._latestPointer.event = e2, this._latestPointer.eventTarget = i2;
  }
  destroy() {
    this._latestPointer.pointer = null, this._latestPointer.event = null, this._latestPointer.eventTarget = null;
  }
  _createPreparedEvent(t2, e2, i2, o2) {
    return new InteractEvent(this, t2, this.prepared.name, e2, this.element, i2, o2);
  }
  _fireEvent(t2) {
    this.interactable.fire(t2), (!this.prevEvent || t2.timeStamp >= this.prevEvent.timeStamp) && (this.prevEvent = t2);
  }
  _doPhase(t2) {
    const { event: e2, phase: i2, preEnd: o2, type: n2 } = t2, { rect: s2 } = this;
    if (s2 && i2 === "move" && (addEdges(this.edges, s2, this.coords.delta[this.interactable.options.deltaSource]), s2.width = s2.right - s2.left, s2.height = s2.bottom - s2.top), this._scopeFire("interactions:before-action-" + i2, t2) === false)
      return false;
    const h = t2.iEvent = this._createPreparedEvent(e2, i2, o2, n2);
    return this._scopeFire("interactions:action-" + i2, t2), i2 === "start" && (this.prevEvent = h), this._fireEvent(h), this._scopeFire("interactions:after-action-" + i2, t2), true;
  }
  _now() {
    return Date.now();
  }
}
var r$8 = Interaction;
function o$d(t2) {
  return /^(always|never|auto)$/.test(t2) ? (this.options.preventDefault = t2, this) : s$c.bool(t2) ? (this.options.preventDefault = t2 ? "always" : "never", this) : this.options.preventDefault;
}
function i$9({ interaction: t2, event: e2 }) {
  t2.interactable && t2.interactable.checkAndPreventDefault(e2);
}
function install$1(i2) {
  const { Interactable: s2 } = i2;
  s2.prototype.preventDefault = o$d, s2.prototype.checkAndPreventDefault = function(e2) {
    return ((e3, o2, i3) => {
      const s3 = e3.options.preventDefault;
      if (s3 !== "never")
        if (s3 !== "always") {
          if (o2.events.supportsPassive && /^touch(start|move)$/.test(i3.type)) {
            const t2 = getWindow(i3.target).document, e4 = o2.getDocOptions(t2);
            if (!e4 || !e4.events || e4.events.passive !== false)
              return;
          }
          /^(mouse|pointer|touch)*(down|start)/i.test(i3.type) || s$c.element(i3.target) && matchesSelector(i3.target, "input,select,textarea,[contenteditable=true],[contenteditable=true] *") || i3.preventDefault();
        } else
          i3.preventDefault();
    })(this, i2, e2);
  }, i2.interactions.docEvents.push({ type: "dragstart", listener(t2) {
    for (const n2 of i2.interactions.list)
      if (n2.element && (n2.element === t2.target || nodeContains(n2.element, t2.target)))
        return void n2.interactable.checkAndPreventDefault(t2);
  } });
}
var i$a = { id: "core/interactablePreventDefault", install: install$1, listeners: ["down", "move", "up", "cancel"].reduce((t2, e2) => (t2["interactions:" + e2] = i$9, t2), {}) };
const t$4 = { methodOrder: ["simulationResume", "mouseOrPen", "hasPointer", "idle"], search(e2) {
  for (const n2 of t$4.methodOrder) {
    const i2 = t$4[n2](e2);
    if (i2)
      return i2;
  }
  return null;
}, simulationResume({ pointerType: t2, eventType: n2, eventTarget: i2, scope: r2 }) {
  if (!/down|start/i.test(n2))
    return null;
  for (const n3 of r2.interactions.list) {
    let r3 = i2;
    if (n3.simulation && n3.simulation.allowResume && n3.pointerType === t2)
      for (; r3; ) {
        if (r3 === n3.element)
          return n3;
        r3 = parentNode(r3);
      }
  }
  return null;
}, mouseOrPen({ pointerId: e2, pointerType: t2, eventType: i2, scope: r2 }) {
  if (t2 !== "mouse" && t2 !== "pen")
    return null;
  let o2;
  for (const i3 of r2.interactions.list)
    if (i3.pointerType === t2) {
      if (i3.simulation && !n$2(i3, e2))
        continue;
      if (i3.interacting())
        return i3;
      o2 || (o2 = i3);
    }
  if (o2)
    return o2;
  for (const e3 of r2.interactions.list)
    if (!(e3.pointerType !== t2 || /down/i.test(i2) && e3.simulation))
      return e3;
  return null;
}, hasPointer({ pointerId: e2, scope: t2 }) {
  for (const i2 of t2.interactions.list)
    if (n$2(i2, e2))
      return i2;
  return null;
}, idle({ pointerType: e2, scope: t2 }) {
  for (const n2 of t2.interactions.list) {
    if (n2.pointers.length === 1) {
      const e3 = n2.interactable;
      if (e3 && (!e3.options.gesture || !e3.options.gesture.enabled))
        continue;
    } else if (n2.pointers.length >= 2)
      continue;
    if (!n2.interacting() && e2 === n2.pointerType)
      return n2;
  }
  return null;
} };
function n$2(e2, t2) {
  return e2.pointers.some(({ id: e3 }) => e3 === t2);
}
var s$a = t$4;
const p$5 = ["pointerDown", "pointerMove", "pointerUp", "updatePointer", "removePointer", "windowBlur"];
function c$1(t2, n2) {
  return (r2) => {
    const i2 = n2.interactions.list, s2 = getPointerType(r2), [p2, c2] = getEventTargets(r2), l2 = [];
    if (/^touch/.test(r2.type)) {
      n2.prevTouchTime = n2.now();
      for (const e2 of r2.changedTouches) {
        const t3 = e2, i3 = { pointer: t3, pointerId: getPointerId(t3), pointerType: s2, eventType: r2.type, eventTarget: p2, curEventTarget: c2, scope: n2 }, u2 = a$3(i3);
        l2.push([i3.pointer, i3.eventTarget, i3.curEventTarget, u2]);
      }
    } else {
      let t3 = false;
      if (!t$7.supportsPointerEvent && /mouse/.test(r2.type)) {
        for (let e2 = 0; e2 < i2.length && !t3; e2++)
          t3 = i2[e2].pointerType !== "mouse" && i2[e2].pointerIsDown;
        t3 = t3 || n2.now() - n2.prevTouchTime < 500 || r2.timeStamp === 0;
      }
      if (!t3) {
        const e2 = { pointer: r2, pointerId: getPointerId(r2), pointerType: s2, eventType: r2.type, curEventTarget: c2, eventTarget: p2, scope: n2 }, t4 = a$3(e2);
        l2.push([e2.pointer, e2.eventTarget, e2.curEventTarget, t4]);
      }
    }
    for (const [e2, n3, o2, i3] of l2)
      i3[t2](e2, r2, n3, o2);
  };
}
function a$3(e2) {
  const { pointerType: t2, scope: n2 } = e2, o2 = { interaction: s$a.search(e2), searchDetails: e2 };
  return n2.fire("interactions:find", o2), o2.interaction || n2.interactions.new({ pointerType: t2 });
}
function l$1({ doc: e2, scope: t2, options: n2 }, o2) {
  const { interactions: { docEvents: r2 }, events: i2 } = t2, s2 = i2[o2];
  t2.browser.isIOS && !n2.events && (n2.events = { passive: false });
  for (const t3 in i2.delegatedEvents)
    s2(e2, t3, i2.delegateListener), s2(e2, t3, i2.delegateUseCapture, true);
  const p2 = n2 && n2.events;
  for (const { type: t3, listener: n3 } of r2)
    s2(e2, t3, n3, p2);
}
const u$1 = { id: "core/interactions", install(o2) {
  const s2 = {};
  for (const e2 of p$5)
    s2[e2] = c$1(e2, o2);
  const a2 = t$7.pEventTypes;
  let l2;
  function u2() {
    for (const e2 of o2.interactions.list)
      if (e2.pointerIsDown && e2.pointerType === "touch" && !e2._interacting)
        for (const t2 of e2.pointers)
          o2.documents.some(({ doc: e3 }) => nodeContains(e3, t2.downTarget)) || e2.removePointer(t2.pointer, t2.event);
  }
  l2 = s$d.PointerEvent ? [{ type: a2.down, listener: u2 }, { type: a2.down, listener: s2.pointerDown }, { type: a2.move, listener: s2.pointerMove }, { type: a2.up, listener: s2.pointerUp }, { type: a2.cancel, listener: s2.pointerUp }] : [{ type: "mousedown", listener: s2.pointerDown }, { type: "mousemove", listener: s2.pointerMove }, { type: "mouseup", listener: s2.pointerUp }, { type: "touchstart", listener: u2 }, { type: "touchstart", listener: s2.pointerDown }, { type: "touchmove", listener: s2.pointerMove }, { type: "touchend", listener: s2.pointerUp }, { type: "touchcancel", listener: s2.pointerUp }], l2.push({ type: "blur", listener(e2) {
    for (const t2 of o2.interactions.list)
      t2.documentBlur(e2);
  } }), o2.prevTouchTime = 0, o2.Interaction = class extends r$8 {
    get pointerMoveTolerance() {
      return o2.interactions.pointerMoveTolerance;
    }
    set pointerMoveTolerance(e2) {
      o2.interactions.pointerMoveTolerance = e2;
    }
    _now() {
      return o2.now();
    }
  }, o2.interactions = { list: [], new(e2) {
    e2.scopeFire = (e3, t3) => o2.fire(e3, t3);
    const t2 = new o2.Interaction(e2);
    return o2.interactions.list.push(t2), t2;
  }, listeners: s2, docEvents: l2, pointerMoveTolerance: 1 }, o2.usePlugin(i$a);
}, listeners: { "scope:add-document": (e2) => l$1(e2, "add"), "scope:remove-document": (e2) => l$1(e2, "remove"), "interactable:unset"({ interactable: e2 }, t2) {
  for (let n2 = t2.interactions.list.length - 1; n2 >= 0; n2--) {
    const o2 = t2.interactions.list[n2];
    o2.interactable === e2 && (o2.stop(), t2.fire("interactions:destroy", { interaction: o2 }), o2.destroy(), t2.interactions.list.length > 2 && t2.interactions.list.splice(n2, 1));
  }
} }, onDocSignal: l$1, doOnInteractions: c$1, methodNames: p$5 };
var u$2 = u$1;
class Scope {
  constructor() {
    this.id = "__interact_scope_" + Math.floor(100 * Math.random()), this.isInitialized = false, this.listenerMaps = [], this.browser = t$7, this.defaults = t$6(defaults), this.Eventable = Eventable, this.actions = { map: {}, phases: { start: true, move: true, end: true }, methodDict: {}, phaselessTypes: {} }, this.interactStatic = createInteractStatic(this), this.InteractEvent = InteractEvent, this.Interactable = void 0, this.interactables = new InteractableSet(this), this._win = void 0, this.document = void 0, this.window = void 0, this.documents = [], this._plugins = { list: [], map: {} }, this.onWindowUnload = (t2) => this.removeDocument(t2.target);
    const s2 = this;
    this.Interactable = class extends Interactable {
      get _defaults() {
        return s2.defaults;
      }
      set(t2) {
        return super.set(t2), s2.fire("interactable:set", { options: t2, interactable: this }), this;
      }
      unset() {
        super.unset(), s2.interactables.list.splice(s2.interactables.list.indexOf(this), 1), s2.fire("interactable:unset", { interactable: this });
      }
    };
  }
  addListeners(t2, i2) {
    this.listenerMaps.push({ id: i2, map: t2 });
  }
  fire(t2, i2) {
    for (const { map: { [t2]: s2 } } of this.listenerMaps)
      if (s2 && s2(i2, this, t2) === false)
        return false;
  }
  init(t2) {
    return this.isInitialized ? this : initScope(this, t2);
  }
  pluginIsInstalled(t2) {
    return this._plugins.map[t2.id] || this._plugins.list.indexOf(t2) !== -1;
  }
  usePlugin(t2, i2) {
    if (!this.isInitialized)
      return this;
    if (this.pluginIsInstalled(t2))
      return this;
    if (t2.id && (this._plugins.map[t2.id] = t2), this._plugins.list.push(t2), t2.install && t2.install(this, i2), t2.listeners && t2.before) {
      let i3 = 0;
      const s2 = this.listenerMaps.length, e2 = t2.before.reduce((t3, i4) => (t3[i4] = true, t3[f$2(i4)] = true, t3), {});
      for (; i3 < s2; i3++) {
        const t3 = this.listenerMaps[i3].id;
        if (e2[t3] || e2[f$2(t3)])
          break;
      }
      this.listenerMaps.splice(i3, 0, { id: t2.id, map: t2.listeners });
    } else
      t2.listeners && this.listenerMaps.push({ id: t2.id, map: t2.listeners });
    return this;
  }
  addDocument(t2, i2) {
    if (this.getDocIndex(t2) !== -1)
      return false;
    const s2 = getWindow(t2);
    i2 = i2 ? n$5({}, i2) : {}, this.documents.push({ doc: t2, options: i2 }), this.events.documents.push(t2), t2 !== this.document && this.events.add(s2, "unload", this.onWindowUnload), this.fire("scope:add-document", { doc: t2, window: s2, scope: this, options: i2 });
  }
  removeDocument(t2) {
    const i2 = this.getDocIndex(t2), s2 = getWindow(t2), e2 = this.documents[i2].options;
    this.events.remove(s2, "unload", this.onWindowUnload), this.documents.splice(i2, 1), this.events.documents.splice(i2, 1), this.fire("scope:remove-document", { doc: t2, window: s2, scope: this, options: e2 });
  }
  getDocIndex(t2) {
    for (let i2 = 0; i2 < this.documents.length; i2++)
      if (this.documents[i2].doc === t2)
        return i2;
    return -1;
  }
  getDocOptions(t2) {
    const i2 = this.getDocIndex(t2);
    return i2 === -1 ? null : this.documents[i2].options;
  }
  now() {
    return (this.window.Date || Date).now();
  }
}
function initScope(i2, e2) {
  return i2.isInitialized = true, s$c.window(e2) && init(e2), s$d.init(e2), t$7.init(e2), o$f.init(e2), i2.window = e2, i2.document = e2.document, i2.usePlugin(u$2), i2.usePlugin(c$2), i2;
}
function f$2(t2) {
  return t2 && t2.replace(/\/.*$/, "");
}
const t$3 = new Scope(), e$4 = t$3.interactStatic;
var interact = e$4;
const i$8 = typeof globalThis != "undefined" ? globalThis : typeof window != "undefined" ? window : globalThis;
t$3.init(i$8);
function e$3(o2) {
  return s$c.bool(o2) ? (this.options.styleCursor = o2, this) : o2 === null ? (delete this.options.styleCursor, this) : this.options.styleCursor;
}
function r$7(o2) {
  return s$c.func(o2) ? (this.options.actionChecker = o2, this) : o2 === null ? (delete this.options.actionChecker, this) : this.options.actionChecker;
}
var o$c = { id: "auto-start/interactableMethods", install(t2) {
  const { Interactable: n2 } = t2;
  n2.prototype.getAction = function(o2, e2, r2, n3) {
    const i2 = ((t3, o3, e3, r3, n4) => {
      const i3 = t3.getRect(r3), s2 = { action: null, interactable: t3, interaction: e3, element: r3, rect: i3, buttons: o3.buttons || { 0: 1, 1: 4, 3: 8, 4: 16 }[o3.button] };
      return n4.fire("auto-start:check", s2), s2.action;
    })(this, e2, r2, n3, t2);
    return this.options.actionChecker ? this.options.actionChecker(o2, e2, i2, this, n3, r2) : i2;
  }, n2.prototype.ignoreFrom = warnOnce(function(t3) {
    return this._backCompatOption("ignoreFrom", t3);
  }, "Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue})."), n2.prototype.allowFrom = warnOnce(function(t3) {
    return this._backCompatOption("allowFrom", t3);
  }, "Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue})."), n2.prototype.actionChecker = r$7, n2.prototype.styleCursor = e$3;
} };
function a$2(t2, e2, n2, r2, o2) {
  return e2.testIgnoreAllow(e2.options[t2.name], n2, r2) && e2.options[t2.name].enabled && c(e2, n2, t2, o2) ? t2 : null;
}
function i$7(t2, e2, n2, r2, o2, i2, s2) {
  for (let l2 = 0, c2 = r2.length; l2 < c2; l2++) {
    const c3 = r2[l2], u2 = o2[l2], m2 = c3.getAction(e2, n2, t2, u2);
    if (!m2)
      continue;
    const p2 = a$2(m2, c3, u2, i2, s2);
    if (p2)
      return { action: p2, interactable: c3, element: u2 };
  }
  return { action: null, interactable: null, element: null };
}
function s$9(e2, r2, o2, a2, s2) {
  let l2 = [], c2 = [], u2 = a2;
  function m2(t2) {
    l2.push(t2), c2.push(u2);
  }
  for (; s$c.element(u2); ) {
    l2 = [], c2 = [], s2.interactables.forEachMatch(u2, m2);
    const n2 = i$7(e2, r2, o2, l2, c2, a2, s2);
    if (n2.action && !n2.interactable.options[n2.action.name].manualStart)
      return n2;
    u2 = parentNode(u2);
  }
  return { action: null, interactable: null, element: null };
}
function l(t2, { action: e2, interactable: n2, element: o2 }, a2) {
  e2 = e2 || { name: null }, t2.interactable = n2, t2.element = o2, copyAction(t2.prepared, e2), t2.rect = n2 && e2.name ? n2.getRect(o2) : null, p$4(t2, a2), a2.fire("autoStart:prepared", { interaction: t2 });
}
function c(t2, e2, n2, r2) {
  const o2 = t2.options, a2 = o2[n2.name].max, i2 = o2[n2.name].maxPerElement, s2 = r2.autoStart.maxInteractions;
  let l2 = 0, c2 = 0, u2 = 0;
  if (!(a2 && i2 && s2))
    return false;
  for (const o3 of r2.interactions.list) {
    const r3 = o3.prepared.name;
    if (o3.interacting()) {
      if (l2++, l2 >= s2)
        return false;
      if (o3.interactable === t2) {
        if (c2 += r3 === n2.name ? 1 : 0, c2 >= a2)
          return false;
        if (o3.element === e2 && (u2++, r3 === n2.name && u2 >= i2))
          return false;
      }
    }
  }
  return s2 > 0;
}
function u(t2, e2) {
  return s$c.number(t2) ? (e2.autoStart.maxInteractions = t2, this) : e2.autoStart.maxInteractions;
}
function m$2(t2, e2, n2) {
  const { cursorElement: r2 } = n2.autoStart;
  r2 && r2 !== t2 && (r2.style.cursor = ""), t2.ownerDocument.documentElement.style.cursor = e2, t2.style.cursor = e2, n2.autoStart.cursorElement = e2 ? t2 : null;
}
function p$4(t2, e2) {
  const { interactable: r2, element: o2, prepared: a2 } = t2;
  if (t2.pointerType !== "mouse" || !r2 || !r2.options.styleCursor)
    return void (e2.autoStart.cursorElement && m$2(e2.autoStart.cursorElement, "", e2));
  let i2 = "";
  if (a2.name) {
    const s2 = r2.options[a2.name].cursorChecker;
    i2 = s$c.func(s2) ? s2(a2, r2, o2, t2._interacting) : e2.actions.map[a2.name].getCursor(a2);
  }
  m$2(t2.element, i2 || "", e2);
}
const f$1 = { id: "auto-start/base", before: ["actions"], install(t2) {
  const { interactStatic: n2, defaults: r2 } = t2;
  t2.usePlugin(o$c), r2.base.actionChecker = null, r2.base.styleCursor = true, n$5(r2.perAction, { manualStart: false, max: 1 / 0, maxPerElement: 1, allowFrom: null, ignoreFrom: null, mouseButtons: 1 }), n2.maxInteractions = (e2) => u(e2, t2), t2.autoStart = { maxInteractions: 1 / 0, withinInteractionLimit: c, cursorElement: null };
}, listeners: { "interactions:down"({ interaction: t2, pointer: e2, event: n2, eventTarget: r2 }, o2) {
  t2.interacting() || l(t2, s$9(t2, e2, n2, r2, o2), o2);
}, "interactions:move"(t2, e2) {
  (({ interaction: t3, pointer: e3, event: n2, eventTarget: r2 }, o2) => {
    t3.pointerType !== "mouse" || t3.pointerIsDown || t3.interacting() || l(t3, s$9(t3, e3, n2, r2, o2), o2);
  })(t2, e2), ((t3, e3) => {
    const { interaction: n2 } = t3;
    if (!n2.pointerIsDown || n2.interacting() || !n2.pointerWasMoved || !n2.prepared.name)
      return;
    e3.fire("autoStart:before-start", t3);
    const { interactable: r2 } = n2, o2 = n2.prepared.name;
    o2 && r2 && (r2.options[o2].manualStart || !c(r2, n2.element, n2.prepared, e3) ? n2.stop() : (n2.start(n2.prepared, r2, n2.element), p$4(n2, e3)));
  })(t2, e2);
}, "interactions:stop"({ interaction: t2 }, e2) {
  const { interactable: n2 } = t2;
  n2 && n2.options.styleCursor && m$2(t2.element, "", e2);
} }, maxInteractions: u, withinInteractionLimit: c, validateAction: a$2 };
var o$b = f$1;
var r$6 = { id: "auto-start/dragAxis", listeners: { "autoStart:before-start"({ interaction: a2, eventTarget: n2, dx: o2, dy: i2 }, s2) {
  if (a2.prepared.name !== "drag")
    return;
  const d2 = Math.abs(o2), l2 = Math.abs(i2), c2 = a2.interactable.options.drag, p2 = c2.startAxis, f2 = d2 > l2 ? "x" : d2 < l2 ? "y" : "xy";
  if (a2.prepared.axis = c2.lockAxis === "start" ? f2[0] : c2.lockAxis, f2 !== "xy" && p2 !== "xy" && p2 !== f2) {
    a2.prepared.name = null;
    let o3 = n2;
    const i3 = (t2) => {
      if (t2 === a2.interactable)
        return;
      const r2 = a2.interactable.options.drag;
      if (!r2.manualStart && t2.testIgnoreAllow(r2, o3, n2)) {
        const r3 = t2.getAction(a2.downPointer, a2.downEvent, a2, o3);
        if (r3 && r3.name === "drag" && ((t3, r4) => {
          if (!r4)
            return false;
          const e2 = r4.options.drag.startAxis;
          return t3 === "xy" || e2 === "xy" || e2 === t3;
        })(f2, t2) && o$b.validateAction(r3, t2, o3, n2, s2))
          return t2;
      }
    };
    for (; s$c.element(o3); ) {
      const r2 = s2.interactables.forEachMatch(o3, i3);
      if (r2) {
        a2.prepared.name = "drag", a2.interactable = r2, a2.element = o3;
        break;
      }
      o3 = parentNode(o3);
    }
  }
} } };
function e$2(t2) {
  const e2 = t2.prepared && t2.prepared.name;
  if (!e2)
    return null;
  const r2 = t2.interactable.options;
  return r2[e2].hold || r2[e2].delay;
}
const r$5 = { id: "auto-start/hold", install(e2) {
  const { defaults: r2 } = e2;
  e2.usePlugin(o$b), r2.perAction.hold = 0, r2.perAction.delay = 0;
}, listeners: { "interactions:new"({ interaction: t2 }) {
  t2.autoStartHoldTimer = null;
}, "autoStart:prepared"({ interaction: t2 }) {
  const r2 = e$2(t2);
  r2 > 0 && (t2.autoStartHoldTimer = setTimeout(() => {
    t2.start(t2.prepared, t2.interactable, t2.element);
  }, r2));
}, "interactions:move"({ interaction: t2, duplicate: e2 }) {
  t2.autoStartHoldTimer && t2.pointerWasMoved && !e2 && (clearTimeout(t2.autoStartHoldTimer), t2.autoStartHoldTimer = null);
}, "autoStart:before-start"({ interaction: t2 }) {
  e$2(t2) > 0 && (t2.prepared.name = null);
} }, getHoldDuration: e$2 };
var s$8 = r$5;
var o$a = { id: "auto-start", install(i2) {
  i2.usePlugin(o$b), i2.usePlugin(s$8), i2.usePlugin(r$6);
} };
interact.use(o$a);
function o$8({ interaction: t2 }) {
  if (t2.prepared.name !== "drag")
    return;
  const o2 = t2.prepared.axis;
  o2 === "x" ? (t2.coords.cur.page.y = t2.coords.start.page.y, t2.coords.cur.client.y = t2.coords.start.client.y, t2.coords.velocity.client.y = 0, t2.coords.velocity.page.y = 0) : o2 === "y" && (t2.coords.cur.page.x = t2.coords.start.page.x, t2.coords.cur.client.x = t2.coords.start.client.x, t2.coords.velocity.client.x = 0, t2.coords.velocity.page.x = 0);
}
function e$1({ iEvent: t2, interaction: o2 }) {
  if (o2.prepared.name !== "drag")
    return;
  const e2 = o2.prepared.axis;
  if (e2 === "x" || e2 === "y") {
    const r2 = e2 === "x" ? "y" : "x";
    t2.page[r2] = o2.coords.start.page[r2], t2.client[r2] = o2.coords.start.client[r2], t2.delta[r2] = 0;
  }
}
const r$4 = { id: "actions/drag", install(t2) {
  const { actions: o2, Interactable: e2, defaults: s2 } = t2;
  e2.prototype.draggable = r$4.draggable, o2.map.drag = r$4, o2.methodDict.drag = "draggable", s2.actions.drag = r$4.defaults;
}, listeners: { "interactions:before-action-move": o$8, "interactions:action-resume": o$8, "interactions:action-move": e$1, "auto-start:check"(t2) {
  const { interaction: o2, interactable: e2, buttons: r2 } = t2, s2 = e2.options.drag;
  if (s2 && s2.enabled && (!o2.pointerIsDown || !/mouse|pointer/.test(o2.pointerType) || (r2 & e2.options.drag.mouseButtons) != 0))
    return t2.action = { name: "drag", axis: s2.lockAxis === "start" ? s2.startAxis : s2.lockAxis }, false;
} }, draggable(o2) {
  return s$c.object(o2) ? (this.options.drag.enabled = o2.enabled !== false, this.setPerAction("drag", o2), this.setOnEvents("drag", o2), /^(xy|x|y|start)$/.test(o2.lockAxis) && (this.options.drag.lockAxis = o2.lockAxis), /^(xy|x|y)$/.test(o2.startAxis) && (this.options.drag.startAxis = o2.startAxis), this) : s$c.bool(o2) ? (this.options.drag.enabled = o2, this) : this.options.drag;
}, beforeMove: o$8, move: e$1, defaults: { startAxis: "xy", lockAxis: "xy" }, getCursor() {
  return "move";
} };
var o$9 = r$4;
interact.use(o$9);
function i$6(t2, i2, s2, o2, n2, a2, l2) {
  if (!i2)
    return false;
  if (i2 === true) {
    const e2 = s$c.number(a2.width) ? a2.width : a2.right - a2.left, i3 = s$c.number(a2.height) ? a2.height : a2.bottom - a2.top;
    if (l2 = Math.min(l2, Math.abs((t2 === "left" || t2 === "right" ? e2 : i3) / 2)), e2 < 0 && (t2 === "left" ? t2 = "right" : t2 === "right" && (t2 = "left")), i3 < 0 && (t2 === "top" ? t2 = "bottom" : t2 === "bottom" && (t2 = "top")), t2 === "left")
      return s2.x < (e2 >= 0 ? a2.left : a2.right) + l2;
    if (t2 === "top")
      return s2.y < (i3 >= 0 ? a2.top : a2.bottom) + l2;
    if (t2 === "right")
      return s2.x > (e2 >= 0 ? a2.right : a2.left) - l2;
    if (t2 === "bottom")
      return s2.y > (i3 >= 0 ? a2.bottom : a2.top) - l2;
  }
  return !!s$c.element(o2) && (s$c.element(i2) ? i2 === o2 : matchesUpTo(o2, i2, n2));
}
function s$7({ iEvent: e2, interaction: t2 }) {
  if (t2.prepared.name !== "resize" || !t2.resizeAxes)
    return;
  const r2 = e2;
  t2.interactable.options.resize.square ? (t2.resizeAxes === "y" ? r2.delta.x = r2.delta.y : r2.delta.y = r2.delta.x, r2.axes = "xy") : (r2.axes = t2.resizeAxes, t2.resizeAxes === "x" ? r2.delta.y = 0 : t2.resizeAxes === "y" && (r2.delta.x = 0));
}
const o$6 = { id: "actions/resize", before: ["actions/drag"], install(e2) {
  const { actions: t2, browser: i2, Interactable: s2, defaults: n2 } = e2;
  o$6.cursors = ((e3) => e3.isIe9 ? { x: "e-resize", y: "s-resize", xy: "se-resize", top: "n-resize", left: "w-resize", bottom: "s-resize", right: "e-resize", topleft: "se-resize", bottomright: "se-resize", topright: "ne-resize", bottomleft: "ne-resize" } : { x: "ew-resize", y: "ns-resize", xy: "nwse-resize", top: "ns-resize", left: "ew-resize", bottom: "ns-resize", right: "ew-resize", topleft: "nwse-resize", bottomright: "nwse-resize", topright: "nesw-resize", bottomleft: "nesw-resize" })(i2), o$6.defaultMargin = i2.supportsTouch || i2.supportsPointerEvent ? 20 : 10, s2.prototype.resizable = function(t3) {
    return ((e3, t4, i3) => s$c.object(t4) ? (e3.options.resize.enabled = t4.enabled !== false, e3.setPerAction("resize", t4), e3.setOnEvents("resize", t4), s$c.string(t4.axis) && /^x$|^y$|^xy$/.test(t4.axis) ? e3.options.resize.axis = t4.axis : t4.axis === null && (e3.options.resize.axis = i3.defaults.actions.resize.axis), s$c.bool(t4.preserveAspectRatio) ? e3.options.resize.preserveAspectRatio = t4.preserveAspectRatio : s$c.bool(t4.square) && (e3.options.resize.square = t4.square), e3) : s$c.bool(t4) ? (e3.options.resize.enabled = t4, e3) : e3.options.resize)(this, t3, e2);
  }, t2.map.resize = o$6, t2.methodDict.resize = "resizable", n2.actions.resize = o$6.defaults;
}, listeners: { "interactions:new"({ interaction: e2 }) {
  e2.resizeAxes = "xy";
}, "interactions:action-start"(e2) {
  (({ iEvent: e3, interaction: r2 }) => {
    if (r2.prepared.name !== "resize" || !r2.prepared.edges)
      return;
    const i2 = e3, s2 = r2.rect;
    r2._rects = { start: n$5({}, s2), corrected: n$5({}, s2), previous: n$5({}, s2), delta: { left: 0, right: 0, width: 0, top: 0, bottom: 0, height: 0 } }, i2.edges = r2.prepared.edges, i2.rect = r2._rects.corrected, i2.deltaRect = r2._rects.delta;
  })(e2), s$7(e2);
}, "interactions:action-move"(e2) {
  (({ iEvent: e3, interaction: r2 }) => {
    if (r2.prepared.name !== "resize" || !r2.prepared.edges)
      return;
    const i2 = e3, s2 = r2.interactable.options.resize.invert, o2 = s2 === "reposition" || s2 === "negate", n2 = r2.rect, { start: a2, corrected: l2, delta: p2, previous: c2 } = r2._rects;
    if (n$5(c2, l2), o2) {
      if (n$5(l2, n2), s2 === "reposition") {
        if (l2.top > l2.bottom) {
          const e4 = l2.top;
          l2.top = l2.bottom, l2.bottom = e4;
        }
        if (l2.left > l2.right) {
          const e4 = l2.left;
          l2.left = l2.right, l2.right = e4;
        }
      }
    } else
      l2.top = Math.min(n2.top, a2.bottom), l2.bottom = Math.max(n2.bottom, a2.top), l2.left = Math.min(n2.left, a2.right), l2.right = Math.max(n2.right, a2.left);
    l2.width = l2.right - l2.left, l2.height = l2.bottom - l2.top;
    for (const e4 in l2)
      p2[e4] = l2[e4] - c2[e4];
    i2.edges = r2.prepared.edges, i2.rect = l2, i2.deltaRect = p2;
  })(e2), s$7(e2);
}, "interactions:action-end"({ iEvent: e2, interaction: t2 }) {
  if (t2.prepared.name !== "resize" || !t2.prepared.edges)
    return;
  const r2 = e2;
  r2.edges = t2.prepared.edges, r2.rect = t2._rects.corrected, r2.deltaRect = t2._rects.delta;
}, "auto-start:check"(e2) {
  const { interaction: s2, interactable: n2, element: a2, rect: l2, buttons: p2 } = e2;
  if (!l2)
    return;
  const c2 = n$5({}, s2.coords.cur.page), d2 = n2.options.resize;
  if (d2 && d2.enabled && (!s2.pointerIsDown || !/mouse|pointer/.test(s2.pointerType) || (p2 & d2.mouseButtons) != 0)) {
    if (s$c.object(d2.edges)) {
      const t2 = { left: false, right: false, top: false, bottom: false };
      for (const e3 in t2)
        t2[e3] = i$6(e3, d2.edges[e3], c2, s2._latestPointer.eventTarget, a2, l2, d2.margin || o$6.defaultMargin);
      t2.left = t2.left && !t2.right, t2.top = t2.top && !t2.bottom, (t2.left || t2.right || t2.top || t2.bottom) && (e2.action = { name: "resize", edges: t2 });
    } else {
      const t2 = d2.axis !== "y" && c2.x > l2.right - o$6.defaultMargin, r2 = d2.axis !== "x" && c2.y > l2.bottom - o$6.defaultMargin;
      (t2 || r2) && (e2.action = { name: "resize", axes: (t2 ? "x" : "") + (r2 ? "y" : "") });
    }
    return !e2.action && void 0;
  }
} }, defaults: { square: false, preserveAspectRatio: false, axis: "xy", margin: NaN, edges: null, invert: "none" }, cursors: null, getCursor({ edges: e2, axis: t2, name: r2 }) {
  const i2 = o$6.cursors;
  let s2 = null;
  if (t2)
    s2 = i2[r2 + t2];
  else if (e2) {
    let t3 = "";
    for (const r3 of ["top", "bottom", "left", "right"])
      e2[r3] && (t3 += r3);
    s2 = i2[t3];
  }
  return s2;
}, defaultMargin: null };
var o$7 = o$6;
interact.use(o$7);
var edgeTarget_prod = () => {
};
var elements_prod = () => {
};
var grid_prod = (t2) => {
  const o2 = [["x", "y"], ["left", "top"], ["right", "bottom"], ["width", "height"]].filter(([o3, r3]) => o3 in t2 || r3 in t2), r2 = (r3, n2) => {
    const { range: i2, limits: e2 = { left: -1 / 0, right: 1 / 0, top: -1 / 0, bottom: 1 / 0 }, offset: h = { x: 0, y: 0 } } = t2, a2 = { range: i2, grid: t2, x: null, y: null };
    for (const [i3, l2] of o2) {
      const o3 = Math.round((r3 - h.x) / t2[i3]), f2 = Math.round((n2 - h.y) / t2[l2]);
      a2[i3] = Math.max(e2.left, Math.min(e2.right, o3 * t2[i3] + h.x)), a2[l2] = Math.max(e2.top, Math.min(e2.bottom, f2 * t2[l2] + h.y));
    }
    return a2;
  };
  return r2.grid = t2, r2.coordFields = o2, r2;
};
var s$6 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  edgeTarget: edgeTarget_prod,
  elements: elements_prod,
  grid: grid_prod
});
const p$3 = { id: "snappers", install(p2) {
  const { interactStatic: t2 } = p2;
  t2.snappers = n$5(t2.snappers || {}, s$6), t2.createSnapGrid = t2.snappers.grid;
} };
var o$5 = p$3;
class o$4 {
  constructor(t2) {
    this.states = [], this.startOffset = { left: 0, right: 0, top: 0, bottom: 0 }, this.startDelta = void 0, this.result = void 0, this.endResult = void 0, this.edges = void 0, this.interaction = void 0, this.interaction = t2, this.result = r$3();
  }
  start({ phase: t2 }, s2) {
    const { interaction: o2 } = this, i2 = ((t3) => {
      const e2 = t3.interactable.options[t3.prepared.name], s3 = e2.modifiers;
      return s3 && s3.length ? s3 : ["snap", "snapSize", "snapEdges", "restrict", "restrictEdges", "restrictSize"].map((t4) => {
        const s4 = e2[t4];
        return s4 && s4.enabled && { options: s4, methods: s4._methods };
      }).filter((t4) => !!t4);
    })(o2);
    this.prepareStates(i2), this.edges = n$5({}, o2.edges), this.startOffset = getRectOffset(o2.rect, s2), this.startDelta = { x: 0, y: 0 };
    const n2 = this.fillArg({ phase: t2, pageCoords: s2, preEnd: false });
    return this.result = r$3(), this.startAll(n2), this.result = this.setAll(n2);
  }
  fillArg(t2) {
    const { interaction: e2 } = this;
    return t2.interaction = e2, t2.interactable = e2.interactable, t2.element = e2.element, t2.rect = t2.rect || e2.rect, t2.edges = this.edges, t2.startOffset = this.startOffset, t2;
  }
  startAll(t2) {
    for (const e2 of this.states)
      e2.methods.start && (t2.state = e2, e2.methods.start(t2));
  }
  setAll(t2) {
    const { phase: o2, preEnd: i2, skipModifiers: n2, rect: a2 } = t2;
    t2.coords = n$5({}, t2.pageCoords), t2.rect = n$5({}, a2);
    const l2 = n2 ? this.states.slice(n2) : this.states, c2 = r$3(t2.coords, t2.rect);
    for (const r2 of l2) {
      var d2;
      const { options: n3 } = r2, a3 = n$5({}, t2.coords);
      let l3 = null;
      (d2 = r2.methods) != null && d2.set && this.shouldDo(n3, i2, o2) && (t2.state = r2, l3 = r2.methods.set(t2), addEdges(this.interaction.edges, t2.rect, { x: t2.coords.x - a3.x, y: t2.coords.y - a3.y })), c2.eventProps.push(l3);
    }
    c2.delta.x = t2.coords.x - t2.pageCoords.x, c2.delta.y = t2.coords.y - t2.pageCoords.y, c2.rectDelta.left = t2.rect.left - a2.left, c2.rectDelta.right = t2.rect.right - a2.right, c2.rectDelta.top = t2.rect.top - a2.top, c2.rectDelta.bottom = t2.rect.bottom - a2.bottom;
    const h = this.result.coords, p2 = this.result.rect;
    if (h && p2) {
      const t3 = c2.rect.left !== p2.left || c2.rect.right !== p2.right || c2.rect.top !== p2.top || c2.rect.bottom !== p2.bottom;
      c2.changed = t3 || h.x !== c2.coords.x || h.y !== c2.coords.y;
    }
    return c2;
  }
  applyToInteraction(t2) {
    const { interaction: s2 } = this, { phase: o2 } = t2, r2 = s2.coords.cur, i2 = s2.coords.start, { result: n2, startDelta: a2 } = this, l2 = n2.delta;
    o2 === "start" && n$5(this.startDelta, n2.delta);
    for (const [t3, e2] of [[i2, a2], [r2, l2]])
      t3.page.x += e2.x, t3.page.y += e2.y, t3.client.x += e2.x, t3.client.y += e2.y;
    const { rectDelta: c2 } = this.result, d2 = t2.rect || s2.rect;
    d2.left += c2.left, d2.right += c2.right, d2.top += c2.top, d2.bottom += c2.bottom, d2.width = d2.right - d2.left, d2.height = d2.bottom - d2.top;
  }
  setAndApply(t2) {
    const { interaction: e2 } = this, { phase: s2, preEnd: o2, skipModifiers: r2 } = t2, i2 = this.setAll(this.fillArg({ preEnd: o2, phase: s2, pageCoords: t2.modifiedCoords || e2.coords.cur.page }));
    if (this.result = i2, !i2.changed && (!r2 || r2 < this.states.length) && e2.interacting())
      return false;
    if (t2.modifiedCoords) {
      const { page: s3 } = e2.coords.cur, o3 = { x: t2.modifiedCoords.x - s3.x, y: t2.modifiedCoords.y - s3.y };
      i2.coords.x += o3.x, i2.coords.y += o3.y, i2.delta.x += o3.x, i2.delta.y += o3.y;
    }
    this.applyToInteraction(t2);
  }
  beforeEnd(t2) {
    const { interaction: e2, event: s2 } = t2, o2 = this.states;
    if (!o2 || !o2.length)
      return;
    let r2 = false;
    for (const e3 of o2) {
      t2.state = e3;
      const { options: s3, methods: o3 } = e3, i2 = o3.beforeEnd && o3.beforeEnd(t2);
      if (i2)
        return this.endResult = i2, false;
      r2 = r2 || !r2 && this.shouldDo(s3, true, t2.phase, true);
    }
    r2 && e2.move({ event: s2, preEnd: true });
  }
  stop(t2) {
    const { interaction: s2 } = t2;
    if (!this.states || !this.states.length)
      return;
    const o2 = n$5({ states: this.states, interactable: s2.interactable, element: s2.element, rect: null }, t2);
    this.fillArg(o2);
    for (const t3 of this.states)
      o2.state = t3, t3.methods.stop && t3.methods.stop(o2);
    this.states = null, this.endResult = null;
  }
  prepareStates(t2) {
    this.states = [];
    for (let e2 = 0; e2 < t2.length; e2++) {
      const { options: s2, methods: o2, name: r2 } = t2[e2];
      this.states.push({ options: s2, methods: o2, index: e2, name: r2 });
    }
    return this.states;
  }
  restoreInteractionCoords({ interaction: { coords: t2, rect: e2, modification: s2 } }) {
    if (!s2.result)
      return;
    const { startDelta: o2 } = s2, { delta: r2, rectDelta: i2 } = s2.result, n2 = [[t2.start, o2], [t2.cur, r2]];
    for (const [t3, e3] of n2)
      t3.page.x -= e3.x, t3.page.y -= e3.y, t3.client.x -= e3.x, t3.client.y -= e3.y;
    e2.left -= i2.left, e2.right -= i2.right, e2.top -= i2.top, e2.bottom -= i2.bottom;
  }
  shouldDo(t2, e2, s2, o2) {
    return !(!t2 || t2.enabled === false || o2 && !t2.endOnly || t2.endOnly && !e2 || s2 === "start" && !t2.setStart);
  }
  copyFrom(s2) {
    this.startOffset = s2.startOffset, this.startDelta = s2.startDelta, this.edges = s2.edges, this.states = s2.states.map((e2) => t$6(e2)), this.result = r$3(n$5({}, s2.result.coords), n$5({}, s2.result.rect));
  }
  destroy() {
    for (const t2 in this)
      this[t2] = null;
  }
}
function r$3(t2, e2) {
  return { rect: e2, coords: t2, delta: { x: 0, y: 0 }, rectDelta: { left: 0, right: 0, top: 0, bottom: 0 }, eventProps: [], changed: true };
}
function getRectOffset(t2, e2) {
  return t2 ? { left: e2.x - t2.left, top: e2.y - t2.top, right: t2.right - e2.x, bottom: t2.bottom - e2.y } : { left: 0, top: 0, right: 0, bottom: 0 };
}
function makeModifier(t2, i2) {
  const { defaults: n2 } = t2, o2 = { start: t2.start, set: t2.set, beforeEnd: t2.beforeEnd, stop: t2.stop }, e2 = (t3) => {
    const e3 = t3 || {};
    e3.enabled = e3.enabled !== false;
    for (const t4 in n2)
      t4 in e3 || (e3[t4] = n2[t4]);
    const a2 = { options: e3, methods: o2, name: i2, enable: () => (e3.enabled = true, a2), disable: () => (e3.enabled = false, a2) };
    return a2;
  };
  return i2 && typeof i2 == "string" && (e2._defaults = n2, e2._methods = o2), e2;
}
function addEventModifiers({ iEvent: t2, interaction: i2 }) {
  const n2 = i2.modification.result;
  n2 && (t2.modifiers = n2.eventProps);
}
const i$5 = { id: "modifiers/base", before: ["actions"], install(t2) {
  t2.defaults.perAction.modifiers = [];
}, listeners: { "interactions:new"({ interaction: i2 }) {
  i2.modification = new o$4(i2);
}, "interactions:before-action-start"(t2) {
  const i2 = t2.interaction.modification;
  i2.start(t2, t2.interaction.coords.start.page), t2.interaction.edges = i2.edges, i2.applyToInteraction(t2);
}, "interactions:before-action-move": (t2) => t2.interaction.modification.setAndApply(t2), "interactions:before-action-end": (t2) => t2.interaction.modification.beforeEnd(t2), "interactions:action-start": addEventModifiers, "interactions:action-move": addEventModifiers, "interactions:action-end": addEventModifiers, "interactions:after-action-start": (t2) => t2.interaction.modification.restoreInteractionCoords(t2), "interactions:after-action-move": (t2) => t2.interaction.modification.restoreInteractionCoords(t2), "interactions:stop": (t2) => t2.interaction.modification.stop(t2) } };
var t$2 = i$5;
const s$5 = { start(e2) {
  const { state: r2, rect: s2, edges: i2, pageCoords: a2 } = e2;
  let { ratio: n2 } = r2.options;
  const { equalDelta: d2, modifiers: l2 } = r2.options;
  n2 === "preserve" && (n2 = s2.width / s2.height), r2.startCoords = n$5({}, a2), r2.startRect = n$5({}, s2), r2.ratio = n2, r2.equalDelta = d2;
  const c2 = r2.linkedEdges = { top: i2.top || i2.left && !i2.bottom, left: i2.left || i2.top && !i2.right, bottom: i2.bottom || i2.right && !i2.top, right: i2.right || i2.bottom && !i2.left };
  if (r2.xIsPrimaryAxis = !(!i2.left && !i2.right), r2.equalDelta)
    r2.edgeSign = (c2.left ? 1 : -1) * (c2.top ? 1 : -1);
  else {
    const t2 = r2.xIsPrimaryAxis ? c2.top : c2.left;
    r2.edgeSign = t2 ? -1 : 1;
  }
  if (n$5(e2.edges, c2), !l2 || !l2.length)
    return;
  const p2 = new o$4(e2.interaction);
  p2.copyFrom(e2.interaction.modification), p2.prepareStates(l2), r2.subModification = p2, p2.startAll(__spreadValues({}, e2));
}, set(o2) {
  const { state: r2, rect: s2, coords: n2 } = o2, d2 = n$5({}, n2), l2 = r2.equalDelta ? i$4 : a$1;
  if (l2(r2, r2.xIsPrimaryAxis, n2, s2), !r2.subModification)
    return null;
  const c2 = n$5({}, s2);
  addEdges(r2.linkedEdges, c2, { x: n2.x - d2.x, y: n2.y - d2.y });
  const p2 = r2.subModification.setAll(__spreadProps(__spreadValues({}, o2), { rect: c2, edges: r2.linkedEdges, pageCoords: n2, prevCoords: n2, prevRect: c2 })), { delta: f2 } = p2;
  return p2.changed && (l2(r2, Math.abs(f2.x) > Math.abs(f2.y), p2.coords, p2.rect), n$5(n2, p2.coords)), p2.eventProps;
}, defaults: { ratio: "preserve", equalDelta: false, modifiers: [], enabled: false } };
function i$4({ startCoords: t2, edgeSign: e2 }, o2, r2) {
  o2 ? r2.y = t2.y + (r2.x - t2.x) * e2 : r2.x = t2.x + (r2.y - t2.y) * e2;
}
function a$1({ startRect: t2, startCoords: e2, ratio: o2, edgeSign: r2 }, s2, i2, a2) {
  if (s2) {
    const s3 = a2.width / o2;
    i2.y = e2.y + (s3 - t2.height) * r2;
  } else {
    const s3 = a2.height * o2;
    i2.x = e2.x + (s3 - t2.width) * r2;
  }
}
var r$2 = makeModifier(s$5, "aspectRatio");
const t$1 = () => {
};
t$1._defaults = {};
var e = t$1;
function getRestrictionRect(t2, i2, r2) {
  return s$c.func(t2) ? resolveRectLike(t2, i2.interactable, i2.element, [r2.x, r2.y, i2]) : resolveRectLike(t2, i2.interactable, i2.element);
}
const r$1 = { start({ rect: e2, startOffset: o2, state: i2, interaction: r2, pageCoords: s2 }) {
  const { options: n2 } = i2, { elementRect: l2 } = n2, c2 = n$5({ left: 0, top: 0, right: 0, bottom: 0 }, n2.offset || {});
  if (e2 && l2) {
    const t2 = getRestrictionRect(n2.restriction, r2, s2);
    if (t2) {
      const o3 = t2.right - t2.left - e2.width, i3 = t2.bottom - t2.top - e2.height;
      o3 < 0 && (c2.left += o3, c2.right += o3), i3 < 0 && (c2.top += i3, c2.bottom += i3);
    }
    c2.left += o2.left - e2.width * l2.left, c2.top += o2.top - e2.height * l2.top, c2.right += o2.right - e2.width * (1 - l2.right), c2.bottom += o2.bottom - e2.height * (1 - l2.bottom);
  }
  i2.offset = c2;
}, set({ coords: t2, interaction: e2, state: i2 }) {
  const { options: r2, offset: s2 } = i2, n2 = getRestrictionRect(r2.restriction, e2, t2);
  if (!n2)
    return;
  const l2 = xywhToTlbr(n2);
  t2.x = Math.max(Math.min(l2.right - s2.right, t2.x), l2.left + s2.left), t2.y = Math.max(Math.min(l2.bottom - s2.bottom, t2.y), l2.top + s2.top);
}, defaults: { restriction: null, elementRect: null, offset: null, endOnly: false, enabled: false } };
var s$4 = makeModifier(r$1, "restrict");
const n$1 = { top: 1 / 0, left: 1 / 0, bottom: -1 / 0, right: -1 / 0 }, i$3 = { top: -1 / 0, left: -1 / 0, bottom: 1 / 0, right: 1 / 0 };
function s$3(t2, o2) {
  for (const e2 of ["top", "left", "bottom", "right"])
    e2 in t2 || (t2[e2] = o2[e2]);
  return t2;
}
const f = { noInner: n$1, noOuter: i$3, start({ interaction: t2, startOffset: e2, state: n2 }) {
  const { options: i2 } = n2;
  let s2;
  if (i2) {
    const e3 = getRestrictionRect(i2.offset, t2, t2.coords.start.page);
    s2 = rectToXY(e3);
  }
  s2 = s2 || { x: 0, y: 0 }, n2.offset = { top: s2.y + e2.top, left: s2.x + e2.left, bottom: s2.y - e2.bottom, right: s2.x - e2.right };
}, set({ coords: o2, edges: e2, interaction: f2, state: m2 }) {
  const { offset: a2, options: p2 } = m2;
  if (!e2)
    return;
  const l2 = n$5({}, o2), h = getRestrictionRect(p2.inner, f2, l2) || {}, c2 = getRestrictionRect(p2.outer, f2, l2) || {};
  s$3(h, n$1), s$3(c2, i$3), e2.top ? o2.y = Math.min(Math.max(c2.top + a2.top, l2.y), h.top + a2.top) : e2.bottom && (o2.y = Math.max(Math.min(c2.bottom + a2.bottom, l2.y), h.bottom + a2.bottom)), e2.left ? o2.x = Math.min(Math.max(c2.left + a2.left, l2.x), h.left + a2.left) : e2.right && (o2.x = Math.max(Math.min(c2.right + a2.right, l2.x), h.right + a2.right));
}, defaults: { inner: null, outer: null, offset: null, endOnly: false, enabled: false } };
var t = makeModifier(f, "restrictEdges");
const o$3 = n$5({ get elementRect() {
  return { top: 0, left: 0, bottom: 1, right: 1 };
}, set elementRect(t2) {
} }, r$1.defaults), s$2 = { start: r$1.start, set: r$1.set, defaults: o$3 };
var p$2 = makeModifier(s$2, "restrictRect");
const n = { width: -1 / 0, height: -1 / 0 }, s$1 = { width: 1 / 0, height: 1 / 0 }, p$1 = { start: (t2) => f.start(t2), set(e2) {
  const { interaction: p2, state: h, rect: d2, edges: l2 } = e2, { options: m2 } = h;
  if (!l2)
    return;
  const f$12 = tlbrToXywh(getRestrictionRect(m2.min, p2, e2.coords)) || n, g = tlbrToXywh(getRestrictionRect(m2.max, p2, e2.coords)) || s$1;
  h.options = { endOnly: m2.endOnly, inner: n$5({}, f.noInner), outer: n$5({}, f.noOuter) }, l2.top ? (h.options.inner.top = d2.bottom - f$12.height, h.options.outer.top = d2.bottom - g.height) : l2.bottom && (h.options.inner.bottom = d2.top + f$12.height, h.options.outer.bottom = d2.top + g.height), l2.left ? (h.options.inner.left = d2.right - f$12.width, h.options.outer.left = d2.right - g.width) : l2.right && (h.options.inner.right = d2.left + f$12.width, h.options.outer.right = d2.left + g.width), f.set(e2), h.options = m2;
}, defaults: { min: null, max: null, endOnly: false, enabled: false } };
var i$2 = makeModifier(p$1, "restrictSize");
const i$1 = { start(t2) {
  const { interaction: n2, interactable: r2, element: a2, rect: i2, state: l2, startOffset: g } = t2, { options: f2 } = l2, c2 = f2.offsetWithOrigin ? ((t3) => {
    const { element: n3 } = t3.interaction;
    return rectToXY(resolveRectLike(t3.state.options.origin, null, null, [n3])) || e$7(t3.interactable, n3, t3.interaction.prepared.name);
  })(t2) : { x: 0, y: 0 };
  let x;
  if (f2.offset === "startCoords")
    x = { x: n2.coords.start.page.x, y: n2.coords.start.page.y };
  else {
    const t3 = resolveRectLike(f2.offset, r2, a2, [n2]);
    x = rectToXY(t3) || { x: 0, y: 0 }, x.x += c2.x, x.y += c2.y;
  }
  const { relativePoints: d2 } = f2;
  l2.offsets = i2 && d2 && d2.length ? d2.map((t3, e2) => ({ index: e2, relativePoint: t3, x: g.left - i2.width * t3.x + x.x, y: g.top - i2.height * t3.y + x.y })) : [{ index: 0, relativePoint: null, x: x.x, y: x.y }];
}, set(o2) {
  const { interaction: s2, coords: a2, state: i2 } = o2, { options: l2, offsets: g } = i2, f2 = e$7(s2.interactable, s2.element, s2.prepared.name), c2 = n$5({}, a2), x = [];
  l2.offsetWithOrigin || (c2.x -= f2.x, c2.y -= f2.y);
  for (const t2 of g) {
    const e2 = c2.x - t2.x, n2 = c2.y - t2.y;
    for (let o3 = 0, a3 = l2.targets.length; o3 < a3; o3++) {
      const a4 = l2.targets[o3];
      let i3;
      i3 = s$c.func(a4) ? a4(e2, n2, s2._proxy, t2, o3) : a4, i3 && x.push({ x: (s$c.number(i3.x) ? i3.x : e2) + t2.x, y: (s$c.number(i3.y) ? i3.y : n2) + t2.y, range: s$c.number(i3.range) ? i3.range : l2.range, source: a4, index: o3, offset: t2 });
    }
  }
  const d2 = { target: null, inRange: false, distance: 0, range: 0, delta: { x: 0, y: 0 } };
  for (const t2 of x) {
    const e2 = t2.range, r2 = t2.x - c2.x, o3 = t2.y - c2.y, s3 = n$3(r2, o3);
    let a3 = s3 <= e2;
    e2 === 1 / 0 && d2.inRange && d2.range !== 1 / 0 && (a3 = false), d2.target && !(a3 ? d2.inRange && e2 !== 1 / 0 ? s3 / e2 < d2.distance / d2.range : e2 === 1 / 0 && d2.range !== 1 / 0 || s3 < d2.distance : !d2.inRange && s3 < d2.distance) || (d2.target = t2, d2.distance = s3, d2.range = e2, d2.inRange = a3, d2.delta.x = r2, d2.delta.y = o3);
  }
  return d2.inRange && (a2.x = d2.target.x, a2.y = d2.target.y), i2.closest = d2, d2;
}, defaults: { range: 1 / 0, targets: null, offset: null, offsetWithOrigin: true, origin: null, relativePoints: null, endOnly: false, enabled: false } };
var d = makeModifier(i$1, "snap");
const r = { start(t2) {
  const { state: s2, edges: e2 } = t2, { options: r2 } = s2;
  if (!e2)
    return null;
  t2.state = { options: { targets: null, relativePoints: [{ x: e2.left ? 0 : 1, y: e2.top ? 0 : 1 }], offset: r2.offset || "self", origin: { x: 0, y: 0 }, range: r2.range } }, s2.targetFields = s2.targetFields || [["width", "height"], ["x", "y"]], i$1.start(t2), s2.offsets = t2.state.offsets, t2.state = s2;
}, set(e2) {
  const { interaction: r2, state: n2, coords: i2 } = e2, { options: f2, offsets: a2 } = n2, l2 = { x: i2.x - a2[0].x, y: i2.y - a2[0].y };
  n2.options = n$5({}, f2), n2.options.targets = [];
  for (const t2 of f2.targets || []) {
    let e3;
    if (e3 = s$c.func(t2) ? t2(l2.x, l2.y, r2) : t2, e3) {
      for (const [t3, s2] of n2.targetFields)
        if (t3 in e3 || s2 in e3) {
          e3.x = e3[t3], e3.y = e3[s2];
          break;
        }
      n2.options.targets.push(e3);
    }
  }
  const p2 = i$1.set(e2);
  return n2.options = f2, p2;
}, defaults: { range: 1 / 0, targets: null, offset: null, endOnly: false, enabled: false } };
var a = makeModifier(r, "snapSize");
const o$2 = { start(t2) {
  const { edges: e2 } = t2;
  return e2 ? (t2.state.targetFields = t2.state.targetFields || [[e2.left ? "left" : "right", e2.top ? "top" : "bottom"]], r.start(t2)) : null;
}, set: r.set, defaults: n$5(t$6(r.defaults), { targets: null, range: null, offset: { x: 0, y: 0 } }) };
var m$1 = makeModifier(o$2, "snapEdges");
var s = { aspectRatio: r$2, restrictEdges: t, restrict: s$4, restrictRect: p$2, restrictSize: i$2, snapEdges: m$1, snap: d, snapSize: a, spring: e, avoid: e, transform: e, rubberband: e };
const i = { id: "modifiers", install(i2) {
  const { interactStatic: r2 } = i2;
  i2.usePlugin(t$2), i2.usePlugin(o$5), r2.modifiers = s;
  for (const o2 in s) {
    const { _defaults: t2, _methods: r3 } = s[o2];
    t2._methods = r3, i2.defaults.perAction[o2] = t2;
  }
} };
var o$1 = i;
interact.use(o$1);
var m;
((o2) => {
  o2.touchAction = "touchAction", o2.boxSizing = "boxSizing", o2.noListeners = "noListeners";
})(m || (m = {}));
m.touchAction, m.boxSizing, m.noListeners;
const p = { id: "dev-tools", install() {
} };
var o = p;
interact.use(o);
var GridItem_vue_vue_type_style_index_0_scoped_true_lang = "";
var _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  props: {
    isDraggable: {
      type: Boolean,
      required: false,
      default: null
    },
    isResizable: {
      type: Boolean,
      required: false,
      default: null
    },
    static: {
      type: Boolean,
      required: false,
      default: false
    },
    minH: {
      type: Number,
      required: false,
      default: 1
    },
    minW: {
      type: Number,
      required: false,
      default: 1
    },
    maxH: {
      type: Number,
      required: false,
      default: Infinity
    },
    maxW: {
      type: Number,
      required: false,
      default: Infinity
    },
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    },
    w: {
      type: Number,
      required: true
    },
    h: {
      type: Number,
      required: true
    },
    i: {
      type: String,
      required: true
    },
    dragIgnoreFrom: {
      type: String,
      required: false,
      default: "a, button"
    },
    dragAllowFrom: {
      type: String,
      required: false,
      default: null
    },
    resizeIgnoreFrom: {
      type: String,
      required: false,
      default: "a, button"
    },
    preserveAspectRatio: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: ["container-resized", "resize", "resized", "move", "moved"],
  setup(__props, { emit }) {
    const props = __props;
    const eventBus = inject("eventBus");
    const layout = inject("layout");
    const item = ref(null);
    let interactObj = null;
    let cols = ref(1);
    let containerWidth = ref(100);
    let rowHeight = ref(30);
    let margin = [10, 10];
    let maxRows = Infinity;
    let draggable = ref(null);
    let resizable = ref(null);
    let useCssTransforms = true;
    let useStyleCursor = true;
    let isDragging = ref(false);
    let dragging = null;
    let isResizing = ref(false);
    let resizing = null;
    let lastX = NaN;
    let lastY = NaN;
    let lastW = NaN;
    let lastH = NaN;
    const style = ref({});
    let dragEventSet = false;
    let resizeEventSet = false;
    let previousW = null;
    let previousH = null;
    let previousX = null;
    let previousY = null;
    let innerX = props.x;
    let innerY = props.y;
    let innerW = props.w;
    let innerH = props.h;
    const resizableAndNotStatic = computed(() => resizable.value && !props.static);
    const isAndroid = computed(() => navigator.userAgent.toLowerCase().indexOf("android") !== -1);
    const draggableOrResizableAndNotStatic = computed(() => (draggable.value || resizable.value) && !props.static);
    const classObj = computed(() => {
      return {
        "vue-resizable": resizableAndNotStatic.value,
        static: props.static,
        resizing: isResizing.value,
        "vue-draggable-dragging": isDragging.value,
        cssTransforms: useCssTransforms,
        "render-rtl": layout.isMirrored,
        "disable-userselect": isDragging.value,
        "no-touch": isAndroid.value && draggableOrResizableAndNotStatic.value
      };
    });
    const resizableHandleClass = computed(() => {
      if (layout.isMirrored) {
        return "vue-resizable-handle vue-rtl-resizable-handle";
      } else {
        return "vue-resizable-handle";
      }
    });
    watch(() => props.isDraggable, (newValue) => {
      draggable.value = newValue;
    });
    watch(() => props.static, () => {
      tryMakeDraggable();
      tryMakeResizable();
    });
    watch(() => layout.useStyleCursor, () => {
      if (interactObj) {
        interactObj.styleCursor(layout.useStyleCursor);
      }
    });
    watch(draggable, () => {
      tryMakeDraggable();
    });
    watch(() => props.isResizable, (newValue) => {
      resizable.value = newValue;
    });
    watch(resizable, () => {
      tryMakeResizable();
    });
    watch(rowHeight, () => {
      createStyle();
      emitContainerResized();
    });
    watch([containerWidth, cols], () => {
      tryMakeResizable();
      createStyle();
      emitContainerResized();
    });
    watch(() => props.x, (newVal) => {
      innerX = newVal;
      createStyle();
    });
    watch(() => props.y, (newVal) => {
      innerY = newVal;
      createStyle();
    });
    watch(() => props.h, (newVal) => {
      innerH = newVal;
      createStyle();
    });
    watch(() => props.w, (newVal) => {
      innerW = newVal;
      createStyle();
    });
    watch(() => layout.isMirrored, () => {
      tryMakeResizable();
      createStyle();
    });
    watch([() => props.minH, () => props.maxH, () => props.minW, () => props.maxW], () => {
      tryMakeResizable();
    });
    watch(() => layout.margin, () => {
      if (!margin || margin[0] == margin[0] && margin[1] == margin[1]) {
        return;
      }
      margin = margin.map((m2) => Number(m2));
      createStyle();
      emitContainerResized();
    });
    const updateWidthHandler = (event) => {
      updateWidth(event.width);
    };
    const compactHandler = () => {
      compact2();
    };
    const setDraggableHandler = (event) => {
      if (props.isDraggable === null) {
        draggable.value = event.isDraggable;
      }
    };
    const setResizableHandler = (event) => {
      if (props.isResizable === null) {
        resizable.value = event.isResizable;
      }
    };
    const setRowHeightHandler = (event) => {
      rowHeight.value = event.rowHeight;
    };
    const setMaxRowsHandler = (event) => {
      maxRows = event.maxRows;
    };
    const setColNumHandler = (event) => {
      cols.value = event.colNum;
    };
    eventBus.on("updateWidth", updateWidthHandler);
    eventBus.on("compact", compactHandler);
    eventBus.on("setDraggable", setDraggableHandler);
    eventBus.on("setResizable", setResizableHandler);
    eventBus.on("setRowHeight", setRowHeightHandler);
    eventBus.on("setMaxRows", setMaxRowsHandler);
    eventBus.on("setColNum", setColNumHandler);
    onBeforeUnmount(() => {
      eventBus.off("updateWidth", updateWidthHandler);
      eventBus.off("compact", compactHandler);
      eventBus.off("setDraggable", setDraggableHandler);
      eventBus.off("setResizable", setResizableHandler);
      eventBus.off("setRowHeight", setRowHeightHandler);
      eventBus.off("setMaxRows", setMaxRowsHandler);
      eventBus.off("setColNum", setColNumHandler);
      if (interactObj) {
        interactObj.unset();
      }
    });
    onMounted(() => {
      if (layout.responsive && layout.lastBreakpoint) {
        cols.value = getColsFromBreakpoint(layout.lastBreakpoint, layout.cols);
      } else {
        cols.value = layout.colNum;
      }
      rowHeight.value = layout.rowHeight;
      margin = layout.margin ? layout.margin : [10, 10];
      maxRows = layout.maxRows;
      if (props.isDraggable === null) {
        draggable.value = layout.isDraggable;
      } else {
        draggable.value = props.isDraggable;
      }
      if (props.isResizable === null) {
        resizable.value = layout.isResizable;
      } else {
        resizable.value = props.isResizable;
      }
      useCssTransforms = layout.useCssTransforms;
      useStyleCursor = layout.useStyleCursor;
      createStyle();
    });
    const createStyle = () => {
      if (props.x + props.w > cols.value) {
        innerX = 0;
        innerW = props.w > cols.value ? cols.value : props.w;
      } else {
        innerX = props.x;
        innerW = props.w;
      }
      let pos = calcPosition(innerX, innerY, innerW, innerH);
      if (isDragging.value && dragging) {
        pos.top = dragging.top;
        if (layout.isMirrored) {
          pos.right = dragging.left;
        } else {
          pos.left = dragging.left;
        }
      }
      if (isResizing.value && resizing) {
        pos.width = resizing.width;
        pos.height = resizing.height;
      }
      let styleValue;
      if (useCssTransforms) {
        if (layout.isMirrored) {
          styleValue = setTransformRtl(pos.top, pos.right, pos.width, pos.height);
        } else {
          styleValue = setTransform(pos.top, pos.left, pos.width, pos.height);
        }
      } else {
        if (layout.isMirrored) {
          styleValue = setTopRight(pos.top, pos.right, pos.width, pos.height);
        } else {
          styleValue = setTopLeft(pos.top, pos.left, pos.width, pos.height);
        }
      }
      style.value = styleValue;
    };
    const emitContainerResized = () => {
      let styleProps = { width: 0, height: 0 };
      for (let prop of Object.keys(styleProps)) {
        let val = style.value[prop];
        let matches = val.match(/^(\d+)px$/);
        if (!matches)
          return;
        styleProps[prop] = matches[1];
      }
      emit("container-resized", props.i, props.h, props.w, styleProps.height, styleProps.width);
    };
    const handleResize = (event) => {
      if (props.static)
        return;
      const position = getControlPosition(event);
      if (position == null)
        return;
      const { x, y } = position;
      const newSize = { width: 0, height: 0 };
      let pos;
      switch (event.type) {
        case "resizestart": {
          previousW = innerW;
          previousH = innerH;
          pos = calcPosition(innerX, innerY, innerW, innerH);
          newSize.width = pos.width;
          newSize.height = pos.height;
          resizing = newSize;
          isResizing.value = true;
          break;
        }
        case "resizemove": {
          if (resizing) {
            const coreEvent = createCoreData(lastW, lastH, x, y);
            if (layout.isMirrored) {
              newSize.width = resizing.width - coreEvent.deltaX;
            } else {
              newSize.width = resizing.width + coreEvent.deltaX;
            }
            newSize.height = resizing.height + coreEvent.deltaY;
            resizing = newSize;
          }
          break;
        }
        case "resizeend": {
          pos = calcPosition(innerX, innerY, innerW, innerH);
          newSize.width = pos.width;
          newSize.height = pos.height;
          resizing = null;
          isResizing.value = false;
          break;
        }
      }
      pos = calcWH(newSize.height, newSize.width);
      if (pos.w < props.minW) {
        pos.w = props.minW;
      }
      if (pos.w > props.maxW) {
        pos.w = props.maxW;
      }
      if (pos.h < props.minH) {
        pos.h = props.minH;
      }
      if (pos.h > props.maxH) {
        pos.h = props.maxH;
      }
      if (pos.h < 1) {
        pos.h = 1;
      }
      if (pos.w < 1) {
        pos.w = 1;
      }
      lastW = x;
      lastH = y;
      if (innerW !== pos.w || innerH !== pos.h) {
        emit("resize", props.i, pos.h, pos.w, newSize.height, newSize.width);
      }
      if (event.type === "resizeend" && (previousW !== innerW || previousH !== innerH)) {
        emit("resized", props.i, pos.h, pos.w, newSize.height, newSize.width);
      }
      eventBus == null ? void 0 : eventBus.emit("resizeItem", {
        eventType: event.type,
        i: props.i,
        x: innerX,
        y: innerY,
        h: pos.h,
        w: pos.w
      });
    };
    const handleDrag = (event) => {
      if (props.static)
        return;
      if (isResizing.value)
        return;
      const position = getControlPosition(event);
      if (position === null)
        return;
      const { x, y } = position;
      let newPosition = { top: 0, left: 0 };
      switch (event.type) {
        case "dragstart": {
          previousX = innerX;
          previousY = innerY;
          let parentRect = event.target.offsetParent.getBoundingClientRect();
          let clientRect = event.target.getBoundingClientRect();
          if (layout.isMirrored) {
            newPosition.left = (clientRect.right - parentRect.right) * -1;
          } else {
            newPosition.left = clientRect.left - parentRect.left;
          }
          newPosition.top = clientRect.top - parentRect.top;
          dragging = newPosition;
          isDragging.value = true;
          break;
        }
        case "dragend": {
          if (!isDragging.value)
            return;
          let parentRect = event.target.offsetParent.getBoundingClientRect();
          let clientRect = event.target.getBoundingClientRect();
          if (layout.isMirrored) {
            newPosition.left = (clientRect.right - parentRect.right) * -1;
          } else {
            newPosition.left = clientRect.left - parentRect.left;
          }
          newPosition.top = clientRect.top - parentRect.top;
          dragging = null;
          isDragging.value = false;
          break;
        }
        case "dragmove": {
          const coreEvent = createCoreData(lastX, lastY, x, y);
          if (dragging) {
            if (layout.isMirrored) {
              newPosition.left = dragging.left - coreEvent.deltaX;
            } else {
              newPosition.left = dragging.left + coreEvent.deltaX;
            }
            newPosition.top = dragging.top + coreEvent.deltaY;
            dragging = newPosition;
          }
          break;
        }
      }
      let pos;
      if (layout.isMirrored) {
        pos = calcXY(newPosition.top, newPosition.left);
      } else {
        pos = calcXY(newPosition.top, newPosition.left);
      }
      lastX = x;
      lastY = y;
      if (innerX !== pos.x || innerY !== pos.y) {
        emit("move", props.i, pos.x, pos.y);
      }
      if (event.type === "dragend" && (previousX !== innerX || previousY !== innerY)) {
        emit("moved", props.i, pos.x, pos.y);
      }
      eventBus == null ? void 0 : eventBus.emit("dragItem", {
        eventType: event.type,
        i: props.i,
        x: pos.x,
        y: pos.y,
        h: innerH,
        w: innerW
      });
    };
    const calcPosition = (x, y, w, h) => {
      const colWidth = calcColWidth();
      let out;
      if (layout.isMirrored) {
        out = {
          right: Math.round(colWidth * x + (x + 1) * margin[0]),
          top: Math.round(rowHeight.value * y + (y + 1) * margin[1]),
          width: w === Infinity ? w : Math.round(colWidth * w + Math.max(0, w - 1) * margin[0]),
          height: h === Infinity ? h : Math.round(rowHeight.value * h + Math.max(0, h - 1) * margin[1])
        };
      } else {
        out = {
          left: Math.round(colWidth * x + (x + 1) * margin[0]),
          top: Math.round(rowHeight.value * y + (y + 1) * margin[1]),
          width: w === Infinity ? w : Math.round(colWidth * w + Math.max(0, w - 1) * margin[0]),
          height: h === Infinity ? h : Math.round(rowHeight.value * h + Math.max(0, h - 1) * margin[1])
        };
      }
      return out;
    };
    const calcXY = (top, left) => {
      const colWidth = calcColWidth();
      let x = Math.round((left - margin[0]) / (colWidth + margin[0]));
      let y = Math.round((top - margin[1]) / (rowHeight.value + margin[1]));
      x = Math.max(Math.min(x, cols.value - innerW), 0);
      y = Math.max(Math.min(y, maxRows - innerH), 0);
      return { x, y };
    };
    const calcColWidth = () => {
      return (containerWidth.value - margin[0] * (cols.value + 1)) / cols.value;
    };
    const calcWH = (height, width, autoSizeFlag = false) => {
      const colWidth = calcColWidth();
      let w = Math.round((width + margin[0]) / (colWidth + margin[0]));
      let h = 0;
      if (!autoSizeFlag) {
        h = Math.round((height + margin[1]) / (rowHeight.value + margin[1]));
      } else {
        h = Math.ceil((height + margin[1]) / (rowHeight.value + margin[1]));
      }
      w = Math.max(Math.min(w, cols.value - innerX), 0);
      h = Math.max(Math.min(h, maxRows - innerY), 0);
      return { w, h };
    };
    const updateWidth = (width, colNum = null) => {
      containerWidth.value = width;
      if (colNum !== void 0 && colNum !== null) {
        cols.value = colNum;
      }
    };
    const compact2 = () => {
      createStyle();
    };
    const tryMakeDraggable = () => {
      if (interactObj === null || interactObj === void 0) {
        interactObj = interact(item.value);
      }
      if (draggable.value && !props.static) {
        const opts = {
          ignoreFrom: props.dragIgnoreFrom,
          allowFrom: props.dragAllowFrom
        };
        interactObj.draggable(opts);
        if (!dragEventSet) {
          dragEventSet = true;
          interactObj.on("dragstart dragmove dragend", function(event) {
            handleDrag(event);
          });
        }
      } else {
        interactObj.draggable({
          enabled: false
        });
      }
    };
    const tryMakeResizable = () => {
      if (interactObj === null || interactObj === void 0) {
        interactObj = interact(item.value);
        if (!useStyleCursor) {
          interactObj.styleCursor(false);
        }
      }
      if (resizable.value && !props.static) {
        let maximum = calcPosition(0, 0, props.maxW, props.maxH);
        let minimum = calcPosition(0, 0, props.minW, props.minH);
        let opts = {
          edges: {
            left: layout.isMirrored,
            right: !layout.isMirrored,
            bottom: true,
            top: false
          },
          ignoreFrom: props.resizeIgnoreFrom,
          restrictSize: {
            min: {
              height: minimum.height,
              width: minimum.width
            },
            max: {
              height: maximum.height,
              width: maximum.width
            }
          }
        };
        if (props.preserveAspectRatio) {
          opts.modifiers = [
            interact.modifiers.aspectRatio({
              ratio: "preserve"
            })
          ];
        }
        interactObj.resizable(opts);
        if (!resizeEventSet) {
          resizeEventSet = true;
          interactObj.on("resizestart resizemove resizeend", function(event) {
            handleResize(event);
          });
        }
      } else {
        interactObj.resizable({
          enabled: false
        });
      }
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        ref_key: "item",
        ref: item,
        class: normalizeClass(["vue-grid-item", unref(classObj)]),
        style: normalizeStyle(style.value)
      }, [
        renderSlot(_ctx.$slots, "default", {}, void 0, true),
        unref(resizableAndNotStatic) ? (openBlock(), createElementBlock("span", {
          key: 0,
          ref: "handle",
          class: normalizeClass(unref(resizableHandleClass))
        }, null, 2)) : createCommentVNode("", true)
      ], 6);
    };
  }
});
var GridItem = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-76b45c68"]]);
function mitt(n2) {
  return { all: n2 = n2 || new Map(), on: function(t2, e2) {
    var i2 = n2.get(t2);
    i2 ? i2.push(e2) : n2.set(t2, [e2]);
  }, off: function(t2, e2) {
    var i2 = n2.get(t2);
    i2 && (e2 ? i2.splice(i2.indexOf(e2) >>> 0, 1) : n2.set(t2, []));
  }, emit: function(t2, e2) {
    var i2 = n2.get(t2);
    i2 && i2.slice().map(function(n3) {
      n3(e2);
    }), (i2 = n2.get("*")) && i2.slice().map(function(n3) {
      n3(t2, e2);
    });
  } };
}
function tryOnScopeDispose(fn) {
  if (getCurrentScope()) {
    onScopeDispose(fn);
    return true;
  }
  return false;
}
const isClient = typeof window !== "undefined";
function unrefElement(elRef) {
  var _a2;
  const plain = unref(elRef);
  return (_a2 = plain == null ? void 0 : plain.$el) != null ? _a2 : plain;
}
const defaultWindow = isClient ? window : void 0;
isClient ? window.document : void 0;
isClient ? window.navigator : void 0;
isClient ? window.location : void 0;
var __getOwnPropSymbols$b = Object.getOwnPropertySymbols;
var __hasOwnProp$b = Object.prototype.hasOwnProperty;
var __propIsEnum$b = Object.prototype.propertyIsEnumerable;
var __objRest$2 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp$b.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols$b)
    for (var prop of __getOwnPropSymbols$b(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum$b.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
function useResizeObserver(target, callback, options = {}) {
  const _a2 = options, { window: window2 = defaultWindow } = _a2, observerOptions = __objRest$2(_a2, ["window"]);
  let observer;
  const isSupported = window2 && "ResizeObserver" in window2;
  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = void 0;
    }
  };
  const stopWatch = watch(() => unrefElement(target), (el) => {
    cleanup();
    if (isSupported && window2 && el) {
      observer = new window2.ResizeObserver(callback);
      observer.observe(el, observerOptions);
    }
  }, { immediate: true, flush: "post" });
  const stop = () => {
    cleanup();
    stopWatch();
  };
  tryOnScopeDispose(stop);
  return {
    isSupported,
    stop
  };
}
var _a, _b;
isClient && (window == null ? void 0 : window.navigator) && ((_a = window == null ? void 0 : window.navigator) == null ? void 0 : _a.platform) && /iP(ad|hone|od)/.test((_b = window == null ? void 0 : window.navigator) == null ? void 0 : _b.platform);
var __defProp$3 = Object.defineProperty;
var __getOwnPropSymbols$3 = Object.getOwnPropertySymbols;
var __hasOwnProp$3 = Object.prototype.hasOwnProperty;
var __propIsEnum$3 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$3 = (a2, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$3.call(b, prop))
      __defNormalProp$3(a2, prop, b[prop]);
  if (__getOwnPropSymbols$3)
    for (var prop of __getOwnPropSymbols$3(b)) {
      if (__propIsEnum$3.call(b, prop))
        __defNormalProp$3(a2, prop, b[prop]);
    }
  return a2;
};
const initialRect = {
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  height: 0,
  width: 0
};
__spreadValues$3({
  text: ""
}, initialRect);
var GridLayout_vue_vue_type_style_index_0_scoped_true_lang = "";
const _sfc_main = /* @__PURE__ */ defineComponent({
  props: {
    autoSize: {
      type: Boolean,
      default: true
    },
    colNum: {
      type: Number,
      default: 12
    },
    rowHeight: {
      type: Number,
      default: 150
    },
    maxRows: {
      type: Number,
      default: Infinity
    },
    margin: {
      type: Array,
      default: function() {
        return [10, 10];
      }
    },
    isDraggable: {
      type: Boolean,
      default: true
    },
    isResizable: {
      type: Boolean,
      default: true
    },
    isMirrored: {
      type: Boolean,
      default: false
    },
    useCssTransforms: {
      type: Boolean,
      default: true
    },
    verticalCompact: {
      type: Boolean,
      default: true
    },
    layout: {
      type: Array,
      required: true
    },
    responsive: {
      type: Boolean,
      default: false
    },
    responsiveLayouts: {
      type: Object,
      default: function() {
        return {};
      }
    },
    breakpoints: {
      type: Object,
      default: function() {
        return { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
      }
    },
    cols: {
      type: Object,
      default: function() {
        return { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
      }
    },
    preventCollision: {
      type: Boolean,
      default: false
    },
    useStyleCursor: {
      type: Boolean,
      default: true
    }
  },
  emits: ["layout-ready", "update:layout", "layout-created", "layout-before-mount", "layout-mounted", "layout-updated", "breakpoint-changed"],
  setup(__props, { emit }) {
    const props = __props;
    const eventBus = mitt();
    provide("eventBus", eventBus);
    provide("layout", props);
    const width = ref(100);
    const mergedStyle = ref({});
    const isDragging = ref(false);
    const placeholder = reactive({
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      i: "-1"
    });
    let layouts = {};
    let lastBreakpoint = null;
    let originalLayout = null;
    const item = ref(null);
    watch(() => width.value, (newval, oldval) => {
      nextTick(function() {
        eventBus.emit("updateWidth", { width: width.value });
        if (oldval === null) {
          nextTick(() => {
            emit("layout-ready", props.layout);
          });
        }
        updateHeight();
      });
    });
    watch(() => props.layout, () => {
      layoutUpdate();
    });
    watch(() => props.colNum, (val) => eventBus.emit("setColNum", { colNum: val }));
    watch(() => props.rowHeight, () => eventBus.emit("setRowHeight", { rowHeight: props.rowHeight }));
    watch(() => props.isDraggable, () => eventBus.emit("setDraggable", { isDraggable: props.isDraggable }));
    watch(() => props.isResizable, () => eventBus.emit("setResizable", { isResizable: props.isResizable }));
    watch(() => props.responsive, () => {
      if (!props.responsive) {
        emit("update:layout", originalLayout);
        eventBus.emit("setColNum", { colNum: props.colNum });
      }
      onContainerResize();
    });
    watch(() => props.maxRows, () => eventBus.emit("setMaxRows", { maxRows: props.maxRows }));
    watch(() => props.margin, () => updateHeight());
    onBeforeUnmount(() => {
      eventBus.off("resizeItem", resizeItemEventHandler);
      eventBus.off("dragItem", dragItemEventHandler);
    });
    onBeforeMount(() => {
      emit("layout-before-mount", props.layout);
    });
    onMounted(() => {
      emit("layout-mounted", props.layout);
      nextTick(() => {
        validateLayout(props.layout);
        originalLayout = props.layout;
        nextTick(() => {
          onContainerResize();
          initResponsiveFeatures();
          compact(props.layout, props.verticalCompact);
          emit("layout-updated", props.layout);
          updateHeight();
          nextTick(() => useResizeObserver(item.value, () => onContainerResize()));
        });
      });
    });
    const layoutUpdate = () => {
      if (props.layout !== void 0 && originalLayout !== null) {
        if (props.layout.length !== originalLayout.length) {
          let diff = findDifference(props.layout, originalLayout);
          if (diff.length > 0) {
            if (props.layout.length > originalLayout.length) {
              originalLayout = originalLayout.concat(diff);
            } else {
              originalLayout = originalLayout.filter((obj) => {
                return !diff.some((obj2) => {
                  return obj.i === obj2.i;
                });
              });
            }
          }
          initResponsiveFeatures();
        }
        compact(props.layout, props.verticalCompact);
        eventBus.emit("updateWidth", { width: width.value });
        updateHeight();
        emit("layout-updated", props.layout);
      }
    };
    const updateHeight = () => {
      mergedStyle.value = {
        height: containerHeight()
      };
    };
    const onContainerResize = () => {
      if (item.value !== null && item.value !== void 0) {
        width.value = item.value.offsetWidth;
      }
      if (props.responsive)
        responsiveGridLayout();
      compact(props.layout, props.verticalCompact);
      eventBus.emit("compact");
      updateHeight();
      eventBus.emit("updateWidth", { width: width.value });
    };
    const containerHeight = () => {
      if (!props.autoSize)
        return;
      const containerHeight2 = bottom(props.layout) * (props.rowHeight + props.margin[1]) + props.margin[1] + "px";
      return containerHeight2;
    };
    const dragItemEventHandler = (event) => {
      const { eventType, i: i2, x, y, h, w } = event;
      let l2 = getLayoutItem(props.layout, i2);
      if (l2 === void 0 || l2 === null) {
        l2 = { x: 0, y: 0 };
      }
      if (eventType === "dragmove" || eventType === "dragstart") {
        placeholder.i = i2;
        placeholder.x = l2.x;
        placeholder.y = l2.y;
        placeholder.w = w;
        placeholder.h = h;
        nextTick(function() {
          isDragging.value = true;
        });
        eventBus.emit("updateWidth", { width: width.value });
      } else {
        nextTick(function() {
          isDragging.value = false;
        });
      }
      emit("update:layout", moveElement(props.layout, l2, x, y, true, props.preventCollision));
      compact(props.layout, props.verticalCompact);
      eventBus.emit("compact");
      updateHeight();
      if (eventType === "dragend")
        emit("layout-updated", props.layout);
    };
    const resizeItemEventHandler = (event) => {
      const { eventType, i: i2, x, y, h, w } = event;
      let l2 = getLayoutItem(props.layout, i2);
      if (l2 === void 0 || l2 === null) {
        l2 = { h: 0, w: 0 };
      }
      let hasCollisions;
      if (props.preventCollision) {
        const collisions = getAllCollisions(props.layout, __spreadProps(__spreadValues({}, l2), { w, h })).filter((layoutItem) => layoutItem.i !== l2.i);
        hasCollisions = collisions.length > 0;
        if (hasCollisions) {
          let leastX = Infinity, leastY = Infinity;
          collisions.forEach((layoutItem) => {
            if (layoutItem.x > l2.x)
              leastX = Math.min(leastX, layoutItem.x);
            if (layoutItem.y > l2.y)
              leastY = Math.min(leastY, layoutItem.y);
          });
          if (Number.isFinite(leastX))
            l2.w = leastX - l2.x;
          if (Number.isFinite(leastY))
            l2.h = leastY - l2.y;
        }
      }
      if (!hasCollisions) {
        l2.w = w;
        l2.h = h;
      }
      if (eventType === "resizestart" || eventType === "resizemove") {
        placeholder.i = i2;
        placeholder.x = x;
        placeholder.y = y;
        placeholder.w = l2.w;
        placeholder.h = l2.h;
        nextTick(() => isDragging.value = true);
        eventBus.emit("updateWidth", { width: width.value });
      } else {
        nextTick(() => isDragging.value = false);
      }
      if (props.responsive)
        responsiveGridLayout();
      compact(props.layout, props.verticalCompact);
      eventBus.emit("compact");
      updateHeight();
      if (eventType === "resizeend")
        emit("layout-updated", props.layout);
    };
    const responsiveGridLayout = () => {
      let newBreakpoint = getBreakpointFromWidth(props.breakpoints, width.value);
      let newCols = getColsFromBreakpoint(newBreakpoint, props.cols);
      if (lastBreakpoint != null && !layouts[lastBreakpoint]) {
        layouts[lastBreakpoint] = cloneLayout(props.layout);
      }
      let layout = findOrGenerateResponsiveLayout(originalLayout, layouts, props.breakpoints, newBreakpoint, lastBreakpoint, newCols, props.verticalCompact);
      layouts[newBreakpoint] = layout;
      if (lastBreakpoint !== newBreakpoint) {
        emit("breakpoint-changed", newBreakpoint, props.layout);
      }
      emit("update:layout", layout);
      lastBreakpoint = newBreakpoint;
      eventBus.emit("setColNum", { colNum: getColsFromBreakpoint(newBreakpoint, props.cols) });
    };
    const initResponsiveFeatures = () => {
      layouts = Object.assign({}, props.responsiveLayouts);
    };
    const findDifference = (layout, originalLayout2) => {
      let uniqueResultOne = layout.filter((obj) => {
        return !originalLayout2.some((obj2) => obj.i === obj2.i);
      });
      let uniqueResultTwo = originalLayout2.filter((obj) => {
        return !layout.some((obj2) => obj.i === obj2.i);
      });
      return uniqueResultOne.concat(uniqueResultTwo);
    };
    eventBus.on("resizeItem", resizeItemEventHandler);
    eventBus.on("dragItem", dragItemEventHandler);
    emit("layout-created", props.layout);
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        ref_key: "item",
        ref: item,
        class: "vue-grid-layout",
        style: normalizeStyle(mergedStyle.value)
      }, [
        renderSlot(_ctx.$slots, "default", {}, void 0, true),
        withDirectives(createVNode(GridItem, {
          class: "vue-grid-placeholder",
          x: unref(placeholder).x,
          y: unref(placeholder).y,
          w: unref(placeholder).w,
          h: unref(placeholder).h,
          i: unref(placeholder).i
        }, null, 8, ["x", "y", "w", "h", "i"]), [
          [vShow, isDragging.value]
        ])
      ], 4);
    };
  }
});
var GridLayout = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-b9138bf4"]]);
const install = (app) => {
  app.component("GridLayout", GridLayout);
  app.component("GridItem", GridItem);
};
export { GridItem, GridLayout, install as default, install };
