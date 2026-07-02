import React from 'react'
import { Switch, Button, Icon } from 'antd'

export default function MainToolbar ({
  switchOn,
  expandAllActive,
  showRefreshTip,
  onSwitchChange,
  onExpandCollapseAll,
  onAddGroup,
  onOpenSettings,
  onExportBackup,
  onImportBackup
}) {
  return (
    <div className="main-toolbar-inner">
      <div className="main-toolbar-left">
        <span
          className="toolbar-expand-label"
          title={expandAllActive ? '收起所有组与规则' : '展开所有组与规则'}
        >
          全部展开
        </span>
        <Switch
          size="small"
          checked={expandAllActive}
          onChange={onExpandCollapseAll}
          disabled={!switchOn}
          title={expandAllActive ? '收起所有组与规则' : '展开所有组与规则'}
        />
        <Switch
          style={{ marginLeft: 6 }}
          checked={switchOn}
          onChange={onSwitchChange}
        />
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
          disabled={!switchOn}
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
