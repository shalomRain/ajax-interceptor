import React from 'react'
import { Icon } from 'antd'

function CapabilityButton ({
  isOn,
  label,
  statusTitle,
  addTitle,
  onToggle,
  onAdd
}) {
  return (
    <div className={`toolbar-capability${isOn ? ' is-on' : ''}`}>
      <button
        type="button"
        className="toolbar-capability-add"
        title={addTitle}
        onClick={onAdd}
      >
        <Icon type="plus" />
      </button>
      <button
        type="button"
        className="toolbar-capability-status"
        title={statusTitle}
        onClick={onToggle}
      >
        {label}
      </button>
    </div>
  )
}

function SlowNetworkControl ({
  isOn,
  label,
  delaySec,
  onToggle,
  onDelaySecChange
}) {
  return (
    <div className="toolbar-slow-network">
      <div className={`toolbar-capability${isOn ? ' is-on' : ''}`}>
        <button
          type="button"
          className="toolbar-capability-status"
          title="慢网：开启后，命中 Mock 的接口在返回前额外延迟（用于验证弱网）"
          onClick={onToggle}
        >
          {label}
        </button>
      </div>
      {isOn && (
        <label className="toolbar-slow-delay-wrap" title="延迟秒数（1–60）">
          <input
            className="toolbar-slow-delay"
            type="number"
            min={1}
            max={60}
            step={1}
            value={delaySec}
            onChange={(e) => onDelaySecChange(e.target.value)}
          />
          <span className="toolbar-slow-delay-unit">秒</span>
        </label>
      )}
    </div>
  )
}

export default function MainToolbar ({
  mockOn,
  mockLabel,
  globalHeadersOn,
  globalHeadersLabel,
  slowNetworkOn,
  slowNetworkLabel,
  slowNetworkDelaySec,
  onToggleMock,
  onAddGroup,
  onToggleGlobalHeaders,
  onOpenGlobalHeaders,
  onToggleSlowNetwork,
  onSlowNetworkDelaySecChange,
  onOpenSettings,
  onExportBackup,
  onImportBackup
}) {
  return (
    <div className="main-toolbar-inner">
      <div className="main-toolbar-left">
        <CapabilityButton
          isOn={mockOn}
          label={mockLabel}
          statusTitle="Mock：点击开关。开启后按规则改写匹配到的接口响应"
          addTitle="新建组"
          onToggle={onToggleMock}
          onAdd={onAddGroup}
        />
        <CapabilityButton
          isOn={globalHeadersOn}
          label={globalHeadersLabel}
          statusTitle="请求头：点击开关。可按域名或全局注入请求头"
          addTitle="配置请求头"
          onToggle={onToggleGlobalHeaders}
          onAdd={onOpenGlobalHeaders}
        />
        <SlowNetworkControl
          isOn={slowNetworkOn}
          label={slowNetworkLabel}
          delaySec={slowNetworkDelaySec}
          onToggle={onToggleSlowNetwork}
          onDelaySecChange={onSlowNetworkDelaySecChange}
        />
      </div>
      <div className="main-toolbar-right">
        <Icon
          type="upload"
          title="导出备份"
          style={{ fontSize: '20px', color: '#1890ff', cursor: 'pointer' }}
          onClick={onExportBackup}
        />
        <Icon
          type="download"
          title="导入备份"
          style={{ fontSize: '20px', color: '#1890ff', cursor: 'pointer' }}
          onClick={onImportBackup}
        />
        <Icon
          type="setting"
          title="设置"
          style={{ fontSize: '22px', color: '#1890ff', cursor: 'pointer' }}
          onClick={onOpenSettings}
        />
      </div>
    </div>
  )
}
