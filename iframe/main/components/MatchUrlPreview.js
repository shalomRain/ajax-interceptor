import React, { useEffect, useState } from 'react'
import { buildRuleMatchUrlDisplay } from '../utils/mainHelpers'
import { PREVIEW_UPDATE_EVENT } from '../utils/previewUpdate'

/** 弱化预览：默认一行截断，悬停看全文；无匹配内容时不渲染 */
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
      className="match-url-preview match-url-preview--muted"
      title={`匹配范围示意：${text}`}
    >
      <span className="match-url-preview-tag">匹配</span>
      <span className="match-url-preview-body">{text}</span>
    </div>
  )
}
