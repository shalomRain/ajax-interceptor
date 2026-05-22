import { Modal, message } from 'antd'
import { sendToExtensionRuntime, getChromeStorageLocal } from './extensionApi'
import { buildUUID } from './utils/mainHelpers'
import { notifyMatchUrlPreviewUpdate } from './utils/previewUpdate'
import {
  STORAGE_KEYS,
  buildBackupPayload,
  parseBackupFile,
  ensureGroupsMigrated,
  pickSettingData
} from './utils/settingStorage'

export const mainHandlerMethods = {
  set (key, value) {
    sendToExtensionRuntime({ type: 'ajaxInterceptor', to: 'background', key, value })
    const local = getChromeStorageLocal()
    if (local) {
      local.set({ [key]: value })
    }
  },

  forceUpdateDebouce () {
    clearTimeout(this.forceUpdateTimeout)
    this.forceUpdateTimeout = setTimeout(() => {
      this.forceUpdate()
    }, 1000)
  },

  handleSingleSwitchChange (switchOn, i) {
    window.setting.ajaxInterceptor_rules[i].switchOn = switchOn
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
    this.forceUpdateDebouce()
  },

  handleLimitMethodChange (val, i) {
    window.setting.ajaxInterceptor_rules[i].limitMethod = val
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
    this.forceUpdate()
  },

  handleFilterTypeChange (val, i) {
    window.setting.ajaxInterceptor_rules[i].filterType = val
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
    notifyMatchUrlPreviewUpdate()
    this.forceUpdate()
  },

  handleMatchChange (e, i) {
    window.setting.ajaxInterceptor_rules[i].match = e.target.value
    notifyMatchUrlPreviewUpdate()
    clearTimeout(this._persistRulesDebounce)
    this._persistRulesDebounce = setTimeout(() => {
      this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
    }, 300)
  },

  handleLabelChange (e, i) {
    window.setting.ajaxInterceptor_rules[i].label = e.target.value
    clearTimeout(this._persistLabelDebounce)
    this._persistLabelDebounce = setTimeout(() => {
      this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
    }, 300)
  },

  flushGroupsToStorage () {
    clearTimeout(this._persistGroupsTimeout)
    this.set('ajaxInterceptor_groups', window.setting.ajaxInterceptor_groups)
  },

  handleGroupNameChange (e, groupId) {
    const g = window.setting.ajaxInterceptor_groups.find((x) => x.id === groupId)
    if (g) g.name = e.target.value
    this.forceUpdate()
    clearTimeout(this._persistGroupsTimeout)
    this._persistGroupsTimeout = setTimeout(this.flushGroupsToStorage, 300)
  },

  handleGroupSwitchChange (switchOn, groupId) {
    const g = window.setting.ajaxInterceptor_groups.find((x) => x.id === groupId)
    if (g) g.switchOn = switchOn
    this.set('ajaxInterceptor_groups', window.setting.ajaxInterceptor_groups)
    this.forceUpdate()
  },

  handleGroupDomainChange (e, groupId) {
    const g = window.setting.ajaxInterceptor_groups.find((x) => x.id === groupId)
    if (g) g.domain = e.target.value
    notifyMatchUrlPreviewUpdate()
    clearTimeout(this._persistGroupsTimeout)
    this._persistGroupsTimeout = setTimeout(this.flushGroupsToStorage, 300)
  },

  handleAddGroup () {
    window.setting.ajaxInterceptor_groups.push({
      id: buildUUID(),
      name: '',
      domain: '',
      switchOn: true
    })
    this.set('ajaxInterceptor_groups', window.setting.ajaxInterceptor_groups)
    this.forceUpdate()
  },

  handleRemoveGroup (groupId) {
    if (window.setting.ajaxInterceptor_groups.length <= 1) {
      Modal.info({ title: '至少保留一个组' })
      return
    }
    const count = window.setting.ajaxInterceptor_rules.filter((r) => r.groupId === groupId).length
    Modal.confirm({
      title: '确定删除此组？',
      content: `将同时删除该组下 ${count} 条接口规则。`,
      onOk: () => {
        window.setting.ajaxInterceptor_groups = window.setting.ajaxInterceptor_groups.filter((g) => g.id !== groupId)
        window.setting.ajaxInterceptor_rules = window.setting.ajaxInterceptor_rules.filter((r) => r.groupId !== groupId)
        this.set('ajaxInterceptor_groups', window.setting.ajaxInterceptor_groups)
        this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
        this.forceUpdate()
      }
    })
  },

  handleClickAddInGroup (groupId) {
    const gid = groupId || (window.setting.ajaxInterceptor_groups[0] && window.setting.ajaxInterceptor_groups[0].id)
    if (!gid) return
    window.setting.ajaxInterceptor_rules.push({
      groupId: gid,
      match: '',
      label: '',
      switchOn: true,
      key: buildUUID()
    })
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
    this.forceUpdate()
  },

  handleClickRemove (e, i) {
    e.stopPropagation()
    window.setting.ajaxInterceptor_rules = [
      ...window.setting.ajaxInterceptor_rules.slice(0, i),
      ...window.setting.ajaxInterceptor_rules.slice(i + 1),
    ]
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
  },

  handleClickDuplicateRule (e, i) {
    e.stopPropagation()
    const src = window.setting.ajaxInterceptor_rules[i]
    const copy = JSON.parse(JSON.stringify(src))
    copy.key = buildUUID()
    const srcLabel = src.label == null ? '' : String(src.label).trim()
    copy.label = srcLabel ? `${srcLabel} 副本` : ''
    copy.switchOn = src.switchOn !== false
    window.setting.ajaxInterceptor_rules = [
      ...window.setting.ajaxInterceptor_rules.slice(0, i + 1),
      copy,
      ...window.setting.ajaxInterceptor_rules.slice(i + 1),
    ]
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
    this.forceUpdate()
  },

  handleCollaseChange () {},

  handleSwitchChange () {
    window.setting.ajaxInterceptor_switchOn = !window.setting.ajaxInterceptor_switchOn
    this.set('ajaxInterceptor_switchOn', window.setting.ajaxInterceptor_switchOn)
    this.forceUpdate()
  },

  showSettingModal () {
    this.setState({
      settingModalVisible: true,
      customFunction: window.setting.customFunction
    })
  },

  handleSettingModalConfirm () {
    this.setState({ infoModalVisible: true })
  },

  handleSettingModalCancel () {
    this.setState({ settingModalVisible: false })
  },

  handlePositionChange (e) {
    this.setState({
      customFunction: {
        ...this.state.customFunction,
        panelPosition: e.target.value
      }
    })
  },

  showImageModal (pClass) {
    this.setState({
      imageModalVisible: true,
      positionClass: pClass
    })
  },

  handleImageModalClose () {
    this.setState({ imageModalVisible: false })
  },

  handleInfoModalClose () {
    this.setState({
      imageModalVisible: false,
      infoModalVisible: false,
      settingModalVisible: false
    }, () => {
      window.setting.customFunction = this.state.customFunction
      this.set('customFunction', window.setting.customFunction)
    })
  },

  applyImportedSetting (out) {
    window.setting = out
    const local = getChromeStorageLocal()
    const payload = pickSettingData(out)
    const finish = () => {
      STORAGE_KEYS.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          this.set(key, payload[key])
        }
      })
      this.setState({
        customFunction: out.customFunction,
        showRefreshTip: true,
        settingsRevision: (this.state.settingsRevision || 0) + 1
      }, () => {
        notifyMatchUrlPreviewUpdate()
      })
      message.success('配置已导入，请刷新业务页面使规则生效')
    }
    if (local) {
      local.set(payload, finish)
    } else {
      finish()
    }
  },

  handleExportBackup () {
    const local = getChromeStorageLocal()
    const download = (setting) => {
      const backup = buildBackupPayload(setting)
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ajax-interceptor-backup-${stamp}.json`
      a.click()
      URL.revokeObjectURL(url)
      message.success('备份已下载')
    }
    if (local) {
      local.get(STORAGE_KEYS, (result) => {
        download({ ...window.setting, ...result })
      })
    } else {
      download(window.setting)
    }
  },

  handleImportBackupClick () {
    if (this._importFileInput) {
      this._importFileInput.value = ''
      this._importFileInput.click()
    }
  },

  handleImportBackupFile (e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const merged = parseBackupFile(reader.result)
        const { out } = ensureGroupsMigrated(merged)
        const ruleCount = (out.ajaxInterceptor_rules || []).length
        const groupCount = (out.ajaxInterceptor_groups || []).length
        Modal.confirm({
          title: '导入配置',
          content: `将覆盖当前配置（${groupCount} 个组、${ruleCount} 条规则）。确定继续？`,
          okText: '导入',
          cancelText: '取消',
          onOk: () => {
            this.applyImportedSetting(out)
          }
        })
      } catch (err) {
        message.error(err.message || '无法解析备份文件')
      }
    }
    reader.onerror = () => {
      message.error('读取文件失败')
    }
    reader.readAsText(file)
  }
}

export function bindMainHandlers (instance) {
  Object.keys(mainHandlerMethods).forEach((key) => {
    instance[key] = mainHandlerMethods[key].bind(instance)
  })
}
