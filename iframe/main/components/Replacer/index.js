import React, { Component } from 'react'
import { Select, Radio, Button, Modal } from 'antd'
import MonacoEditor from '../Editor'
import MatchUrlPreview from '../MatchUrlPreview'
import {
  REQUEST_PAYLOAD_EXAMPLES,
  HEADERS_EXAMPLES,
  RESPONSE_EXAMPLES,
  RESPONSE_SIMPLE_EXAMPLES,
  RESPONSE_MOCKJS_EXAMPLES,
  RESPONSE_TS_MOCK_EXAMPLES
} from '../Editor/examples'
import { tsInterfacesToMockTemplate } from '../../utils/tsInterfaceToMockTemplate'
import { addExtensionMessageListener, sendToExtensionRuntime, getExtensionRuntime } from '../../extensionApi'

import './index.less'

const REPLACE_MODES = ['json', 'advanced', 'mockjs', 'ts-mock']

function getRuleReplaceMode(rule) {
  const m = rule && rule.replaceMode
  if (REPLACE_MODES.includes(m)) return m
  return rule && rule.isExpert ? 'advanced' : 'json'
}

export default class Index extends Component {
  constructor(props) {
    super()
    const rule = window.setting.ajaxInterceptor_rules[props.index]
    this.state = {
      showJSONEditor: false,
      editorValue: rule.editorValue || 3,
      replaceMode: getRuleReplaceMode(rule),
      tsMockPreviewVisible: false,
      tsMockPreviewError: '',
      tsMockPreviewBody: '',
      tsMockPreviewLoading: false,
      mockjsTsModalVisible: false
    }
    this.tsMockDebounceTimer = null
    this._mockPreviewRequestId = null
  }

  componentWillUnmount() {
    if (this.tsMockDebounceTimer) {
      clearTimeout(this.tsMockDebounceTimer)
      this.tsMockDebounceTimer = null
    }
  }

  componentDidMount() {
    addExtensionMessageListener((msg) => {
      if (!msg || msg.type !== 'ajaxInterceptor' || msg.to !== 'iframe') return
      if (msg.action !== 'mockPreviewResult') return
      if (!this._mockPreviewRequestId || msg.requestId !== this._mockPreviewRequestId) return
      this.setState({
        tsMockPreviewVisible: true,
        tsMockPreviewLoading: false,
        tsMockPreviewError: msg.ok ? '' : (msg.error || '预览生成失败'),
        tsMockPreviewBody: msg.ok ? (msg.body || '') : ''
      })
    })
  }

  componentDidUpdate(prevProps, { showJSONEditor }) {
    if (showJSONEditor !== this.state.showJSONEditor) {
      this.props.updateAddBtnTop_interval()
    }
  }

  requestMockPreview = (templateText) => {
    // 扩展页 CSP 禁止 eval，Mock.js 在扩展页直接执行会报错；改为让页面环境（pageScripts）生成并回传结果
    const runtime = getExtensionRuntime()
    if (!runtime) {
      this.setState({
        tsMockPreviewVisible: true,
        tsMockPreviewLoading: false,
        tsMockPreviewError: '本地调试环境缺少扩展运行时，请在 Chrome 扩展中使用预览。',
        tsMockPreviewBody: ''
      })
      return
    }

    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    this._mockPreviewRequestId = requestId
    this.setState({
      tsMockPreviewVisible: true,
      tsMockPreviewLoading: true,
      tsMockPreviewError: '',
      tsMockPreviewBody: ''
    })
    sendToExtensionRuntime({
      type: 'ajaxInterceptor',
      to: 'background',
      action: 'mockPreview',
      requestId,
      templateText
    })
  }

