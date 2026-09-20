import React from 'react'
import { Icon, Dropdown, Menu } from 'antd'
import { getScrollPopupContainer } from '../utils/mainHelpers'

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
  slowNetworkOn,
  slowNetworkLabel,
  onToggleMock,
  onAddGroup,
  onToggleGlobalHeaders,
  onOpenGlobalHeaders,
  onToggleSlowNetwork,
  onOpenSlowNetwork,
  onOpenSettings,
  onExportBackup,
  onImportBackup
}) {
  const toolsMenu = (
    <Menu
      onClick={({ key }) => {
        if (key === 'export') onExportBackup()
        if (key === 'import') onImportBackup()
        if (key === 'settings') onOpenSettings()
      }}
    >
      <Menu.Item key="export">
        <Icon type="upload" /> 导出备份
      </Menu.Item>
      <Menu.Item key="import">
        <Icon type="download" /> 导入备份
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="settings">
        <Icon type="setting" /> 面板设置
      </Menu.Item>
    </Menu>
  )

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
        <CapabilityButton
          isOn={slowNetworkOn}
          label={slowNetworkLabel}
          statusTitle="慢网：点击开关。按作用域延迟请求（独立于 Mock）"
          addTitle="配置慢网"
          onToggle={onToggleSlowNetwork}
          onAdd={onOpenSlowNetwork}
        />
      </div>
      <div className="main-toolbar-right">
        <Dropdown
          overlay={toolsMenu}
          trigger={['click']}
          placement="bottomRight"
          getPopupContainer={getScrollPopupContainer}
        >
          <button type="button" className="toolbar-tools-btn" title="备份与设置">
            <Icon type="ellipsis" />
            <span>更多</span>
          </button>
        </Dropdown>
      </div>
    </div>
  )
}
