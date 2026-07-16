let contentLoadedIds = []
let lastPanelPosition = 0

chrome.scripting.getRegisteredContentScripts({ ids: ["testing-scripts-gen"] },
  async (scripts) => {
    if (scripts && scripts.length) {
      await chrome.scripting.unregisterContentScripts({
        ids: ["testing-scripts-gen"]
      })
    }
    chrome.scripting
      .registerContentScripts([{
        id: "testing-scripts-gen",
        js: ['./content.js'],
        matches: ['<all_urls>'],
        runAt: "document_start",
        allFrames: true
      }])
  }
)

chrome.action.onClicked.addListener(function (tab) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    handleContentSend(tabs[0].id, "toggle")
  })
})

// 页面关闭，移除id
chrome.tabs.onRemoved.addListener(function (tabId) {
  contentLoadedIds = contentLoadedIds.filter(id => id !== tabId)
})

function handleContentSend(tabId, params = null) {
  if (contentLoadedIds.includes(tabId)) {
    chrome.tabs.sendMessage(tabId, params)
  } else {
    chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['content.js']
    }).then(() => {
      chrome.tabs.sendMessage(tabId, params)
    })
  }
}

// 接收iframe传来的信息，转发给content.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // ts-mock 预览：iframe(扩展页) -> background -> content -> pageScript(页面环境) -> 回传 iframe
  if (msg && msg.type === 'ajaxInterceptor' && msg.to === 'background' && msg.action === 'mockPreview') {
    const { requestId, templateText } = msg
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || !tabs.length) {
        chrome.runtime.sendMessage(chrome.runtime.id, {
          type: 'ajaxInterceptor',
          to: 'iframe',
          action: 'mockPreviewResult',
          requestId,
          ok: false,
          error: '未找到当前活动标签页'
        })
        return
      }
      handleContentSend(tabs[0].id, {
        type: 'ajaxInterceptor',
        to: 'content',
        action: 'mockPreview',
        requestId,
        templateText
      })
    })
    return
  }

  if (msg && msg.type === 'ajaxInterceptor' && msg.to === 'background' && msg.action === 'mockPreviewResult') {
    chrome.runtime.sendMessage(chrome.runtime.id, { ...msg, to: 'iframe' })
    return
  }

  if (msg.type === 'ajaxInterceptor' && msg.to === 'background') {
    if (msg.hasOwnProperty('contentScriptLoaded')) {
      msg.contentScriptLoaded && chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        tabs && tabs.length && !contentLoadedIds.includes(tabs[0].id) && contentLoadedIds.push(tabs[0].id)
      })
      // 收到的传送信息是contentScriptLoaded，说明是刷新状态，更新popup
      chrome.storage.local.get(['customFunction'], (result) => {
        lastPanelPosition = !!result.customFunction?.panelPosition
        setPopup(!!result.customFunction?.panelPosition)
      })
    }
    // 用消息里的最新值合并计算，避免 storage.set 尚未完成时读到旧状态
    if (msg.key === 'ajaxInterceptor_switchOn' || msg.key === 'ajaxInterceptor_globalHeaders') {
      updateActionIcon({ [msg.key]: msg.value })
    }
    if (msg.key === 'customFunction') {
      setPopup(msg.value.panelPosition)
    }
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs.length) {
        handleContentSend(tabs[0].id, { ...msg, to: 'content' })
      } else if (msg.hasOwnProperty('iframeScriptLoaded')) {
        // 收到的传送信息是iframeScriptLoaded，说明是suspend刷新状态，提示需要在页面上刷新（只有在suspend时才会有此类情况）
        console.warn("[Ajax Modifier] To make the Ajax Modifier work, please do not refresh on devtools.")
      } else if (msg.key === "ajaxInterceptor_rules" || msg.key === 'ajaxInterceptor_switchOn' || msg.key === 'ajaxInterceptor_groups' || msg.key === 'ajaxInterceptor_globalHeaders') {
        // 收到的传送信息是修改rules且拿不到tab，说明内容也更新不到page script上，提示需要刷新（只有在分离的devtools时才会有此类情况）
        chrome.runtime.sendMessage(chrome.runtime.id, {type: 'ajaxInterceptor', to: 'iframe', showFreshTip: true})
      }
    })
  }
})

/** 图标作总状态：Mock 开关或 Headers 开关任一为开 → 亮；都关 → 暗 */
function isAnyCapabilityActive (result) {
  const mockOn = !!result.ajaxInterceptor_switchOn
  const gh = result.ajaxInterceptor_globalHeaders
  const headersOn = !!(gh && gh.switchOn)
  return mockOn || headersOn
}

function updateActionIcon (override = {}) {
  chrome.storage.local.get(['ajaxInterceptor_switchOn', 'ajaxInterceptor_globalHeaders'], (result) => {
    const merged = { ...result, ...override }
    if (isAnyCapabilityActive(merged)) {
      chrome.action.setIcon({
        path: {
          16: '/images/16.png',
          32: '/images/32.png',
          48: '/images/48.png',
          128: '/images/128.png',
        }
      })
    } else {
      chrome.action.setIcon({
        path: {
          16: '/images/16_gray.png',
          32: '/images/32_gray.png',
          48: '/images/48_gray.png',
          128: '/images/128_gray.png',
        }
      })
    }
  })
}

// storage 落盘后再校准一次，防止只写 storage、未走消息时图标不同步（如导入配置）
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return
  if (changes.ajaxInterceptor_switchOn || changes.ajaxInterceptor_globalHeaders) {
    updateActionIcon()
  }
})

updateActionIcon()

function setPopup(curPanelPosition = false) {
  // panelPosition - 0:页面悬浮面板, 1:devTools
  // 面板从devtools切换为悬浮，提示需要刷新
  if (lastPanelPosition && !curPanelPosition) {
    chrome.action.setPopup({ popup: 'popupSusFresh.html' })
  } else {   // 其他情况，判断当前是devtools，则提示打开devtools
    chrome.action.setPopup({ popup: curPanelPosition ? 'popupDev.html' : '' })
  }
  // 面板从悬浮切换为devtools，悬浮面板消失
  if (!lastPanelPosition && curPanelPosition) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      handleContentSend(tabs[0].id, "toggle")
    })
  }
  lastPanelPosition = curPanelPosition
}