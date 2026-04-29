import React, { Component } from 'react'
import 'antd/dist/antd.css'
import { Switch, Collapse, Input, Select, Button, Badge, Tooltip, Icon, Modal, Radio } from 'antd'

const { Option } = Select
const Panel = Collapse.Panel

import Replacer from './components/Replacer'
import { addExtensionMessageListener, sendToExtensionRuntime, getChromeStorageLocal, getExtensionRuntime } from './extensionApi'

import './Main.less'

const buildUUID = () => {
  var dt = new Date().getTime()
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)
    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
  return uuid
}

/**
 * 与 pageScripts 中 getCompleteUrl 一致，用当前业务页 href 作 base，补全为「完整 URL」示意
 */
function buildMatchUrlPreview (filterType, match, pageHref) {
  if (!pageHref) {
    return { text: '在目标业务页打开侧栏，或 DevTools 中打开本面板，可显示与页面脚本一致的补全示例。' }
  }
  const m = (match || '').trim()
  if (!m) {
    return { text: '填写 url 匹配串后，将按当前顶栏页补全为完整 URL 示例。' }
  }
  if (filterType === 'regex') {
    return { text: `正则：在完整请求 URL 上 /${m}/i 匹配（当前页 origin：${new URL(pageHref).origin}）` }
  }
  const currentUrl = pageHref
  let url = m
  try {
    // eslint-disable-next-line no-new
    new URL(url)
    return { text: url }
  } catch (e) {
    const protocol = new URL(currentUrl).protocol
    const host = new URL(currentUrl).host
    if (url.startsWith('//')) {
      return { text: protocol + url }
    }
    if (url.startsWith('./') || url.startsWith('../')) {
      return { text: new URL(url, currentUrl).href }
    }
    if (url.startsWith('/')) {
      return { text: new URL(url, currentUrl).href }
    }
    return { text: protocol + '//' + host + (url.startsWith('/') ? url : '/' + url) }
  }
}

export default class Main extends Component {
  constructor() {
    super()
    this._onPageContextMessage = (e) => {
      if (e && e.data && e.data.type === 'ajaxInterceptorPageContext') {
        this.setState({
          pageContext: { origin: e.data.origin, href: e.data.href }
        })
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this._onPageContextMessage)
    }
    addExtensionMessageListener(({ type, to, url, match, contentScriptLoaded = false, showFreshTip = false }) => {
      if (type === 'ajaxInterceptor' && to === 'iframe') {
        if (contentScriptLoaded || showFreshTip) {
          this.setState({
            showRefreshTip: showFreshTip
          })
          return
        }
        const { interceptedRequests } = this.state
        if (!interceptedRequests[match]) interceptedRequests[match] = []

        const exits = interceptedRequests[match].some(obj => {
          if (obj.url === url) {
            obj.num++
            return true
          }
          return false
        })

        if (!exits) {
          interceptedRequests[match].push({ url, num: 1 })
        }
        this.setState({ interceptedRequests })
      }
    })

    sendToExtensionRuntime({
      type: 'ajaxInterceptor',
      to: 'background',
      iframeScriptLoaded: true
    })

  }

  state = {
    interceptedRequests: {},
    settingModalVisible: false,
    imageModalVisible: false,
    infoModalVisible: false,
    positionClass: 'suspend',
    customFunction: {
      panelPosition: 0
    },
    showRefreshTip: false,
    pageContext: null
  }

  /** 原用于底部悬浮「+」定位；规则改为仅在组内添加后保留空实现，供 Replacer 等调用 */
  updateAddBtnTop_interval = () => {}

  set = (key, value) => {
    // 发送给background.js
    sendToExtensionRuntime({ type: 'ajaxInterceptor', to: 'background', key, value })
    const local = getChromeStorageLocal()
    if (local) {
      local.set({ [key]: value })
    }
  }

  forceUpdateDebouce = () => {
    clearTimeout(this.forceUpdateTimeout)
    this.forceUpdateTimeout = setTimeout(() => {
      this.forceUpdate()
    }, 1000)
  }

