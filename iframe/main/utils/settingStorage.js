export const STORAGE_KEYS = [
  'ajaxInterceptor_switchOn',
  'ajaxInterceptor_groups',
  'ajaxInterceptor_rules',
  'ajaxInterceptor_globalHeaders',
  'ajaxInterceptor_slowNetwork',
  'customFunction'
]

export const BACKUP_FORMAT = 'ajax-interceptor-backup'
export const BACKUP_VERSION = 1

export const DEFAULT_GLOBAL_HEADERS = {
  switchOn: false,
  scopes: []
}

/**
 * 全局慢网（独立于 Mock）：关闭=正常；开启后按 scopes 命中请求再延迟 delayMs
 * scopes: [{ id, domain, match, filterType }]
 * - domain 留空：不限 host；填写后仅该 host
 * - match 留空：该作用域下全部路径；填写后按 filterType 匹配
 */
export const DEFAULT_SLOW_NETWORK = {
  switchOn: false,
  delayMs: 3000,
  scopes: []
}

export const DEFAULT_SETTING = {
  ajaxInterceptor_switchOn: false,
  ajaxInterceptor_groups: [],
  ajaxInterceptor_rules: [],
  ajaxInterceptor_globalHeaders: { ...DEFAULT_GLOBAL_HEADERS, scopes: [] },
  ajaxInterceptor_slowNetwork: { ...DEFAULT_SLOW_NETWORK },
  customFunction: {
    panelPosition: 0
  }
}

const genHeaderId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

/** 规范化域名（支持粘贴完整 URL → host） */
export function normalizeHeaderDomain (domain) {
  if (domain == null) return ''
  let d = String(domain).trim()
  if (!d) return ''
  try {
    if (/^https?:\/\//i.test(d)) {
      return new URL(d).host.toLowerCase()
    }
  } catch (e) {}
  return d.split('/')[0].split('?')[0].toLowerCase()
}

function normalizeHeaderEntry (item) {
  return {
    id: (item && item.id) || genHeaderId(),
    key: item && item.key != null ? String(item.key) : '',
    value: item && item.value != null ? String(item.value) : ''
  }
}

function normalizeHeaderScope (scope) {
  const headers = Array.isArray(scope && scope.headers)
    ? scope.headers.map(normalizeHeaderEntry)
    : []
  return {
    id: (scope && scope.id) || genHeaderId(),
    domain: normalizeHeaderDomain(scope && scope.domain),
    headers
  }
}

/** 旧版扁平 list[{domain,key,value}] → 按域名聚合成 scopes */
function migrateFlatListToScopes (list) {
  const order = []
  const byDomain = new Map()
  ;(list || []).forEach((item) => {
    if (!item) return
    const domain = normalizeHeaderDomain(item.domain)
    if (!byDomain.has(domain)) {
      byDomain.set(domain, [])
      order.push(domain)
    }
    byDomain.get(domain).push(normalizeHeaderEntry(item))
  })
  return order.map((domain) => ({
    id: genHeaderId(),
    domain,
    headers: byDomain.get(domain)
  }))
}

/**
 * 规范化请求头配置
 * 新结构：scopes[{ id, domain, headers:[{id,key,value}] }]
 * 兼容：旧扁平 list[{domain,key,value}]；无 domain 视为全局
 */
export function normalizeGlobalHeaders (raw) {
  const base = raw && typeof raw === 'object' ? raw : {}
  let scopes
  if (Array.isArray(base.scopes)) {
    scopes = base.scopes.map(normalizeHeaderScope)
  } else if (Array.isArray(base.list) && base.list.length) {
    const first = base.list[0]
    if (first && Array.isArray(first.headers)) {
      scopes = base.list.map(normalizeHeaderScope)
    } else {
      scopes = migrateFlatListToScopes(base.list)
    }
  } else {
    scopes = []
  }
  return {
    switchOn: !!base.switchOn,
    scopes
  }
}

/** 是否仍为旧结构，需要写回 scopes（面板加载时迁移） */
export function needsGlobalHeadersMigrate (raw) {
  if (!raw || typeof raw !== 'object') return false
  if (Array.isArray(raw.scopes)) return false
  return Object.prototype.hasOwnProperty.call(raw, 'list')
}

/** 有效（key 非空）的请求头条数 */
export function countValidGlobalHeaders (raw) {
  const { scopes } = normalizeGlobalHeaders(raw)
  return scopes.reduce((count, scope) => (
    count + (scope.headers || []).filter((item) => String(item.key || '').trim()).length
  ), 0)
}

/** 全局头开关是否打开（用于工具栏高亮，与工具栏开关一致） */
export function isGlobalHeadersActive (raw) {
  return !!normalizeGlobalHeaders(raw).switchOn
}

/** 工具栏状态文案：关 → OFF；开 → Headers · N（可为 0） */
export function getGlobalHeadersStatusLabel (raw) {
  const conf = normalizeGlobalHeaders(raw)
  if (!conf.switchOn) return 'Headers · OFF'
  return `Headers · ${countValidGlobalHeaders(conf)}`
}

/** 规则所属组是否开启（与 pageScripts isRuleGroupOn 一致） */
export function isRuleGroupOn (rule, groups) {
  const list = groups || []
  const groupId = rule && rule.groupId
  if (!groupId) {
    return !list.length || (list[0] && list[0].switchOn !== false)
  }
  const g = list.find((x) => x && x.id === groupId)
  if (!g) return true
  return g.switchOn !== false
}

