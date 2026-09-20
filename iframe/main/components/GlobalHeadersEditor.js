import React from 'react'
import { Input, Button, Icon } from 'antd'
import { buildUUID, normalizeGroupDomain } from '../utils/mainHelpers'

function createEmptyHeader () {
  return { id: buildUUID(), key: '', value: '' }
}

function createEmptyScope (domain = '') {
  return {
    id: buildUUID(),
    domain,
    headers: [createEmptyHeader()]
  }
}

export default function GlobalHeadersEditor ({ value, onChange }) {
  const switchOn = !!(value && value.switchOn)
  const scopes = (value && Array.isArray(value.scopes)) ? value.scopes : []

  const emit = (nextScopes) => {
    onChange && onChange({ ...value, switchOn, scopes: nextScopes })
  }

  const updateScope = (scopeIndex, patch) => {
    emit(scopes.map((scope, i) => (
      i === scopeIndex ? { ...scope, ...patch } : scope
    )))
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

  const handleHeaderChange = (scopeIndex, headerIndex, field, nextValue) => {
    const scope = scopes[scopeIndex]
    if (!scope) return
    const headers = (scope.headers || []).map((row, i) => (
      i === headerIndex ? { ...row, [field]: nextValue } : row
    ))
    updateScope(scopeIndex, { headers })
  }

  const handleAddHeader = (scopeIndex) => {
    const scope = scopes[scopeIndex]
    if (!scope) return
    updateScope(scopeIndex, {
      headers: [...(scope.headers || []), createEmptyHeader()]
    })
  }

  const handleRemoveHeader = (scopeIndex, headerIndex) => {
    const scope = scopes[scopeIndex]
    if (!scope) return
    const headers = (scope.headers || []).filter((_, i) => i !== headerIndex)
    updateScope(scopeIndex, {
      headers: headers.length ? headers : [createEmptyHeader()]
    })
  }

  const handleAddScope = (domain = '') => {
    emit([...scopes, createEmptyScope(domain)])
  }

  const handleRemoveScope = (scopeIndex) => {
    emit(scopes.filter((_, i) => i !== scopeIndex))
  }

  return (
    <div className="global-headers-editor">
      <div className="global-headers-editor-hint">
        独立于 Mock。按作用域配置：域名留空=全局；填写后仅该 host。同名 key：域名级覆盖全局。单接口 Advanced 改头优先级更高。
      </div>

      {scopes.length === 0 && (
        <div className="global-headers-empty">
          暂无请求头，先添加一个作用域
        </div>
      )}

      {scopes.map((scope, scopeIndex) => {
        const domain = scope.domain || ''
        const isGlobal = !domain.trim()
        const headers = Array.isArray(scope.headers) ? scope.headers : []
        return (
          <div className="global-headers-scope" key={scope.id || scopeIndex}>
            <div className="global-headers-scope-head">
              <span className={`global-headers-scope-badge${isGlobal ? ' is-global' : ''}`}>
                {isGlobal ? '全局' : '域名'}
              </span>
              <Input
                className="global-headers-scope-domain"
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
                className="global-headers-row-action"
              >
                <Icon type="delete" />
              </Button>
            </div>

            <div className="global-headers-row global-headers-row-head">
              <span>Header Key</span>
              <span>Header Value</span>
              <span className="global-headers-row-action" />
            </div>

            {headers.map((row, headerIndex) => (
              <div className="global-headers-row" key={row.id || headerIndex}>
                <Input
                  placeholder="Header Key"
                  value={row.key}
                  onChange={(e) => handleHeaderChange(scopeIndex, headerIndex, 'key', e.target.value)}
                />
                <Input
                  placeholder="Header Value"
                  value={row.value}
                  onChange={(e) => handleHeaderChange(scopeIndex, headerIndex, 'value', e.target.value)}
                />
                <Button
                  type="danger"
                  ghost
                  size="small"
                  title="删除"
                  onClick={() => handleRemoveHeader(scopeIndex, headerIndex)}
                  className="global-headers-row-action"
                >
                  <Icon type="minus" />
                </Button>
              </div>
            ))}

            <Button
              type="dashed"
              size="small"
              onClick={() => handleAddHeader(scopeIndex)}
              className="global-headers-add-header-btn"
            >
              <Icon type="plus" /> 添加请求头
            </Button>
          </div>
        )
      })}

      <Button
        type="dashed"
        size="small"
        block
        onClick={() => handleAddScope('')}
        className="global-headers-add-btn"
      >
        <Icon type="plus" /> 添加作用域
      </Button>
    </div>
  )
}
