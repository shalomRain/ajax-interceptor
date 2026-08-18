import React, { useState, useRef, useCallback } from 'react'
import { Collapse, Input, Select, Button, Switch, Icon, Dropdown, Menu } from 'antd'
import Replacer from './Replacer'

const { Option } = Select
const Panel = Collapse.Panel

const DRAG_THRESHOLD_PX = 5
const PRESS_STYLE_DELAY_MS = 500

function isGroupExpanded (group) {
  return group.expanded !== false
}

function isRuleExpanded (rule) {
  return rule.expanded !== false
}

/** 关闭 antd Collapse 展开/收起高度动画，避免增删规则时列表抖动 */
const collapseOpenAnimation = {
  appear (node, done) { done() },
  enter (node, done) { done() },
  leave (node, done) { done() }
}

function GroupExpandIcon ({
  isActive,
  groupId,
  onToggle,
  onDragStart,
  onDragMove,
  onDragEnd
}) {
  const movedRef = useRef(false)

  const clearDocumentListeners = (onMove, onUp) => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  const handleMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    movedRef.current = false
    const startY = e.clientY
    let holding = true
    let styleApplied = false
    let pressStyleTimer = null

    const applyPressStyle = () => {
      if (!styleApplied && holding) {
        styleApplied = true
        document.body.classList.add('group-drag-pressing')
      }
    }

    const clearPressStyle = () => {
      holding = false
      if (pressStyleTimer != null) {
        clearTimeout(pressStyleTimer)
        pressStyleTimer = null
      }
      if (styleApplied) {
        document.body.classList.remove('group-drag-pressing')
        styleApplied = false
      }
    }

    pressStyleTimer = setTimeout(applyPressStyle, PRESS_STYLE_DELAY_MS)

    const onMove = (ev) => {
      if (!movedRef.current && Math.abs(ev.clientY - startY) >= DRAG_THRESHOLD_PX) {
        movedRef.current = true
        onDragStart(groupId)
      }
      if (movedRef.current) {
        ev.preventDefault()
        onDragMove(ev.clientY)
      }
    }

    const onUp = (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      clearPressStyle()
      clearDocumentListeners(onMove, onUp)
      if (movedRef.current) {
        onDragEnd()
      } else {
        onToggle(groupId)
      }
      movedRef.current = false
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <span
      className="group-drag-handle"
      title="点击展开/收起；按住 0.5 秒后拖动可调整组顺序"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <Icon type={isActive ? 'down' : 'right'} />
    </span>
  )
}

function GroupPanelHeader ({
  group,
  groupDisabled,
  isExpanded,
  onGroupNameChange,
  onGroupDomainChange,
  onFlushGroupsToStorage,
  onGroupSwitchChange,
  onAddRuleInGroup,
  onRemoveGroup,
  onToggle,
  onDragStart,
  onDragMove,
  onDragEnd
}) {
  const moreMenu = (
    <Menu
      onClick={({ key, domEvent }) => {
        if (domEvent) {
          domEvent.stopPropagation()
          domEvent.preventDefault()
        }
        if (key === 'remove') onRemoveGroup(group.id)
      }}
    >
      <Menu.Item key="remove">
        <span className="menu-item-danger">删除本组</span>
      </Menu.Item>
    </Menu>
  )

  return (
    <div className="group-panel-header" onClick={e => e.stopPropagation()}>
      <GroupExpandIcon
        isActive={isExpanded}
        groupId={group.id}
        onToggle={onToggle}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
      <div className="group-toolbar">
        <Input
          placeholder="组名（如：项目A / 版本2）"
          value={group.name}
          onChange={e => onGroupNameChange(e, group.id)}
          onBlur={onFlushGroupsToStorage}
          className="group-name-input"
        />
        <Input
          placeholder="域名（留空不限，如 test.example.com）"
          defaultValue={group.domain || ''}
          onChange={e => onGroupDomainChange(e, group.id)}
          onBlur={onFlushGroupsToStorage}
          className="group-domain-input"
          disabled={groupDisabled}
        />
        <span className="group-toolbar-label">组</span>
        <Switch
          size="small"
          checked={group.switchOn}
          onChange={val => onGroupSwitchChange(val, group.id)}
          className="group-toolbar-switch"
        />
        {groupDisabled ? (
          <span className="group-disabled-badge">已关闭</span>
        ) : null}
        <Button
          type="dashed"
          size="small"
          onClick={() => onAddRuleInGroup(group.id)}
          disabled={groupDisabled}
        >
          + 规则
        </Button>
        <Dropdown overlay={moreMenu} trigger={['click']} placement="bottomRight">
          <Button
            type="link"
            size="small"
            className="header-more-btn"
            title="更多"
            onClick={e => e.stopPropagation()}
          >
            <Icon type="ellipsis" />
          </Button>
        </Dropdown>
      </div>
    </div>
  )
}

