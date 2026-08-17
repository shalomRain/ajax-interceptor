import React from 'react'

/**
 * 组/规则级慢网开关：样式与全局一致；关=继承上级；开=使用全局延迟时间
 */
export default function SlowNetworkInline ({
  switchOn,
  disabled,
  title,
  onToggle
}) {
  const isOn = !!switchOn
  return (
    <div
      className={`toolbar-capability toolbar-capability--inline${isOn ? ' is-on' : ''}${disabled ? ' is-disabled' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="toolbar-capability-status"
        title={title}
        disabled={disabled}
        onClick={onToggle}
      >
        {isOn ? '慢网 · ON' : '慢网 · OFF'}
      </button>
    </div>
  )
}
