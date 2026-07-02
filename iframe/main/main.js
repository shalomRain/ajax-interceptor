import React, { Component } from 'react'
import 'antd/dist/antd.css'
import { addExtensionMessageListener, sendToExtensionRuntime } from './extensionApi'
import { bindMainHandlers } from './mainHandlers'
import MainToolbar from './components/MainToolbar'
import MainGroups from './components/MainGroups'
import MainModals from './components/MainModals'
import './Main.less'

export default class Main extends Component {
  constructor () {
    super()
    bindMainHandlers(this)

    addExtensionMessageListener(({ type, to, contentScriptLoaded = false, showFreshTip = false }) => {
      if (type === 'ajaxInterceptor' && to === 'iframe') {
        if (contentScriptLoaded || showFreshTip) {
          this.setState({ showRefreshTip: showFreshTip })
        }
      }
    })

    sendToExtensionRuntime({
      type: 'ajaxInterceptor',
      to: 'background',
      iframeScriptLoaded: true
    })
  }

  state = {
    settingModalVisible: false,
    imageModalVisible: false,
    infoModalVisible: false,
    positionClass: 'suspend',
    customFunction: {
      panelPosition: 0
    },
    showRefreshTip: false,
    settingsRevision: 0
  }

  updateAddBtnTop_interval = () => {}

  componentWillUnmount () {
    clearTimeout(this._persistGroupsTimeout)
    clearTimeout(this._persistRulesDebounce)
    clearTimeout(this._persistLabelDebounce)
    clearTimeout(this.forceUpdateTimeout)
  }

  render () {
    const switchOn = window.setting.ajaxInterceptor_switchOn
    return (
      <div className="ajax-modifier-main">
        <input
          ref={(el) => { this._importFileInput = el }}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={this.handleImportBackupFile}
        />
        <MainToolbar
          switchOn={switchOn}
          showRefreshTip={this.state.showRefreshTip}
          onSwitchChange={this.handleSwitchChange}
          onAddGroup={this.handleAddGroup}
          onOpenSettings={this.showSettingModal}
          onExportBackup={this.handleExportBackup}
          onImportBackup={this.handleImportBackupClick}
        />
        <div className={switchOn ? 'setting-body' : 'setting-body setting-body-hidden'}>
          <MainGroups
            key={this.state.settingsRevision}
            settingsRevision={this.state.settingsRevision}
            switchOn={switchOn}
            groups={window.setting.ajaxInterceptor_groups}
            rules={window.setting.ajaxInterceptor_rules}
            onGroupNameChange={this.handleGroupNameChange}
            onGroupDomainChange={this.handleGroupDomainChange}
            onFlushGroupsToStorage={this.flushGroupsToStorage}
            onGroupSwitchChange={this.handleGroupSwitchChange}
            onAddRuleInGroup={this.handleClickAddInGroup}
            onRemoveGroup={this.handleRemoveGroup}
            onGroupReorder={this.handleGroupReorder}
            onCollapseChange={this.handleCollaseChange}
            onLabelChange={this.handleLabelChange}
            onLimitMethodChange={this.handleLimitMethodChange}
            onFilterTypeChange={this.handleFilterTypeChange}
            onMatchChange={this.handleMatchChange}
            onRuleSwitchChange={this.handleSingleSwitchChange}
            onDuplicateRule={this.handleClickDuplicateRule}
            onRemoveRule={this.handleClickRemove}
            set={this.set}
            updateAddBtnTop_interval={this.updateAddBtnTop_interval}
          />
        </div>
        <MainModals
          settingModalVisible={this.state.settingModalVisible}
          infoModalVisible={this.state.infoModalVisible}
          imageModalVisible={this.state.imageModalVisible}
          customFunction={this.state.customFunction}
          positionClass={this.state.positionClass}
          onSettingCancel={this.handleSettingModalCancel}
          onSettingConfirm={this.handleSettingModalConfirm}
          onPositionChange={this.handlePositionChange}
          onShowImageModal={this.showImageModal}
          onImageModalClose={this.handleImageModalClose}
          onInfoModalClose={this.handleInfoModalClose}
        />
      </div>
    )
  }
}
