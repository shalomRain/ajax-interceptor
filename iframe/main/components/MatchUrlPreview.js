import React, { useEffect, useState } from 'react'
import { buildRuleMatchUrlDisplay } from '../utils/mainHelpers'
import { PREVIEW_UPDATE_EVENT } from '../utils/previewUpdate'

export default function MatchUrlPreview ({ groupId, ruleIndex, settingsRevision }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const onUpdate = () => setTick((n) => n + 1)
    window.addEventListener(PREVIEW_UPDATE_EVENT, onUpdate)
    return () => window.removeEventListener(PREVIEW_UPDATE_EVENT, onUpdate)
  }, [])

  useEffect(() => {
    setTick((n) => n + 1)
  }, [settingsRevision])

  const group = (window.setting.ajaxInterceptor_groups || []).find((g) => g.id === groupId)
  const rule = (window.setting.ajaxInterceptor_rules || [])[ruleIndex]
  const text = buildRuleMatchUrlDisplay(
    rule && rule.match,
    group && group.domain,
    (rule && rule.filterType) || 'normal'
  )

  if (!text) return null

  return (
    <div
      className="match-url-preview match-url-preview--in-header"
      title="与实际拦截逻辑一致的匹配范围示意（非 DevTools Network 里看到的原始响应）"
    >
      <div className="match-url-preview-body">{text}</div>
    </div>
  )
}
