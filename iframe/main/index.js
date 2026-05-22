import React from 'react'
import ReactDOM from 'react-dom'

import Main from './Main'
import { getChromeStorageLocal } from './extensionApi'
import { DEFAULT_SETTING, ensureGroupsMigrated, STORAGE_KEYS } from './utils/settingStorage'

const storageLocal = getChromeStorageLocal()
if (storageLocal) {
  storageLocal.get(STORAGE_KEYS, (result) => {
    const merged = { ...DEFAULT_SETTING, ...result }
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
  const { out } = ensureGroupsMigrated(DEFAULT_SETTING)
  window.setting = out
  // 测试环境
  ReactDOM.render(
    <Main/>,
    document.getElementById('main')
  )
}