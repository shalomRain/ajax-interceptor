import React from 'react'
import ReactDOM from 'react-dom'

import Main from './Main'
import { getChromeStorageLocal } from './extensionApi'
import {
  DEFAULT_SETTING,
  ensureGroupsMigrated,
  needsGlobalHeadersMigrate,
  normalizeGlobalHeaders,
  normalizeSlowNetwork,
  STORAGE_KEYS
} from './utils/settingStorage'

const storageLocal = getChromeStorageLocal()
if (storageLocal) {
  storageLocal.get(STORAGE_KEYS, (result) => {
    const headersNeedMigrate = needsGlobalHeadersMigrate(result.ajaxInterceptor_globalHeaders)
    const merged = { ...DEFAULT_SETTING, ...result }
    merged.ajaxInterceptor_globalHeaders = normalizeGlobalHeaders(merged.ajaxInterceptor_globalHeaders)
    merged.ajaxInterceptor_slowNetwork = normalizeSlowNetwork(merged.ajaxInterceptor_slowNetwork)
    const { out, needsSave } = ensureGroupsMigrated(merged)
    window.setting = out
    const toSave = {}
    if (needsSave) {
      toSave.ajaxInterceptor_groups = window.setting.ajaxInterceptor_groups
      toSave.ajaxInterceptor_rules = window.setting.ajaxInterceptor_rules
    }
    if (headersNeedMigrate) {
      toSave.ajaxInterceptor_globalHeaders = window.setting.ajaxInterceptor_globalHeaders
    }
    if (Object.keys(toSave).length) {
      storageLocal.set(toSave)
    }

    ReactDOM.render(
      <Main/>,
      document.getElementById('main')
    )
  })
} else {
  const merged = {
    ...DEFAULT_SETTING,
    ajaxInterceptor_globalHeaders: normalizeGlobalHeaders(DEFAULT_SETTING.ajaxInterceptor_globalHeaders),
    ajaxInterceptor_slowNetwork: normalizeSlowNetwork(DEFAULT_SETTING.ajaxInterceptor_slowNetwork)
  }
  const { out } = ensureGroupsMigrated(merged)
  window.setting = out
  // 测试环境
  ReactDOM.render(
    <Main/>,
    document.getElementById('main')
  )
}