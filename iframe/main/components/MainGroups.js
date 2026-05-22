import React from 'react'
import { Collapse, Input, Select, Button, Switch } from 'antd'
import Replacer from './Replacer'
import MatchUrlPreview from './MatchUrlPreview'

const { Option } = Select
const Panel = Collapse.Panel

export default function MainGroups ({
  switchOn,
  groups,
  rules,
  onGroupNameChange,
  onGroupDomainChange,
  onFlushGroupsToStorage,
  onGroupSwitchChange,
  onAddRuleInGroup,
  onRemoveGroup,
  onCollapseChange,
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
  if (!groups || !groups.length) {
    return <div />
  }

  return (
    <div>
      {groups.map((group) => {
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
                <span className="group-disabled-badge">已关闭 · 本组规则暂不生效</span>
              ) : null}
              <Button
                type="dashed"
                size="small"
                onClick={() => onAddRuleInGroup(group.id)}
                disabled={groupDisabled}
              >
                + 规则
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => onRemoveGroup(group.id)}
              >
                删组
              </Button>
            </div>
            <Collapse
              className={switchOn ? 'collapse' : 'collapse collapse-hidden'}
              onChange={onCollapseChange}
            >
              {rules
                .map((r, i) => ({ r, i }))
                .filter(({ r }) => r.groupId === group.id)
                .map(({
                  r: {
                    filterType = 'normal',
                    limitMethod = 'ALL',
                    match,
                    label,
                    switchOn: ruleSwitchOn = true,
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
                              placeholder="备注名（可选）"
                              style={{ width: '1px', maxWidth: '140px', flex: 'auto', display: 'inline-block' }}
                              defaultValue={label}
                              onChange={e => onLabelChange(e, i)}
                              disabled={groupDisabled}
                            />
                            <Select
                              defaultValue={limitMethod}
                              style={{ width: '1px', maxWidth: '90px', flex: '1.5 1 auto', display: 'inline-block' }}
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
                            <Select
                              defaultValue={filterType}
                              style={{ width: '1px', maxWidth: '90px', flex: '1.5 1 auto', display: 'inline-block' }}
                              onChange={e => onFilterTypeChange(e, i)}
                              disabled={groupDisabled}
                            >
                              <Option value="normal">normal</Option>
                              <Option value="regex">regex</Option>
                            </Select>
                            <Input
                              placeholder={filterType === 'normal' ? 'eg: abc/get' : 'eg: abc.*'}
                              style={{ width: '1px', flex: '1.5 1 auto', display: 'inline-block' }}
                              defaultValue={match}
                              onChange={e => onMatchChange(e, i)}
                              disabled={groupDisabled}
                            />
                          </Input.Group>
                          <div className="button-group">
                            <Switch
                              size="small"
                              defaultChecked={ruleSwitchOn}
                              onChange={val => onRuleSwitchChange(val, i)}
                              style={{ width: '28px', flex: 'none', marginRight: '8px' }}
                              disabled={groupDisabled}
                            />
                            <Button
                              type="primary"
                              shape="circle"
                              icon="plus"
                              size="small"
                              title="复制本规则（同组内新增一条，可改路径 match 与响应体）"
                              onClick={e => onDuplicateRule(e, i)}
                              style={{ width: '24px', flex: 'none', marginRight: 4 }}
                              disabled={groupDisabled}
                            />
                            <Button
                              type="primary"
                              shape="circle"
                              icon="minus"
                              size="small"
                              onClick={e => onRemoveRule(e, i)}
                              style={{ width: '24px', flex: 'none' }}
                              disabled={groupDisabled}
                            />
                          </div>
                        </div>
                        <MatchUrlPreview
                          groupId={group.id}
                          ruleIndex={i}
                          settingsRevision={settingsRevision}
                        />
                      </div>
                    }
                  >
                    <Replacer
                      key={`${settingsRevision}-${key}`}
                      updateAddBtnTop_interval={updateAddBtnTop_interval}
                      index={i}
                      set={set}
                      disabled={groupDisabled}
                    />
                  </Panel>
                ))}
            </Collapse>
          </div>
        )
      })}
    </div>
  )
}
