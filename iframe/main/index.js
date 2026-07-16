import React from 'react'
import ReactDOM from 'react-dom'

import Main from './Main'
import { getChromeStorageLocal } from './extensionApi'
import {
  DEFAULT_SETTING,
  ensureGroupsMigrated,
  normalizeGlobalHeaders,
  STORAGE_KEYS
} from './utils/settingStorage'

const storageLocal = getChromeStorageLocal()
if (storageLocal) {
  storageLocal.get(STORAGE_KEYS, (result) => {
    const merged = { ...DEFAULT_SETTING, ...result }
    merged.ajaxInterceptor_globalHeaders = normalizeGlobalHeaders(merged.ajaxInterceptor_globalHeaders)
    const { out, needsSave } = ensureGroupsMigrated(merged)
    window.setting = out
    if (needsSave) {
      storageLocal.set({ ajaxInterceptor_groups: window.setting.ajaxInterceptor_groups, ajaxInterceptor_rules: window.setting.ajaxInterceptor_rules })
    }

    ReactDOM.render(
      <Main/>,
      document.getElementById('main')
    )
  })
} else {
  const merged = {
    ...DEFAULT_SETTING,
    ajaxInterceptor_globalHeaders: normalizeGlobalHeaders(DEFAULT_SETTING.ajaxInterceptor_globalHeaders)
  }
  const { out } = ensureGroupsMigrated(merged)
  window.setting = out
  // 测试环境
  ReactDOM.render(
    <Main/>,
    document.getElementById('main')
  )
}