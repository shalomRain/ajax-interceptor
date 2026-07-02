export const STORAGE_KEYS = [
  'ajaxInterceptor_switchOn',
  'ajaxInterceptor_groups',
  'ajaxInterceptor_rules',
  'customFunction'
]

export const BACKUP_FORMAT = 'ajax-interceptor-backup'
export const BACKUP_VERSION = 1

export const DEFAULT_SETTING = {
  ajaxInterceptor_switchOn: false,
  ajaxInterceptor_groups: [],
  ajaxInterceptor_rules: [],
  customFunction: {
    panelPosition: 0
  }
}

const buildGroupId = () => {
  const dt = new Date().getTime()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (dt + Math.random() * 16) % 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export function ensureGroupsMigrated (raw) {
  const rules = raw.ajaxInterceptor_rules || []
  const groups = raw.ajaxInterceptor_groups
  if (!Array.isArray(groups) || !groups.length) {
    const defaultId = buildGroupId()
    const withIds = rules.map((r) => ({
      ...r,
      groupId: r.groupId || defaultId,
      key: r.key || buildGroupId()
    }))
    return {
      out: { ...raw, ajaxInterceptor_groups: [{ id: defaultId, name: '', domain: '', switchOn: true }], ajaxInterceptor_rules: withIds },
      needsSave: true
    }
  }
  const idSet = new Set(groups.map((g) => g && g.id).filter(Boolean))
  const fallback = groups[0] && groups[0].id
  let needsSave = false
  const withIds = rules.map((r) => {
    let next = r
    if (!r.groupId || !idSet.has(r.groupId)) {
      needsSave = true
      next = { ...next, groupId: fallback }
    }
    if (!next.key) {
      needsSave = true
      next = { ...next, key: buildGroupId() }
    }
    return next
  })
  return { out: { ...raw, ajaxInterceptor_groups: groups, ajaxInterceptor_rules: withIds }, needsSave }
}

export function pickSettingData (source) {
  const data = {}
  STORAGE_KEYS.forEach((key) => {
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      data[key] = source[key]
    }
  })
  return data
}

export function buildBackupPayload (setting) {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: pickSettingData(setting)
  }
}

export function parseBackupFile (raw) {
  let parsed = raw
  if (typeof raw === 'string') {
    parsed = JSON.parse(raw)
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('备份文件格式无效')
  }

  let data = parsed
  if (parsed.format === BACKUP_FORMAT || parsed.data) {
    if (parsed.format && parsed.format !== BACKUP_FORMAT) {
      throw new Error('不是 Ajax Modifier 的备份文件')
    }
    data = parsed.data
  }

  if (!data || typeof data !== 'object') {
    throw new Error('备份中缺少数据')
  }

  const picked = pickSettingData(data)
  if (!Object.keys(picked).length) {
    throw new Error('备份中未包含可识别的配置项')
  }
  if (picked.ajaxInterceptor_rules && !Array.isArray(picked.ajaxInterceptor_rules)) {
    throw new Error('ajaxInterceptor_rules 必须是数组')
  }
  if (picked.ajaxInterceptor_groups && !Array.isArray(picked.ajaxInterceptor_groups)) {
    throw new Error('ajaxInterceptor_groups 必须是数组')
  }

  return { ...DEFAULT_SETTING, ...picked }
}