  syncTsMockToOverrideTxt(immediate = false) {
    const rule = window.setting.ajaxInterceptor_rules[this.props.index]
    const src = rule.overrideTsMockSource || ''
    const run = () => {
      const { template, error } = tsInterfacesToMockTemplate(src, 'Root')
      rule.overrideTxt = error ? '{}' : JSON.stringify(template, null, 2)
      if (error && src.trim()) {
        console.warn('[Ajax Modifier] ts-mock 解析:', error)
      }
      this.props.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
    }
    if (immediate) {
      run()
      return
    }
    if (this.tsMockDebounceTimer) clearTimeout(this.tsMockDebounceTimer)
    this.tsMockDebounceTimer = setTimeout(run, 400)
  }

  handleOverrideTxtChange = (txt) => {
    window.setting.ajaxInterceptor_rules[this.props.index].overrideTxt = txt
    this.props.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
  }

  handleTsMockSourceChange = (txt) => {
    const rule = window.setting.ajaxInterceptor_rules[this.props.index]
    rule.overrideTsMockSource = txt
    this.props.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
    this.syncTsMockToOverrideTxt(false)
  }

  handleReplaceModeChange = (replaceMode) => {
    const rule = window.setting.ajaxInterceptor_rules[this.props.index]
    rule.replaceMode = replaceMode
    rule.isExpert = replaceMode === 'advanced'
    this.setState({ replaceMode })
    if (replaceMode === 'ts-mock') {
      this.syncTsMockToOverrideTxt(true)
    }
    this.props.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
    this.props.updateAddBtnTop_interval()
  }

  handleEditorRatioChange = e => {
    this.setState({
        editorValue: e.target.value
      }
    )
    window.setting.ajaxInterceptor_rules[this.props.index].editorValue = e.target.value
    this.props.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
  }

  onPayloadEditorChange = (newValue) => {
    window.setting.ajaxInterceptor_rules[this.props.index].overridePayloadFunc = newValue
    this.props.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
  }

  onHeadersEditorChange = (newValue) => {
    window.setting.ajaxInterceptor_rules[this.props.index].overrideHeadersFunc = newValue
    this.props.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
  }

  onResponseEditorChange = (newValue) => {
    window.setting.ajaxInterceptor_rules[this.props.index].overrideResponseFunc = newValue
    this.props.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
  }

  /** 根据当前 TS 解析模板并执行 Mock.js，弹窗展示一次随机结果 */
  handleTsMockPreview = () => {
    const rule = window.setting.ajaxInterceptor_rules[this.props.index]
    const src = (rule.overrideTsMockSource || '').trim()
    const { template, error } = tsInterfacesToMockTemplate(src, 'Root')
    if (error) {
      this.setState({
        tsMockPreviewVisible: true,
        tsMockPreviewLoading: false,
        tsMockPreviewError: error,
        tsMockPreviewBody: ''
      })
      return
    }
    this.requestMockPreview(JSON.stringify(template))
  }

  handleMockjsPreview = () => {
    const rule = window.setting.ajaxInterceptor_rules[this.props.index]
    const templateText = (rule.overrideTxt || '').trim() || '{}'
    try {
      JSON.parse(templateText)
    } catch (e) {
      this.setState({
        tsMockPreviewVisible: true,
        tsMockPreviewLoading: false,
        tsMockPreviewError: (e && e.message) ? e.message : String(e),
        tsMockPreviewBody: ''
      })
      return
    }
    this.requestMockPreview(templateText)
  }

  closeTsMockPreview = () => {
    this.setState({ tsMockPreviewVisible: false })
  }

  openMockjsTsModal = () => {
    this.setState({ mockjsTsModalVisible: true })
  }

  closeMockjsTsModal = () => {
    this.setState({ mockjsTsModalVisible: false })
  }

  handleMockjsTsSourceChange = (txt) => {
    const rule = window.setting.ajaxInterceptor_rules[this.props.index]
    rule.overrideMockjsTsSource = txt
    this.props.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
  }

