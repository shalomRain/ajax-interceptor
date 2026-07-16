import React from 'react'
import { Button, Icon } from 'antd'

export default function MainToolbar ({
  mockOn,
  mockLabel,
  globalHeadersOn,
  globalHeadersLabel,
  onToggleMock,
  onOpenGlobalHeaders,
  onOpenSettings,
  onExportBackup,
  onImportBackup,
  onAddGroup
}) {
  return (
    <div className="main-toolbar-inner">
      <div className="main-toolbar-left">
        <button
          type="button"
          className={`toolbar-capability-status${mockOn ? ' is-on' : ''}`}
          title="Mock：点击开关。开启后按规则改写匹配到的接口响应"
          onClick={onToggleMock}
        >
          {mockLabel}
        </button>
        <button
          type="button"
          className={`toolbar-capability-status${globalHeadersOn ? ' is-on' : ''}`}
          title="全局请求头：点击配置。仅在开启且有有效条目时生效"
          onClick={onOpenGlobalHeaders}
        >
          {globalHeadersLabel}
        </button>
      </div>
      <div className="main-toolbar-right">
        <Button
          type="primary"
          shape="circle"
          icon="plus"
          size="small"
          title="新建组"
          onClick={onAddGroup}
          style={{ float: 'right', marginRight: 10, marginTop: 1 }}
        />
        <Icon
          type="upload"
          title="导出备份"
          style={{ fontSize: '20px', color: '#1890ff', cursor: 'pointer', float: 'right' }}
          onClick={onExportBackup}
        />
        <Icon
          type="download"
          title="导入备份"
          style={{ fontSize: '20px', color: '#1890ff', cursor: 'pointer', float: 'right' }}
          onClick={onImportBackup}
        />
        <Icon
          type="setting"
          title="设置"
          style={{ fontSize: '22px', color: '#1890ff', cursor: 'pointer', float: 'right' }}
          onClick={onOpenSettings}
        />
      </div>
    </div>
  )
}
