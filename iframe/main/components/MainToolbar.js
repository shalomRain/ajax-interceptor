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

export default function MainToolbar ({
  mockOn,
  mockLabel,
  globalHeadersOn,
  globalHeadersLabel,
  onToggleMock,
  onAddGroup,
  onToggleGlobalHeaders,
  onOpenGlobalHeaders,
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
