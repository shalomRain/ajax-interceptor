const TIPS = {
  zh: '当前页面（如 <strong>chrome://extensions</strong>）无法注入脚本，悬浮面板不能在此打开。请切换到<strong class="accent">普通网页</strong>后再点击扩展图标。',
  en: 'This page (e.g. <strong>chrome://extensions</strong>) cannot run content scripts, so the floating panel cannot open here. Switch to a <strong class="accent">normal webpage</strong>, then click the extension icon again.'
}

const tipMsg = document.getElementById('tipMsg')
const langSwitch = document.getElementById('langSwitch')
const langLabels = document.querySelectorAll('.lang-label')

function applyLang (lang) {
  const next = lang === 'en' ? 'en' : 'zh'
  tipMsg.innerHTML = TIPS[next]
  langSwitch.classList.toggle('is-en', next === 'en')
  langLabels.forEach((el) => {
    el.classList.toggle('active', el.dataset.lang === next)
  })
  try {
    localStorage.setItem('ajaxModifier_restrictedTipLang', next)
  } catch (_) {}
}

function getInitialLang () {
  try {
    const saved = localStorage.getItem('ajaxModifier_restrictedTipLang')
    if (saved === 'en' || saved === 'zh') return saved
  } catch (_) {}
  return 'zh'
}

langSwitch.addEventListener('click', () => {
  applyLang(langSwitch.classList.contains('is-en') ? 'zh' : 'en')
})

langLabels.forEach((el) => {
  el.addEventListener('click', () => applyLang(el.dataset.lang))
})

applyLang(getInitialLang())

// 提示已展示：清掉临时 popup，避免回到普通页后仍误开提示窗
chrome.runtime.sendMessage({
  type: 'ajaxInterceptor',
  to: 'background',
  action: 'clearRestrictedTipPopup'
})
