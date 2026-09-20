import React from 'react'
import { Input, Button, Icon, Select, InputNumber } from 'antd'
import { buildUUID, normalizeGroupDomain } from '../utils/mainHelpers'

function createEmptyScope (domain = '') {
  return {
    id: buildUUID(),
    domain,
    match: '',
    filterType: 'normal'
  }
}

export default function SlowNetworkEditor ({ value, onChange }) {
  const switchOn = !!(value && value.switchOn)
  const delayMs = value && value.delayMs > 0 ? value.delayMs : 3000
  const delaySec = Math.max(1, Math.round(delayMs / 1000))
  const scopes = (value && Array.isArray(value.scopes)) ? value.scopes : []

  const emit = (patch) => {
    onChange && onChange({
      switchOn,
      delayMs,
      scopes,
      ...patch
    })
  }

  const emitScopes = (nextScopes) => {
    emit({ scopes: nextScopes })
  }

  const updateScope = (scopeIndex, patch) => {
    emitScopes(scopes.map((scope, i) => (
      i === scopeIndex ? { ...scope, ...patch } : scope
    )))
  }

  const handleDelaySecChange = (sec) => {
    const n = Number(sec)
    const nextMs = (!Number.isFinite(n) || n <= 0)
      ? 3000
      : Math.min(Math.round(n * 1000), 60000)
    emit({ delayMs: nextMs })
  }

  const handleDomainChange = (scopeIndex, nextDomain) => {
    updateScope(scopeIndex, { domain: nextDomain })
  }

  const handleDomainBlur = (scopeIndex) => {
    const scope = scopes[scopeIndex]
    if (!scope) return
    const normalized = normalizeGroupDomain(scope.domain)
    if (normalized === (scope.domain || '')) return
    updateScope(scopeIndex, { domain: normalized })
  }

  const handleAddScope = () => {
    emitScopes([...scopes, createEmptyScope('')])
  }

  const handleRemoveScope = (scopeIndex) => {
    emitScopes(scopes.filter((_, i) => i !== scopeIndex))
  }

  return (
    <div className="slow-network-editor">
      <div className="slow-network-editor-hint">
        独立于 Mock。匹配的是 Network 里那条请求的 URL（不是地址栏）。域名留空=所有域名；路径留空=该域名下全部请求。延迟加在真正发出请求之前，页面和 Network 都会等到延迟结束。组/接口开关不影响慢网。
      </div>

      <div className="slow-network-delay-row">
        <span className="slow-network-delay-label">延迟时间</span>
        <InputNumber
          min={1}
          max={60}
          step={1}
          value={delaySec}
          onChange={handleDelaySecChange}
        />
        <span className="slow-network-delay-unit">秒（1–60）</span>
      </div>

      {scopes.length === 0 && (
        <div className="slow-network-empty">
          暂无作用域。添加后开启慢网，命中的请求才会延迟。
        </div>
      )}

      {scopes.map((scope, scopeIndex) => {
        const domain = scope.domain || ''
        const isGlobal = !domain.trim()
        const match = scope.match || ''
        const filterType = scope.filterType === 'regex' ? 'regex' : 'normal'
        const badgeText = !domain.trim() && !match.trim()
          ? '全站'
          : (isGlobal ? '路径' : '域名')
        return (
          <div className="slow-network-scope" key={scope.id || scopeIndex}>
            <div className="slow-network-scope-head">
              <span className={`slow-network-scope-badge${!domain.trim() ? ' is-global' : ''}`}>
                {badgeText}
              </span>
              <Input
                className="slow-network-scope-domain"
                placeholder="留空=所有域名；如 api.example.com"
                value={domain}
                onChange={(e) => handleDomainChange(scopeIndex, e.target.value)}
                onBlur={() => handleDomainBlur(scopeIndex)}
              />
              <Button
                type="danger"
                ghost
                size="small"
                title="删除此作用域"
                onClick={() => handleRemoveScope(scopeIndex)}
                className="slow-network-row-action"
              >
                <Icon type="delete" />
              </Button>
            </div>

            <div className="slow-network-match-row">
              <Select
                size="small"
                value={filterType}
                style={{ width: 100 }}
                onChange={(val) => updateScope(scopeIndex, { filterType: val })}
              >
                <Select.Option value="normal">normal</Select.Option>
                <Select.Option value="regex">regex</Select.Option>
              </Select>
              <Input
                placeholder={filterType === 'regex' ? '路径正则，留空=全部' : '路径包含匹配，留空=全部'}
                value={match}
                onChange={(e) => updateScope(scopeIndex, { match: e.target.value })}
              />
            </div>
          </div>
        )
      })}

      <Button
        type="dashed"
        size="small"
        block
        onClick={handleAddScope}
        className="slow-network-add-btn"
      >
        <Icon type="plus" /> 添加作用域
      </Button>
    </div>
  )
}
