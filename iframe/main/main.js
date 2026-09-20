import React, { Component } from 'react'
import 'antd/dist/antd.css'
import { addExtensionMessageListener, sendToExtensionRuntime } from './extensionApi'
import { bindMainHandlers } from './mainHandlers'
import MainToolbar from './components/MainToolbar'
import MainGroups from './components/MainGroups'
import MainModals from './components/MainModals'
import {
  getGlobalHeadersStatusLabel,
  getMockStatusLabel,
  getSlowNetworkStatusLabel,
  isGlobalHeadersActive,
  isSlowNetworkActive,
  normalizeGlobalHeaders,
  normalizeSlowNetwork
} from './utils/settingStorage'
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
    globalHeadersModalVisible: false,
    slowNetworkModalVisible: false,
    imageModalVisible: false,
    infoModalVisible: false,
    positionClass: 'suspend',
    customFunction: {
      panelPosition: 0
    },
    globalHeaders: {
      switchOn: false,
      scopes: []
    },
    slowNetwork: {
      switchOn: false,
      delayMs: 3000,
      scopes: []
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
    const mockOn = !!window.setting.ajaxInterceptor_switchOn
    const rules = window.setting.ajaxInterceptor_rules || []
    const groups = window.setting.ajaxInterceptor_groups || []
    const savedGlobalHeaders = normalizeGlobalHeaders(window.setting.ajaxInterceptor_globalHeaders)
    const globalHeadersOn = isGlobalHeadersActive(savedGlobalHeaders)
    const savedSlowNetwork = normalizeSlowNetwork(window.setting.ajaxInterceptor_slowNetwork)
    const slowNetworkOn = isSlowNetworkActive(savedSlowNetwork)
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
          mockOn={mockOn}
          mockLabel={getMockStatusLabel(mockOn, rules, groups)}
          globalHeadersOn={globalHeadersOn}
          globalHeadersLabel={getGlobalHeadersStatusLabel(savedGlobalHeaders)}
          slowNetworkOn={slowNetworkOn}
          slowNetworkLabel={getSlowNetworkStatusLabel(savedSlowNetwork)}
          onToggleMock={this.handleSwitchChange}
          onAddGroup={this.handleAddGroup}
          onToggleGlobalHeaders={this.handleGlobalHeadersSwitchChange}
          onOpenGlobalHeaders={this.showGlobalHeadersModal}
          onToggleSlowNetwork={this.handleSlowNetworkSwitchChange}
          onOpenSlowNetwork={this.showSlowNetworkModal}
          onOpenSettings={this.showSettingModal}
          onExportBackup={this.handleExportBackup}
          onImportBackup={this.handleImportBackupClick}
        />
        {this.state.showRefreshTip && (
          <div className="toolbar-refresh-tip">请刷新业务页面使配置生效</div>
        )}
        <div className="setting-body">
          <MainGroups
            key={this.state.settingsRevision}
            settingsRevision={this.state.settingsRevision}
            switchOn={mockOn}
            expandAllActive={this.isAllExpanded()}
            onExpandCollapseAll={this.handleExpandCollapseAll}
            groups={window.setting.ajaxInterceptor_groups}
            rules={window.setting.ajaxInterceptor_rules}
            onGroupNameChange={this.handleGroupNameChange}
            onGroupDomainChange={this.handleGroupDomainChange}
            onFlushGroupsToStorage={this.flushGroupsToStorage}
            onGroupSwitchChange={this.handleGroupSwitchChange}
            onAddRuleInGroup={this.handleClickAddInGroup}
            onRemoveGroup={this.handleRemoveGroup}
            onGroupReorder={this.handleGroupReorder}
            onGroupExpandedChange={this.handleGroupExpandedChange}
            onGroupRulesCollapseChange={this.handleGroupRulesCollapseChange}
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
          globalHeadersModalVisible={this.state.globalHeadersModalVisible}
          slowNetworkModalVisible={this.state.slowNetworkModalVisible}
          infoModalVisible={this.state.infoModalVisible}
          imageModalVisible={this.state.imageModalVisible}
          customFunction={this.state.customFunction}
          globalHeaders={this.state.globalHeaders}
          slowNetwork={this.state.slowNetwork}
          positionClass={this.state.positionClass}
          onSettingCancel={this.handleSettingModalCancel}
          onSettingConfirm={this.handleSettingModalConfirm}
          onPositionChange={this.handlePositionChange}
          onGlobalHeadersChange={this.handleGlobalHeadersChange}
          onGlobalHeadersCancel={this.handleGlobalHeadersCancel}
          onGlobalHeadersConfirm={this.handleGlobalHeadersConfirm}
          onSlowNetworkChange={this.handleSlowNetworkChange}
          onSlowNetworkCancel={this.handleSlowNetworkCancel}
          onSlowNetworkConfirm={this.handleSlowNetworkConfirm}
          onShowImageModal={this.showImageModal}
          onImageModalClose={this.handleImageModalClose}
          onInfoModalClose={this.handleInfoModalClose}
        />
      </div>
    )
  }
}
