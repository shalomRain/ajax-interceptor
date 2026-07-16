import React from 'react'
import { Input, Button, Switch, Icon } from 'antd'
import { buildUUID } from '../utils/mainHelpers'

export default function GlobalHeadersEditor ({ value, onChange }) {
  const switchOn = !!(value && value.switchOn)
  const list = (value && Array.isArray(value.list)) ? value.list : []

  const emit = (next) => {
    onChange && onChange(next)
  }

  const handleSwitch = (checked) => {
    emit({ ...value, switchOn: checked, list })
  }

  const handleFieldChange = (index, field, nextValue) => {
    const nextList = list.map((row, i) => (
      i === index ? { ...row, [field]: nextValue } : row
    ))
    emit({ ...value, switchOn, list: nextList })
  }

  const handleAdd = () => {
    emit({
      ...value,
      switchOn,
      list: [...list, { id: buildUUID(), key: '', value: '' }]
    })
  }

  const handleRemove = (index) => {
    emit({
      ...value,
      switchOn,
      list: list.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="global-headers-editor">
      <div className="global-headers-editor-title">
        <span>Global Request Headers</span>
        <Switch
          size="small"
          checked={switchOn}
          onChange={handleSwitch}
          checkedChildren="ON"
          unCheckedChildren="OFF"
        />
      </div>
      <div className="global-headers-editor-hint">
        Independent of Mock. When enabled, headers apply to all XHR/fetch requests. Per-rule Advanced headers can override the same keys.
      </div>
      {list.map((row, index) => (
        <div className="global-headers-row" key={row.id || index}>
          <Input
            placeholder="Header Key"
            value={row.key}
            onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
          />
          <Input
            placeholder="Header Value"
            value={row.value}
            onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
          />
          <Button
            type="danger"
            ghost
            size="small"
            onClick={() => handleRemove(index)}
            title="Remove"
          >
            <Icon type="minus" />
          </Button>
        </div>
      ))}
      <Button type="dashed" size="small" block onClick={handleAdd} className="global-headers-add-btn">
        <Icon type="plus" /> Add Header
      </Button>
    </div>
  )
}
