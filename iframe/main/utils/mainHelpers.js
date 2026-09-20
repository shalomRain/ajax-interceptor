export const buildUUID = () => {
  var dt = new Date().getTime()
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)
    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
  return uuid
}

export function normalizeGroupDomain (domain) {
  if (!domain || typeof domain !== 'string') return ''
  let d = domain.trim()
  if (!d) return ''
  try {
    if (/^https?:\/\//i.test(d)) {
      return new URL(d).host.toLowerCase()
    }
  } catch (e) {}
  return d.split('/')[0].split('?')[0].toLowerCase()
}

/** 域名 + 路径，自动补全中间的 /（与 pageScripts 中逻辑保持一致） */
export function joinDomainAndPath (domain, path) {
  const host = normalizeGroupDomain(domain)
  const p = (path || '').trim()
  if (!host) return p
  if (!p) return host
  const pathPart = p.startsWith('/') ? p : `/${p}`
  return `${host}${pathPart}`
}

/**
 * 展示与实际拦截逻辑一致的匹配说明（pageScripts matchUrlScope）
 * - 路径 match 必填，仅填域名不会拦截
 * - 无域名：任意 host，路径在 pathname（及完整 URL）上包含匹配
 * - 有域名：host / hostname 一致，再匹配路径
 */
export function buildRuleMatchUrlDisplay (match, groupDomain = '', filterType = 'normal') {
  const m = (match || '').trim()
  const domain = normalizeGroupDomain(groupDomain)

  if (!m && !domain) return ''

  if (!m && domain) {
    return `https://${domain}/* — 未填写路径，当前规则不会拦截（路径为必填）`
  }

  if (filterType === 'regex') {
    if (domain) {
      return `https://${domain}/* — 路径正则 /${m}/i`
    }
    return `任意域名 — 完整 URL 正则 /${m}/i`
  }

  try {
    // eslint-disable-next-line no-new
    new URL(m)
    return m
  } catch (e) {}

  if (domain) {
    return `https://${joinDomainAndPath(domain, m)}`
  }

  const pathShow = m.startsWith('/') ? m : `/${m}`
  return `任意域名 — URL 包含路径片段「${pathShow}」`
}

/** Dropdown 挂到触发按钮所在的滚动容器，避免滚动时菜单与按钮脱节 */
export function getScrollPopupContainer (triggerNode) {
  let el = triggerNode
  while (el && el !== document.documentElement) {
    if (el.nodeType === 1) {
      const { overflow, overflowY } = window.getComputedStyle(el)
      if (/(auto|scroll|overlay)/.test(overflowY) || /(auto|scroll|overlay)/.test(overflow)) {
        return el
      }
    }
    el = el.parentElement
  }
  return document.getElementById('main') || document.body
}
