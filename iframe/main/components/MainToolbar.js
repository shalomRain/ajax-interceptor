import React from 'react'
import { Icon, Dropdown, Menu } from 'antd'

function CapabilityButton ({
  isOn,
  label,
  toggleTitle,
  configTitle,
  onToggle,
  onConfig
}) {
  return (
    <div className={`toolbar-capability${isOn ? ' is-on' : ''}`}>
      <button
        type="button"
        className="toolbar-capability-toggle"
        title={toggleTitle}
        onClick={onToggle}
      >
        <Icon type={isOn ? 'check-circle' : 'close-circle'} />
      </button>
      <button
        type="button"
        className="toolbar-capability-status"
        title={configTitle}
        onClick={onConfig}
      >
        <Icon type="plus" />
        <span>{label}</span>
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
          toggleTitle="Mock：点击开关。开启后按规则改写匹配到的接口响应"
          configTitle="新建组"
          onToggle={onToggleMock}
          onConfig={onAddGroup}
        />
        <CapabilityButton
          isOn={globalHeadersOn}
          label={globalHeadersLabel}
          toggleTitle="请求头：点击开关。可按域名或全局注入请求头"
          configTitle="配置请求头"
          onToggle={onToggleGlobalHeaders}
          onConfig={onOpenGlobalHeaders}
        />
        <CapabilityButton
          isOn={slowNetworkOn}
          label={slowNetworkLabel}
          toggleTitle="慢网：点击开关。按作用域延迟请求（独立于 Mock）"
          configTitle="配置慢网"
          onToggle={onToggleSlowNetwork}
          onConfig={onOpenSlowNetwork}
        />
      </div>
      <div className="main-toolbar-right">
        <Dropdown overlay={toolsMenu} trigger={['click']} placement="bottomRight">
          <button type="button" className="toolbar-tools-btn" title="备份与设置">
            <Icon type="ellipsis" />
            <span>更多</span>
          </button>
        </Dropdown>
      </div>
    </div>
  )
}
