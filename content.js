// const elt = document.createElement("script")
// elt.innerHTML = "window.test = 1"
// document.head.appendChild(elt)

// 在页面上插入代码
// const s1 = document.createElement('script')
// s1.setAttribute('type', 'text/javascript')
// s1.setAttribute('src', chrome.runtime.getURL('pageScripts/defaultSettings.js'))
// document.documentElement.appendChild(s1)

// 在页面上插入代码：先 Mock.js（TS MOCK 模式），再主拦截逻辑
const mockScript = document.createElement('script')
mockScript.setAttribute('type', 'text/javascript')
mockScript.setAttribute('src', chrome.runtime.getURL('pageScripts/mockjs.js'))
document.documentElement.appendChild(mockScript)

mockScript.addEventListener('load', () => {
  const script = document.createElement('script')
  script.setAttribute('type', 'text/javascript')
  script.setAttribute('src', chrome.runtime.getURL('pageScripts/main.js'))
  document.documentElement.appendChild(script)

  script.addEventListener('load', () => {
    chrome.storage.local.get(['ajaxInterceptor_switchOn', 'ajaxInterceptor_rules', 'ajaxInterceptor_groups'], (result) => {
      if (result.hasOwnProperty('ajaxInterceptor_switchOn')) {
        postMessage({type: 'ajaxInterceptor', to: 'pageScript', key: 'ajaxInterceptor_switchOn', value: result.ajaxInterceptor_switchOn})
      }
      if (result.ajaxInterceptor_groups) {
        postMessage({type: 'ajaxInterceptor', to: 'pageScript', key: 'ajaxInterceptor_groups', value: result.ajaxInterceptor_groups})
      }
      if (result.ajaxInterceptor_rules) {
        postMessage({type: 'ajaxInterceptor', to: 'pageScript', key: 'ajaxInterceptor_rules', value: result.ajaxInterceptor_rules})
      }
    })
  })
})


let iframe
let isDevtoolPosition = false
chrome.storage.local.get(['customFunction'], (result) => {
  isDevtoolPosition = !!result.customFunction?.panelPosition
  if (!result.customFunction?.panelPosition) {
    if (['complete', 'interactive'].includes(document.readyState)) {
      insertIframe()
    } else {
      document.onreadystatechange = () => {
        if (document.readyState === 'interactive') {
          insertIframe()
        }
      }
    }
  }
})

// 只在最顶层页面嵌入iframe
function insertIframe() {
  if (window.self === window.top) {
    iframe = document.createElement('iframe')
    iframe.className = "api-interceptor"
    iframe.style.setProperty('height', '100vh', 'important')
    iframe.style.setProperty('width', '800px', 'important')
    iframe.style.setProperty('min-width', '1px', 'important')
    iframe.style.setProperty('position', 'fixed', 'important')
    iframe.style.setProperty('top', '0', 'important')
    iframe.style.setProperty('right', '0', 'important')
    iframe.style.setProperty('left', 'auto', 'important')
    iframe.style.setProperty('bottom', 'auto', 'important')
    iframe.style.setProperty('z-index', '9999999999999', 'important')
    iframe.style.setProperty('transform', 'translateX(820px)', 'important')
    iframe.style.setProperty('transition', 'all .4s', 'important')
    iframe.style.setProperty('box-shadow', '0 0 15px 2px rgba(0,0,0,0.12)', 'important')
    iframe.frameBorder = "none"
    iframe.src = chrome.runtime.getURL("iframe/index.html")
    document.body.appendChild(iframe)
    let show = false
    chrome.runtime.onMessage.addListener((msg, sender) => {
      if (msg == 'toggle') {
        show = !show
        iframe.style.setProperty('transform', show ? 'translateX(0)' : 'translateX(820px)', 'important')
      }
      return Promise.resolve("Dummy response to keep the console quiet")
    })
  }
}


// 接收background.js传来的信息，转发给pageScript
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === 'ajaxInterceptor' && msg.to === 'content') {
    if (!msg.hasOwnProperty('iframeScriptLoaded')) {
      postMessage({ ...msg, to: 'pageScript' })
    }
  }
})

// 接收 pageScript 回传的预览结果，转发给 background，再由 background 转发给 iframe(扩展页)
window.addEventListener('message', function (event) {
  const data = event && event.data
  if (!data || data.type !== 'ajaxInterceptor' || data.to !== 'content') return
  if (data.action === 'mockPreviewResult') {
    chrome.runtime.sendMessage({ ...data, to: 'background' })
  }
}, false)

// window.parent.postMessage({ type: "CONTENT", text: "Hello from the webpage!" }, "*")


// var s = document.createElement('script')
// s.setAttribute('type', 'text/javascript')
// s.innerText = `console.log('test')`
// document.documentElement.appendChild(s)

chrome.runtime.sendMessage(chrome.runtime.id, {type: 'ajaxInterceptor', to: 'background', contentScriptLoaded: true})

if (isDevtoolPosition) {
  chrome.runtime.sendMessage(chrome.runtime.id, {type: 'ajaxInterceptor', to: 'iframe', contentScriptLoaded: true})
}
