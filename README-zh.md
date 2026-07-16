[English](./README.md) | 简体中文



一个可以修改页面中任意 Ajax 请求或返回值的 Chrome 插件，可用于调试/排查页面问题，或在开发时 Mock 数据。（当然你也可以用 Charles 等抓包工具修改网络请求的返回值，但操作繁琐；该插件在浏览器内即可完成，方便很多，且不会对 Chrome 之外造成影响。）

## 安装

chrome 商店地址（推荐，自动更新。需翻墙）：[https://chrome.google.com/webstore/detail/ajax-interceptor/nhpjggchkhnlbgdfcbgpdpkifemomkpg](https://chrome.google.com/webstore/detail/ajax-interceptor/nhpjggchkhnlbgdfcbgpdpkifemomkpg)

（若无法访问 chrome 商店，可以下载本项目，在 chrome://extensions/ 中打开开发者模式，选择「加载已解压的扩展程序」加载本项目）

## 注意

1. 使用该插件时，建议关闭浏览器缓存（DevTools → Network → Disable cache），可以提高页面刚加载完成时发出的 Ajax 请求的拦截成功率。
2. 当你不需要使用该插件时，建议把开关关上，以免对页面正常浏览造成影响。
3. 该插件只会在 JS 层面上对返回结果进行修改，即只会修改全局的 XMLHttpRequest 对象和 fetch 方法里的返回值，进而影响页面展现。而你在 Chrome DevTools 的 Network 里看到的请求返回结果不会有任何变化。

## 更新说明

### version 0.0.3

- 新增全局请求 Headers 管理
- 优化状态标签展示与全局 Headers 编辑体验

### version 0.0.2

- 新增规则组拖拽排序
- 新增规则组与规则的展开/折叠，并支持状态记忆
- 优化工具栏 UI 与交互
- 新增完整使用文档（[docs.html](./docs.html)）

### version 0.0.1

- 新增规则组概念，支持按组设置名称、域名与开关
- 支持 Mock.js 模板与 ts-mock（TypeScript interface 转 Mock 模板）
- 重构 iframe 与 content script 通信机制
- 优化规则管理、UI 组件与面板布局

### version 0.0.0

由 [YGYOOO](https://github.com/YGYOOO) 开发的原始版本，主要功能包括：

- 在 JS 层面拦截并修改 XMLHttpRequest 与 fetch 的响应
- 按 URL（字符串或正则）与 HTTP Method 匹配规则
- 用自定义 JSON 或专业模式函数替换响应（支持修改 Headers、查询参数、请求体、响应体）
- 支持非 200 状态码的响应修改
- 单条规则开关、面板位置切换（悬浮 / DevTools）、配置导入导出
- 请求 URL 自动补全、onload 拦截修复等稳定性改进

