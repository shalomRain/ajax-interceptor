import React from 'react'
import ReactDOM from 'react-dom'

import Main from './Main'
import { getChromeStorageLocal } from './extensionApi'

const buildGroupId = () => {
  const dt = new Date().getTime()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (dt + Math.random() * 16) % 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

const DEFAULT_SETTING = {
  ajaxInterceptor_switchOn: false,
  ajaxInterceptor_groups: [],
  ajaxInterceptor_rules: [],
  customFunction: {
    panelPosition: 0,  // 0:页面悬浮面板, 1:devTools
  }
}

function ensureGroupsMigrated (raw) {
  const rules = raw.ajaxInterceptor_rules || []
  const groups = raw.ajaxInterceptor_groups
  if (!Array.isArray(groups) || !groups.length) {
    const defaultId = buildGroupId()
    const withIds = rules.map((r) => ({ ...r, groupId: r.groupId || defaultId }))
    return {
      out: { ...raw, ajaxInterceptor_groups: [{ id: defaultId, name: '默认', switchOn: true }], ajaxInterceptor_rules: withIds },
      needsSave: true
    }
  }
  const idSet = new Set(groups.map((g) => g && g.id).filter(Boolean))
  const fallback = groups[0] && groups[0].id
  let needsSave = false
  const withIds = rules.map((r) => {
    if (r.groupId && idSet.has(r.groupId)) return r
    needsSave = true
    return { ...r, groupId: fallback }
  })
  return { out: { ...raw, ajaxInterceptor_groups: groups, ajaxInterceptor_rules: withIds }, needsSave }
}

const storageLocal = getChromeStorageLocal()
if (storageLocal) {
  storageLocal.get(['ajaxInterceptor_switchOn', 'ajaxInterceptor_rules', 'ajaxInterceptor_groups', 'customFunction'], (result) => {
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