  handleSingleSwitchChange = (switchOn, i) => {
    window.setting.ajaxInterceptor_rules[i].switchOn = switchOn
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)

    // 这么搞主要是为了能实时同步window.setting.ajaxInterceptor_rules，并且让性能好一点
    this.forceUpdateDebouce()
  }

  handleLimitMethodChange = (val, i) => {
    window.setting.ajaxInterceptor_rules[i].limitMethod = val
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)

    this.forceUpdate()
  }

  handleFilterTypeChange = (val, i) => {
    window.setting.ajaxInterceptor_rules[i].filterType = val
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)

    this.forceUpdate()
  }

  handleMatchChange = (e, i) => {
    window.setting.ajaxInterceptor_rules[i].match = e.target.value
    this.forceUpdate()
    clearTimeout(this._persistRulesDebounce)
    this._persistRulesDebounce = setTimeout(() => {
      this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
    }, 300)
  }

  handleLabelChange = (e, i) => {
    window.setting.ajaxInterceptor_rules[i].label = e.target.value
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)

    this.forceUpdateDebouce()
  }

  flushGroupsToStorage = () => {
    clearTimeout(this._persistGroupsTimeout)
    this.set('ajaxInterceptor_groups', window.setting.ajaxInterceptor_groups)
  }

  handleGroupNameChange = (e, groupId) => {
    const g = window.setting.ajaxInterceptor_groups.find((x) => x.id === groupId)
    if (g) g.name = e.target.value
    this.forceUpdate()
    clearTimeout(this._persistGroupsTimeout)
    this._persistGroupsTimeout = setTimeout(this.flushGroupsToStorage, 300)
  }

  handleGroupSwitchChange = (switchOn, groupId) => {
    const g = window.setting.ajaxInterceptor_groups.find((x) => x.id === groupId)
    if (g) g.switchOn = switchOn
    this.set('ajaxInterceptor_groups', window.setting.ajaxInterceptor_groups)
    this.forceUpdate()
  }

  handleAddGroup = () => {
    const n = window.setting.ajaxInterceptor_groups.length + 1
    window.setting.ajaxInterceptor_groups.push({
      id: buildUUID(),
      name: '',
      switchOn: true
    })
    this.set('ajaxInterceptor_groups', window.setting.ajaxInterceptor_groups)
    this.forceUpdate()
  }

  handleRemoveGroup = (groupId) => {
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
  }

  /**
   * 在指定组内新增一条规则
   */
  handleClickAddInGroup = (groupId) => {
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
  }

  handleClickRemove = (e, i) => {
    e.stopPropagation()
    const { interceptedRequests } = this.state
    const match = window.setting.ajaxInterceptor_rules[i].match
    const label = window.setting.ajaxInterceptor_rules[i].label

    window.setting.ajaxInterceptor_rules = [
      ...window.setting.ajaxInterceptor_rules.slice(0, i),
      ...window.setting.ajaxInterceptor_rules.slice(i + 1),
    ]
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)

    delete interceptedRequests[match]
    delete interceptedRequests[label]
    this.setState({ interceptedRequests })
  }

  /**
   * 在下方插入一条同配置副本（可只改 path / 匹配串与响应体）
   */
  handleClickDuplicateRule = (e, i) => {
    e.stopPropagation()
    const src = window.setting.ajaxInterceptor_rules[i]
    const copy = JSON.parse(JSON.stringify(src))
    copy.key = buildUUID()
    const base = (src.label == null || src.label === '') ? 'url' : String(src.label)
    copy.label = base
    copy.switchOn = src.switchOn !== false
    window.setting.ajaxInterceptor_rules = [
      ...window.setting.ajaxInterceptor_rules.slice(0, i + 1),
      copy,
      ...window.setting.ajaxInterceptor_rules.slice(i + 1),
    ]
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
    this.forceUpdate()
  }

  handleCollaseChange = () => {}

  requestPageContextFromExtension = (tabId) => {
    const runtime = getExtensionRuntime()
    if (!runtime || typeof runtime.sendMessage !== 'function' || !runtime.id) return
    runtime.sendMessage(
      runtime.id,
      { to: 'background', type: 'getPageContext', tabId },
      (res) => {
        if (res && res.href) {
          this.setState({ pageContext: res })
        }
      }
    )
  }

  componentDidMount() {
    if (typeof globalThis === 'object' && globalThis.chrome && globalThis.chrome.devtools && globalThis.chrome.devtools.inspectedWindow) {
      const tabId = globalThis.chrome.devtools.inspectedWindow.tabId
      if (tabId != null) {
        this.requestPageContextFromExtension(tabId)
      } else {
        this.requestPageContextFromExtension()
      }
    } else {
      this.requestPageContextFromExtension()
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this._onPageContextMessage)
    }
    clearTimeout(this._persistGroupsTimeout)
    clearTimeout(this._persistRulesDebounce)
    clearTimeout(this.forceUpdateTimeout)
  }

  handleSwitchChange = () => {
    window.setting.ajaxInterceptor_switchOn = !window.setting.ajaxInterceptor_switchOn
    this.set('ajaxInterceptor_switchOn', window.setting.ajaxInterceptor_switchOn)

    this.forceUpdate()
  }

  // 弹窗逻辑
  showSettingModal = () => {
    this.setState({
      settingModalVisible: true,
      customFunction: window.setting.customFunction
    })
  }
  handleSettingModalConfirm = () => {
    this.setState({
      infoModalVisible: true
    })
  }
  handleSettingModalCancel = () => {
    this.setState({ settingModalVisible: false })
  }
  handlePositionChange = e => {
    this.setState({
      customFunction: {
        ...this.state.customFunction,
        panelPosition: e.target.value
      }
    })
  }
  showImageModal = (pClass) => {
    this.setState({
      imageModalVisible: true,
      positionClass: pClass
    })
  }
  handleImageModalClose = () => {
    this.setState({ imageModalVisible: false })
  }
  handleInfoModalClose = () => {
    this.setState({
      imageModalVisible: false,
      infoModalVisible: false,
      settingModalVisible: false
    }, () => {
      window.setting.customFunction = this.state.customFunction
      this.set('customFunction', window.setting.customFunction)
    })
  }

  render() {
    return (
      <div className="ajax-modifier-main">
        <div className="main-toolbar-inner">
          <div className="main-toolbar-left">
          <Switch
            style={{ transform: 'translateX(11px)' }}
            defaultChecked={window.setting.ajaxInterceptor_switchOn}
            onChange={this.handleSwitchChange}
          />
          </div>
          <div className="main-toolbar-right">
          <Button
            type="primary"
            shape="circle"
            icon="plus"
            size="small"
            title="新建组"
            onClick={this.handleAddGroup}
            style={{ float: 'right', marginRight: 10, marginTop: 1 }}
            disabled={!window.setting.ajaxInterceptor_switchOn}
          />
          <Icon
            type="setting"
            style={{ fontSize: '22px', color: '#1890ff', cursor: 'pointer', float: 'right' }}
            onClick={this.showSettingModal}
          />
          </div>
          {
            this.state.showRefreshTip ? (
              <div className="main-toolbar-refresh-tip" style={{ color: '#1890ff', lineHeight: '16px', marginTop: '16px' }}>
                Please Refresh your page after changing rules.
              </div>
            ) : ''
          }
        </div>
        <div className={window.setting.ajaxInterceptor_switchOn ? 'setting-body' : 'setting-body setting-body-hidden'}>
          {window.setting.ajaxInterceptor_groups && window.setting.ajaxInterceptor_groups.length > 0 ? (
            <div>
              {window.setting.ajaxInterceptor_groups.map((group) => {
                const groupDisabled = group.switchOn === false
                return (
                <div
                  key={group.id}
                  className={groupDisabled ? 'rule-group rule-group--disabled' : 'rule-group'}
                  title={groupDisabled ? '组开关已关闭：组内规则暂不拦截，可重新打开组开关恢复' : undefined}
                >
                  <div className="group-toolbar" onClick={e => e.stopPropagation()}>
                    <Input
                      placeholder="组名（如：项目A / 版本2）"
                      value={group.name}
                      onChange={e => this.handleGroupNameChange(e, group.id)}
                      onBlur={this.flushGroupsToStorage}
                      className="group-name-input"
                    />
                    <span className="group-toolbar-label">组</span>
                    <Switch
                      size="small"
                      checked={group.switchOn}
                      onChange={val => this.handleGroupSwitchChange(val, group.id)}
                      className="group-toolbar-switch"
                    />
                    {groupDisabled ? (
                      <span className="group-disabled-badge">已关闭 · 本组规则暂不生效</span>
                    ) : null}
                    <Button
                      type="dashed"
                      size="small"
                      onClick={() => this.handleClickAddInGroup(group.id)}
                      disabled={groupDisabled}
                    >
                      + 规则
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => this.handleRemoveGroup(group.id)}
                    >
                      删组
                    </Button>
                  </div>
                  <Collapse
                    className={window.setting.ajaxInterceptor_switchOn ? 'collapse' : 'collapse collapse-hidden'}
                    onChange={this.handleCollaseChange}
                  >
                    {window.setting.ajaxInterceptor_rules
                      .map((r, i) => ({ r, i }))
                      .filter(({ r }) => r.groupId === group.id)
                      .map(({
                        r: {
                          filterType = 'normal',
                          limitMethod = 'ALL',
                          match,
                          label,
                          switchOn = true,
                          key
                        },
                        i
                      }) => (
                        <Panel
                          key={key}
                          header={
                            <div
                              className="panel-header-wrap"
                              onClick={e => e.stopPropagation()}
                            >
                              <div className="panel-header">
                                <Input.Group compact style={{ flex: 'auto', display: 'flex' }}>
                                  <Input
                                    placeholder="name"
                                    style={{ width: '1px', maxWidth: '120px', flex: 'auto', display: 'inline-block' }}
                                    defaultValue={label}
                                    onChange={e => this.handleLabelChange(e, i)}
                                    disabled={groupDisabled}
                                  />
                                  <Select
                                    defaultValue={limitMethod}
                                    style={{ width: '1px', maxWidth: '120px', flex: '1.5 1 auto', display: 'inline-block' }}
                                    onChange={e => this.handleLimitMethodChange(e, i)}
                                    disabled={groupDisabled}
                                  >
                                    <Option value="ALL">ALL</Option>
                                    <Option value="GET">GET</Option>
                                    <Option value="POST">POST</Option>
                                    <Option value="PUT">PUT</Option>
                                    <Option value="HEAD">HEAD</Option>
                                    <Option value="DELETE">DELETE</Option>
                                    <Option value="OPTIONS">OPTIONS</Option>
                                  </Select>
                                  <Select
                                    defaultValue={filterType}
                                    style={{ width: '1px', maxWidth: '120px', flex: '1.5 1 auto', display: 'inline-block' }}
                                    onChange={e => this.handleFilterTypeChange(e, i)}
                                    disabled={groupDisabled}
                                  >
                                    <Option value="normal">normal</Option>
                                    <Option value="regex">regex</Option>
                                  </Select>
                                  <Input
                                    placeholder={filterType === 'normal' ? 'eg: abc/get' : 'eg: abc.*'}
                                    style={{ width: '1px', flex: '1.5 1 auto', display: 'inline-block' }}
                                    defaultValue={match}
                                    onChange={e => this.handleMatchChange(e, i)}
                                    disabled={groupDisabled}
                                  />
                                </Input.Group>
                                <div className="button-group">
                                  <Switch
                                    size="small"
                                    defaultChecked={switchOn}
                                    onChange={val => this.handleSingleSwitchChange(val, i)}
                                    style={{ width: '28px', flex: 'none', marginRight: '8px' }}
                                    disabled={groupDisabled}
                                  />
                                  <Button
                                    type="primary"
                                    shape="circle"
                                    icon="plus"
                                    size="small"
                                    title="复制本规则（同组内新增一条，可只改 url 与响应体）"
                                    onClick={e => this.handleClickDuplicateRule(e, i)}
                                    style={{ width: '24px', flex: 'none', marginRight: 4 }}
                                    disabled={groupDisabled}
                                  />
                                  <Button
                                    type="primary"
                                    shape="circle"
                                    icon="minus"
                                    size="small"
                                    onClick={e => this.handleClickRemove(e, i)}
                                    style={{ width: '24px', flex: 'none' }}
                                    disabled={groupDisabled}
                                  />
                                </div>
                              </div>
                              {this.state.pageContext && this.state.pageContext.href && (
                                <div
                                  className="match-url-preview match-url-preview--in-header"
                                  title="按当前顶栏页与 pageScripts 中 getCompleteUrl 方式补全；折叠亦可见"
                                >
                                  <div className="match-url-preview-body">
                                    {buildMatchUrlPreview(
                                      filterType,
                                      match,
                                      this.state.pageContext.href
                                    ).text}
                                  </div>
                                </div>
                              )}
                            </div>
                          }
                        >
                          <Replacer
                            updateAddBtnTop_interval={this.updateAddBtnTop_interval}
                            index={i}
                            set={this.set}
                            disabled={groupDisabled}
                          />
                          {this.state.interceptedRequests[match] && (
                            <>
                              <div className="intercepted-requests">
                                Intercepted Networks:
                              </div>
                              <div className="intercepted">
                                {this.state.interceptedRequests[match] && this.state.interceptedRequests[match].map(({
                                                                                                                       url,
                                                                                                                       num
                                                                                                                     }) => (
                                  <Tooltip placement="top" title={url} key={url}>
                                    <Badge
                                      count={num}
                                      style={{
                                        backgroundColor: '#fff',
                                        color: '#999',
                                        boxShadow: '0 0 0 1px #d9d9d9 inset',
                                        marginTop: '-3px',
                                        marginRight: '4px'
                                      }}
                                    />
                                    <span className="url">{url}</span>
                                  </Tooltip>
                                ))}
                              </div>
                            </>
                          )}
                        </Panel>
                      ))}
                  </Collapse>
                </div>
                )
              })}
            </div>
          ) : <div/>}
        </div>
        <Modal
          visible={this.state.settingModalVisible}
          title="Settings"
          width="410px"
          onCancel={this.handleSettingModalCancel}
          footer={[
            <Button key="Cancel" onClick={this.handleSettingModalCancel}>
              Cancel
            </Button>,
            <Button key="Submit" type="primary" onClick={this.handleSettingModalConfirm}>
              Submit
            </Button>,
          ]}
        >
          <div>
            <span>Position:</span>
            <Radio.Group
              onChange={this.handlePositionChange} value={this.state.customFunction.panelPosition}
              style={{ marginLeft: '20px' }}
            >
              <Radio value={0}>
                <span>Suspend(Default)</span>
                <Icon type="question-circle" className="radio-icon" onClick={() => this.showImageModal("suspend")}/>
              </Radio>
              <Radio value={1}>
                <span>Devtools</span>
                <Icon type="question-circle" className="radio-icon" onClick={() => this.showImageModal("devtools")}/>
              </Radio>
            </Radio.Group>
          </div>
        </Modal>
        <Modal
          visible={this.state.infoModalVisible}
          onCancel={this.handleInfoModalClose}
          footer={null}
          closable={false}
          width="410px"
          style={{ marginTop: 10 }}
        >
          <div style={{ color: '#1890ff', margin: '16px 0' }}>
            Please refresh the page and reopen the devtools after submitting.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" onClick={this.handleInfoModalClose} style={{ float: 'right' }}>OK</Button>
          </div>
        </Modal>
        <Modal
          visible={this.state.imageModalVisible}
          onCancel={this.handleImageModalClose}
          footer={null}
          mask={false}
          closable={false}
          width="502px"
          bodyStyle={{ padding: '8px' }}
        >
          <div onClick={this.handleImageModalClose}>
            <div className="position-title">
              Example of {this.state.positionClass === 'suspend' ? 'Suspend(Default)' : 'Devtools'} Position:
            </div>
            <div className={`position-image image-${this.state.positionClass}`}></div>
          </div>
        </Modal>
      </div>
    )
  }
}