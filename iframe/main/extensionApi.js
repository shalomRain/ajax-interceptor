/**
 * 扩展 API 仅在扩展页面（chrome-extension://）中完整可用。
 * 在 webpack 本地（http://localhost）下不要直接访问 chrome.runtime，否则可能取到不完整的 API。
 * 统一通过 globalThis 读取，避免在任意环境下对 undefined 做 .onMessage 等访问。
 */
function getChrome() {
  try {
    if (typeof globalThis === 'undefined') return null
    const c = globalThis.chrome
    return c && typeof c === 'object' ? c : null
  } catch (e) {
    return null
  }
}

export function getExtensionRuntime() {
  const c = getChrome()
  if (!c) return null
  return c.runtime && typeof c.runtime === 'object' ? c.runtime : null
}

export function addExtensionMessageListener(callback) {
  const runtime = getExtensionRuntime()
  if (!runtime) return
  const onMessage = runtime.onMessage
  if (!onMessage || typeof onMessage.addListener !== 'function') return
  onMessage.addListener(callback)
}

export function sendToExtensionRuntime(payload) {
  const runtime = getExtensionRuntime()
  if (!runtime) return
  if (!runtime.id || typeof runtime.sendMessage !== 'function') return
  runtime.sendMessage(runtime.id, payload)
}

export function getChromeStorageLocal() {
  const c = getChrome()
  if (!c || !c.storage || !c.storage.local) return null
  return c.storage.local
}
