import React from 'react'
import { Modal, Button, Radio, Icon } from 'antd'
import GlobalHeadersEditor from './GlobalHeadersEditor'
import SlowNetworkEditor from './SlowNetworkEditor'

export default function MainModals ({
  settingModalVisible,
  globalHeadersModalVisible,
  slowNetworkModalVisible,
  infoModalVisible,
  imageModalVisible,
  customFunction,
  globalHeaders,
  slowNetwork,
  positionClass,
  onSettingCancel,
  onSettingConfirm,
  onPositionChange,
  onGlobalHeadersChange,
  onGlobalHeadersCancel,
  onGlobalHeadersConfirm,
  onSlowNetworkChange,
  onSlowNetworkCancel,
  onSlowNetworkConfirm,
  onShowImageModal,
  onImageModalClose,
  onInfoModalClose
}) {
  return (
    <>
      <Modal
        visible={settingModalVisible}
        title="Settings"
        width="410px"
        onCancel={onSettingCancel}
        footer={[
          <Button key="Cancel" onClick={onSettingCancel}>
            Cancel
          </Button>,
          <Button key="Submit" type="primary" onClick={onSettingConfirm}>
            Submit
          </Button>,
        ]}
      >
        <div className="settings-section">
          <span>Position:</span>
          <Radio.Group
            onChange={onPositionChange}
            value={customFunction.panelPosition}
            style={{ marginLeft: '20px' }}
          >
            <Radio value={0}>
              <span>Suspend(Default)</span>
              <Icon type="question-circle" className="radio-icon" onClick={() => onShowImageModal('suspend')} />
            </Radio>
            <Radio value={1}>
              <span>Devtools</span>
              <Icon type="question-circle" className="radio-icon" onClick={() => onShowImageModal('devtools')} />
            </Radio>
          </Radio.Group>
        </div>
      </Modal>
      <Modal
        visible={globalHeadersModalVisible}
        title="Request Headers"
        width="640px"
        onCancel={onGlobalHeadersCancel}
        footer={[
          <Button key="Cancel" onClick={onGlobalHeadersCancel}>
            Cancel
          </Button>,
          <Button key="Submit" type="primary" onClick={onGlobalHeadersConfirm}>
            Submit
          </Button>,
        ]}
      >
        <GlobalHeadersEditor
          value={globalHeaders}
          onChange={onGlobalHeadersChange}
        />
      </Modal>
      <Modal
        visible={slowNetworkModalVisible}
        title="Slow Network"
        width="640px"
        onCancel={onSlowNetworkCancel}
        footer={[
          <Button key="Cancel" onClick={onSlowNetworkCancel}>
            Cancel
          </Button>,
          <Button key="Submit" type="primary" onClick={onSlowNetworkConfirm}>
            Submit
          </Button>,
        ]}
      >
        <SlowNetworkEditor
          value={slowNetwork}
          onChange={onSlowNetworkChange}
        />
      </Modal>
      <Modal
        visible={infoModalVisible}
        onCancel={onInfoModalClose}
        footer={null}
        closable={false}
        width="410px"
        style={{ marginTop: 10 }}
      >
        <div style={{ color: '#1890ff', margin: '16px 0' }}>
          Please refresh the page and reopen the devtools after submitting.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" onClick={onInfoModalClose} style={{ float: 'right' }}>OK</Button>
        </div>
      </Modal>
      <Modal
        visible={imageModalVisible}
        onCancel={onImageModalClose}
        footer={null}
        mask={false}
        closable={false}
        width="502px"
        bodyStyle={{ padding: '8px' }}
      >
        <div onClick={onImageModalClose}>
          <div className="position-title">
            Example of {positionClass === 'suspend' ? 'Suspend(Default)' : 'Devtools'} Position:
          </div>
          <div className={`position-image image-${positionClass}`}></div>
        </div>
      </Modal>
    </>
  )
}