/** 实际生效的 Mock 规则条数（规则开关开且所属组未关闭） */
export function countEnabledMockRules (rules, groups) {
  return (rules || []).filter((r) => r && r.switchOn !== false && isRuleGroupOn(r, groups)).length
}

/** 工具栏 Mock 状态文案 */
export function getMockStatusLabel (switchOn, rules, groups) {
  if (!switchOn) return 'Mock · OFF'
  return `Mock · ${countEnabledMockRules(rules, groups)}`
}

function normalizeSlowNetworkScope (scope) {
  const filterType = scope && scope.filterType === 'regex' ? 'regex' : 'normal'
  return {
    id: (scope && scope.id) || genHeaderId(),
    domain: normalizeHeaderDomain(scope && scope.domain),
    match: scope && scope.match != null ? String(scope.match) : '',
    filterType
  }
}

/** 规范化慢网配置（独立于 Mock / 组 / 规则开关） */
export function normalizeSlowNetwork (raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const delayMs = Number(src.delayMs)
  const scopes = Array.isArray(src.scopes)
    ? src.scopes.map(normalizeSlowNetworkScope)
    : []
  return {
    switchOn: !!src.switchOn,
    delayMs: Number.isFinite(delayMs) && delayMs > 0
      ? Math.min(Math.round(delayMs), 60000)
      : DEFAULT_SLOW_NETWORK.delayMs,
    scopes
  }
}

/** 慢网开关是否打开（用于工具栏高亮） */
export function isSlowNetworkActive (raw) {
  return !!normalizeSlowNetwork(raw).switchOn
}

/** 工具栏慢网状态文案：关 → OFF；开 → 慢网 · Ns · M */
export function getSlowNetworkStatusLabel (raw) {
  const conf = normalizeSlowNetwork(raw)
  if (!conf.switchOn) return '慢网 · OFF'
  const sec = Math.max(1, Math.round(conf.delayMs / 1000))
  return `慢网 · ${sec}s · ${conf.scopes.length}`
}

/** 剔除组/规则上旧版 slowNetwork 字段（慢网已独立为全局 scopes） */
function omitLegacySlowNetworkField (item) {
  if (!item || typeof item !== 'object' || !Object.prototype.hasOwnProperty.call(item, 'slowNetwork')) {
    return item
  }
  const next = { ...item }
  delete next.slowNetwork
  return next
}

/**
 * 清理 groups/rules 上残留的 slowNetwork
 * @returns {{ out: object, needsSave: boolean }}
 */
export function stripLegacySlowNetworkFields (raw) {
  const groups = raw.ajaxInterceptor_groups || []
  const rules = raw.ajaxInterceptor_rules || []
  let needsSave = false
  const nextGroups = groups.map((g) => {
    if (!g || !Object.prototype.hasOwnProperty.call(g, 'slowNetwork')) return g
    needsSave = true
    return omitLegacySlowNetworkField(g)
  })
  const nextRules = rules.map((r) => {
    if (!r || !Object.prototype.hasOwnProperty.call(r, 'slowNetwork')) return r
    needsSave = true
    return omitLegacySlowNetworkField(r)
  })
  if (!needsSave) return { out: raw, needsSave: false }
  return {
    out: {
      ...raw,
      ajaxInterceptor_groups: nextGroups,
      ajaxInterceptor_rules: nextRules
    },
    needsSave: true
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
  let result
  if (!Array.isArray(groups) || !groups.length) {
    const defaultId = buildGroupId()
    const withIds = rules.map((r) => ({
      ...r,
      groupId: r.groupId || defaultId,
      key: r.key || buildGroupId()
    }))
    result = {
      out: {
        ...raw,
        ajaxInterceptor_groups: [{ id: defaultId, name: '', domain: '', switchOn: true, expanded: true }],
        ajaxInterceptor_rules: withIds
      },
      needsSave: true
    }
  } else {
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
    result = {
      out: { ...raw, ajaxInterceptor_groups: groups, ajaxInterceptor_rules: withIds },
      needsSave
    }
  }
  const stripped = stripLegacySlowNetworkFields(result.out)
  return {
    out: stripped.out,
    needsSave: result.needsSave || stripped.needsSave
  }
}

export function pickSettingData (source) {
  const data = {}
  STORAGE_KEYS.forEach((key) => {
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      data[key] = source[key]
    }
  })
  return stripLegacySlowNetworkFields(data).out
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
  if (picked.ajaxInterceptor_globalHeaders) {
    picked.ajaxInterceptor_globalHeaders = normalizeGlobalHeaders(picked.ajaxInterceptor_globalHeaders)
  }
  if (picked.ajaxInterceptor_slowNetwork) {
    picked.ajaxInterceptor_slowNetwork = normalizeSlowNetwork(picked.ajaxInterceptor_slowNetwork)
  }

  const merged = { ...DEFAULT_SETTING, ...picked }
  merged.ajaxInterceptor_globalHeaders = normalizeGlobalHeaders(merged.ajaxInterceptor_globalHeaders)
  merged.ajaxInterceptor_slowNetwork = normalizeSlowNetwork(merged.ajaxInterceptor_slowNetwork)
  return merged
}