  applyMockjsFromTs = () => {
    const rule = window.setting.ajaxInterceptor_rules[this.props.index]
    const src = (rule.overrideMockjsTsSource || '').trim()
    const { template, error } = tsInterfacesToMockTemplate(src, 'Root')
    if (error) {
      this.setState({
        tsMockPreviewVisible: true,
        tsMockPreviewLoading: false,
        tsMockPreviewError: error,
        tsMockPreviewBody: ''
      })
      return
    }
    rule.overrideTxt = JSON.stringify(template, null, 2)
    this.props.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules)
    this.setState({ mockjsTsModalVisible: false }, () => {
      // 生成后立即预览一次，方便确认映射是否生效
      setTimeout(() => this.handleMockjsPreview(), 0)
    })
  }

  render() {
    const ro = !!this.props.disabled
    const { replaceMode, tsMockPreviewVisible, tsMockPreviewError, tsMockPreviewBody, tsMockPreviewLoading, mockjsTsModalVisible } = this.state
    const isAdvanced = replaceMode === 'advanced'
    const showPlainJson = replaceMode === 'json'
    const showMockjs = replaceMode === 'mockjs'
    const showTsMock = replaceMode === 'ts-mock'
    const rule = window.setting.ajaxInterceptor_rules[this.props.index]

    return (
      <>
        <div className="rule-expand-meta">
          <div className="rule-expand-meta-row">
            <span className="rule-expand-meta-label">匹配方式</span>
            <Select
              size="small"
              value={this.props.filterType || 'normal'}
              style={{ width: 100 }}
              onChange={(val) => this.props.onFilterTypeChange && this.props.onFilterTypeChange(val, this.props.index)}
              disabled={ro}
            >
              <Select.Option value="normal">normal</Select.Option>
              <Select.Option value="regex">regex</Select.Option>
            </Select>
          </div>
          {this.props.groupId != null && (
            <MatchUrlPreview
              groupId={this.props.groupId}
              ruleIndex={this.props.index}
              settingsRevision={this.props.settingsRevision}
            />
          )}
        </div>
        <div className="replace-mode-row">
          <span className="replace-mode-label">替换模式</span>
          <Select
            size="small"
            className="replace-mode-select"
            value={replaceMode}
            onChange={this.handleReplaceModeChange}
            disabled={ro}
          >
            <Select.Option value="json">普通 JSON</Select.Option>
            <Select.Option value="advanced">Advanced Mode</Select.Option>
            <Select.Option value="mockjs">Mock.js</Select.Option>
            <Select.Option value="ts-mock">ts-mock</Select.Option>
          </Select>
          {(showTsMock || showMockjs) && (
            <div className="replace-mode-actions">
              {showMockjs && (
                <Button size="small" disabled={ro} onClick={this.openMockjsTsModal}>
                  从 TS 生成模板
                </Button>
              )}
              <Button
                type="primary"
                size="small"
                disabled={ro}
                onClick={showTsMock ? this.handleTsMockPreview : this.handleMockjsPreview}
              >
                预览 Mock 结果
              </Button>
            </div>
          )}
        </div>
        {
          showPlainJson && (
            <div>
              <MonacoEditor
                index={this.props.index}
                language="json"
                defaultValue={rule.overrideTxt}
                examples={RESPONSE_SIMPLE_EXAMPLES}
                onEditorChange={this.handleOverrideTxtChange}
                languageSelectOptions={["json", "text"]}
                readOnly={ro}
              />
            </div>
          )
        }
        {
          showMockjs && (
            <div>
              <div className="replace-with">
                Mock 模板（JSON + Mock.js 语法，如 @city）
              </div>
              <MonacoEditor
                index={this.props.index}
                language="json"
                defaultValue={rule.overrideTxt}
                examples={RESPONSE_MOCKJS_EXAMPLES}
                onEditorChange={this.handleOverrideTxtChange}
                languageSelectOptions={["json", "text"]}
                readOnly={ro}
              />
            </div>
          )
        }
        <Modal
          title="从 TypeScript interface 生成 Mock.js 模板（优先解析 Root）"
          visible={mockjsTsModalVisible}
          onCancel={this.closeMockjsTsModal}
          width={860}
          footer={[
            <Button key="cancel" onClick={this.closeMockjsTsModal}>取消</Button>,
            <Button key="apply" type="primary" onClick={this.applyMockjsFromTs}>生成并写入模板</Button>
          ]}
        >
          <div style={{ marginBottom: 8, color: 'rgba(0,0,0,0.65)' }}>
            生成规则与 ts-mock 一致（含 date/time/billCode/siteCode 映射）。生成后会覆盖当前 Mock.js 模板。
          </div>
          <MonacoEditor
            index={this.props.index}
            language="typescript"
            defaultValue={rule.overrideMockjsTsSource || ''}
            examples={RESPONSE_TS_MOCK_EXAMPLES}
            onEditorChange={this.handleMockjsTsSourceChange}
            languageSelectOptions={["typescript"]}
            readOnly={ro}
          />
        </Modal>
        {
          showTsMock && (
            <div>
              <div className="replace-with ts-mock-header">
                <span>
                  TypeScript 接口（优先解析 <code>Root</code>；保存后自动生成 Mock 模板并用于拦截）
                </span>
              </div>
              <MonacoEditor
                index={this.props.index}
                language="typescript"
                defaultValue={rule.overrideTsMockSource || ''}
                examples={RESPONSE_TS_MOCK_EXAMPLES}
                onEditorChange={this.handleTsMockSourceChange}
                languageSelectOptions={["typescript"]}
                readOnly={ro}
              />
            </div>
          )
        }
        <Modal
          title="Mock 生成预览（与拦截时一致；每次点击会重新随机）"
          visible={tsMockPreviewVisible}
          onCancel={this.closeTsMockPreview}
          width={760}
          footer={[
            <Button key="close" type="primary" onClick={this.closeTsMockPreview}>
              关闭
            </Button>
          ]}
        >
          {tsMockPreviewLoading ? (
            <div>生成中…</div>
          ) : tsMockPreviewError ? (
            <div className="ts-mock-preview-error">{tsMockPreviewError}</div>
          ) : (
            <pre className="ts-mock-preview-json">{tsMockPreviewBody}</pre>
          )}
        </Modal>
        {
          isAdvanced && (
            <div>
              <Radio.Group value={this.state.editorValue} onChange={this.handleEditorRatioChange} className="replace-radio"
                disabled={ro}>
                <Radio.Button value={1}>Payload</Radio.Button>
                <Radio.Button value={2}>Headers</Radio.Button>
                <Radio.Button value={3}>Response</Radio.Button>
              </Radio.Group>
              {
                this.state.editorValue === 1 && (
                  <MonacoEditor
                    index={this.props.index}
                    language="javascript"
                    defaultValue={rule.overridePayloadFunc}
                    examples={REQUEST_PAYLOAD_EXAMPLES}
                    onEditorChange={this.onPayloadEditorChange}
                    languageSelectOptions={["javascript"]}
                    readOnly={ro}
                  />
                )
              }
              {
                this.state.editorValue === 2 && (
                  <div>
                    <MonacoEditor
                      index={this.props.index}
                      language="javascript"
                      defaultValue={rule.overrideHeadersFunc}
                      examples={HEADERS_EXAMPLES}
                      onEditorChange={this.onHeadersEditorChange}
                      languageSelectOptions={["javascript"]}
                      readOnly={ro}
                    />
                  </div>
                )
              }
              {
                this.state.editorValue === 3 && (
                  <div>
                    <MonacoEditor
                      index={this.props.index}
                      language="javascript"
                      defaultValue={rule.overrideResponseFunc}
                      examples={RESPONSE_EXAMPLES}
                      onEditorChange={this.onResponseEditorChange}
                      languageSelectOptions={["javascript"]}
                      readOnly={ro}
                    />
                  </div>
                )
              }
            </div>
          )
        }
      </>
    )
  }
}