export default function MainGroups ({
  switchOn,
  groups,
  rules,
  expandAllActive,
  onExpandCollapseAll,
  onGroupNameChange,
  onGroupDomainChange,
  onFlushGroupsToStorage,
  onGroupSwitchChange,
  onAddRuleInGroup,
  onRemoveGroup,
  onGroupReorder,
  onGroupExpandedChange,
  onGroupRulesCollapseChange,
  onLabelChange,
  onLimitMethodChange,
  onFilterTypeChange,
  onMatchChange,
  onRuleSwitchChange,
  onDuplicateRule,
  onRemoveRule,
  set,
  updateAddBtnTop_interval,
  settingsRevision = 0
}) {
  const listRef = useRef(null)
  const dragStateRef = useRef({ fromIndex: null, overIndex: null })
  const [dragFromIndex, setDragFromIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const toggleGroup = useCallback((groupId) => {
    const g = (groups || []).find(item => item.id === groupId)
    if (!g) return
    onGroupExpandedChange(!isGroupExpanded(g), groupId)
  }, [groups, onGroupExpandedChange])

  const resolveDropIndex = useCallback((clientY) => {
    const container = listRef.current
    if (!container) return 0
    const items = container.querySelectorAll('[data-group-index]')
    if (!items.length) return 0
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect()
      const mid = rect.top + rect.height / 2
      if (clientY < mid) return i
    }
    return items.length - 1
  }, [])

  const handleDragStart = useCallback((groupId) => {
    const fromIndex = groups.findIndex(g => g.id === groupId)
    if (fromIndex < 0) return
    dragStateRef.current = { fromIndex, overIndex: fromIndex }
    setDragFromIndex(fromIndex)
    setDragOverIndex(fromIndex)
  }, [groups])

  const handleDragMove = useCallback((clientY) => {
    const overIndex = resolveDropIndex(clientY)
    dragStateRef.current.overIndex = overIndex
    setDragOverIndex(overIndex)
  }, [resolveDropIndex])

  const handleDragEnd = useCallback(() => {
    const { fromIndex, overIndex } = dragStateRef.current
    dragStateRef.current = { fromIndex: null, overIndex: null }
    setDragFromIndex(null)
    setDragOverIndex(null)
    if (fromIndex != null && overIndex != null && fromIndex !== overIndex) {
      onGroupReorder(fromIndex, overIndex)
    }
  }, [onGroupReorder])

  if (!groups || !groups.length) {
    return <div />
  }

  const isDragging = dragFromIndex != null

  return (
    <div className="groups-list" ref={listRef}>
      <div className="groups-view-actions">
        <div className="groups-view-actions-left">
          {!switchOn && (
            <span className="groups-mock-hint danger">Mock 已关闭：规则仍可编辑，但不会改写响应</span>
          )}
        </div>
        <button
          type="button"
          className="groups-expand-toggle"
          title={expandAllActive ? '收起所有组与规则' : '展开所有组与规则'}
          aria-label={expandAllActive ? '收起全部' : '展开全部'}
          onClick={() => onExpandCollapseAll(!expandAllActive)}
        >
          <Icon type={expandAllActive ? 'menu-fold' : 'menu-unfold'} />
        </button>
      </div>
      {groups.map((group, index) => {
        const groupDisabled = group.switchOn === false
        const groupRules = rules
          .map((r, i) => ({ r, i }))
          .filter(({ r }) => r.groupId === group.id)
        const isExpanded = isGroupExpanded(group)
        const ruleActiveKeys = groupRules
          .filter(({ r }) => isRuleExpanded(r))
          .map(({ r }) => r.key)
        const isDragSource = isDragging && dragFromIndex === index
        const showDropBefore = isDragging && dragOverIndex === index

        return (
          <div
            key={group.id}
            data-group-index={index}
            className={[
              'rule-group',
              groupDisabled ? 'rule-group--disabled' : '',
              isDragSource ? 'rule-group--dragging' : '',
              showDropBefore ? 'rule-group--drop-target' : ''
            ].filter(Boolean).join(' ')}
            title={groupDisabled ? '组开关已关闭：组内规则暂不拦截，可重新打开组开关恢复' : undefined}
          >
            <Collapse
              bordered={false}
              openAnimation={collapseOpenAnimation}
              activeKey={isExpanded ? [group.id] : []}
              onChange={(keys) => {
                const open = keys.indexOf(group.id) >= 0
                if (open !== isExpanded) {
                  onGroupExpandedChange(open, group.id)
                }
              }}
              expandIcon={() => null}
              className="group-outer-collapse collapse"
            >
              <Panel
                key={group.id}
                showArrow={false}
                header={(
                  <GroupPanelHeader
                    group={group}
                    groupDisabled={groupDisabled}
                    isExpanded={isExpanded}
                    onGroupNameChange={onGroupNameChange}
                    onGroupDomainChange={onGroupDomainChange}
                    onFlushGroupsToStorage={onFlushGroupsToStorage}
                    onGroupSwitchChange={onGroupSwitchChange}
                    onAddRuleInGroup={onAddRuleInGroup}
                    onRemoveGroup={onRemoveGroup}
                    onToggle={toggleGroup}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                  />
                )}
              >
                <Collapse
                  openAnimation={collapseOpenAnimation}
                  className="rules-inner-collapse"
                  activeKey={ruleActiveKeys}
                  onChange={(keys) => onGroupRulesCollapseChange(group.id, keys)}
                >
                  {groupRules.map(({
                    r: {
                      filterType = 'normal',
                      limitMethod = 'ALL',
                      match,
                      label,
                      switchOn: ruleSwitchOn = true,
                      key
                    },
                    i
                  }) => {
                    const ruleMoreMenu = (
                      <Menu
                        onClick={({ key: menuKey, domEvent }) => {
                          if (domEvent) {
                            domEvent.stopPropagation()
                            domEvent.preventDefault()
                          }
                          if (menuKey === 'duplicate') onDuplicateRule({ stopPropagation () {} }, i)
                          if (menuKey === 'remove') onRemoveRule({ stopPropagation () {} }, key)
                        }}
                      >
                        <Menu.Item key="duplicate" disabled={groupDisabled}>复制规则</Menu.Item>
                        <Menu.Item key="remove" disabled={groupDisabled}>
                          <span className="menu-item-danger">删除规则</span>
                        </Menu.Item>
                      </Menu>
                    )

                    return (
                      <Panel
                        key={key}
                        header={(
                          <div
                            className="panel-header-wrap"
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="panel-header">
                              <Input
                                className="rule-label-input"
                                placeholder="备注"
                                defaultValue={label}
                                onChange={e => onLabelChange(e, i)}
                                disabled={groupDisabled}
                              />
                              <div className="rule-match-compact">
                                <Select
                                  className="rule-method-select"
                                  size="default"
                                  defaultValue={limitMethod}
                                  onChange={e => onLimitMethodChange(e, i)}
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
                                <Input
                                  className="rule-match-input"
                                  placeholder={filterType === 'normal' ? '路径 eg: abc/get' : '正则 eg: abc.*'}
                                  defaultValue={match}
                                  onChange={e => onMatchChange(e, i)}
                                  disabled={groupDisabled}
                                />
                              </div>
                              <div className="button-group">
                                <Switch
                                  size="small"
                                  defaultChecked={ruleSwitchOn}
                                  onChange={val => onRuleSwitchChange(val, i)}
                                  style={{ width: '28px', flex: 'none', marginRight: '4px' }}
                                  disabled={groupDisabled}
                                />
                                <Dropdown
                                  overlay={ruleMoreMenu}
                                  trigger={['click']}
                                  placement="bottomRight"
                                >
                                  <Button
                                    type="link"
                                    size="small"
                                    className="header-more-btn"
                                    title="更多"
                                    disabled={groupDisabled}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <Icon type="ellipsis" />
                                  </Button>
                                </Dropdown>
                              </div>
                            </div>
                          </div>
                        )}
                      >
                        <Replacer
                          key={`${settingsRevision}-${key}`}
                          updateAddBtnTop_interval={updateAddBtnTop_interval}
                          index={i}
                          set={set}
                          disabled={groupDisabled}
                          groupId={group.id}
                          filterType={filterType}
                          onFilterTypeChange={onFilterTypeChange}
                          settingsRevision={settingsRevision}
                        />
                      </Panel>
                    )
                  })}
                </Collapse>
              </Panel>
            </Collapse>
          </div>
        )
      })}
    </div>
  )
}
