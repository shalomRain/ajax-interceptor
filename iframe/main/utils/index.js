import { sendToExtensionRuntime, getChromeStorageLocal } from '../extensionApi'

export function setChromeStorage(key, value) {
  // 发送给background.js
  sendToExtensionRuntime({ type: 'ajaxInterceptor', to: 'background', key, value })
  const local = getChromeStorageLocal()
  if (local) {
    local.set({ [key]: value })
  }
}