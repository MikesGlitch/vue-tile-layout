let currentDir: 'ltr' | 'rtl' | 'auto' = 'auto'
// let currentDir = "auto";

function hasDocument() {
  return typeof document !== 'undefined'
}

function hasWindow() {
  return typeof window !== 'undefined'
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getDocumentDir() {
  if (!hasDocument()) {
    return currentDir
  }
  const direction =
    typeof document.dir !== 'undefined' ? document.dir : document.getElementsByTagName('html')[0].getAttribute('dir')
  return direction
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function setDocumentDir(dir: 'ltr' | 'rtl' | 'auto') {
  // export function setDocumentDir(dir){
  if (!hasDocument) {
    currentDir = dir
    return
  }

  const html = document.getElementsByTagName('html')[0]
  html.setAttribute('dir', dir)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function addWindowEventListener(event: string, callback: () => any) {
  if (!hasWindow) {
    callback()
    return
  }
  window.addEventListener(event, callback)
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function removeWindowEventListener(event: string, callback: () => any) {
  if (!hasWindow) {
    return
  }
  window.removeEventListener(event, callback)
}
