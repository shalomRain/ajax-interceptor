English | [简体中文](./README-zh.md)   

<img src="https://github.com/YGYOOO/ajax-interceptor/raw/master/readmeImgs/Ajax_Modifier.png" width="220">   

[![](https://img.shields.io/chrome-web-store/v/nhpjggchkhnlbgdfcbgpdpkifemomkpg.svg?logo=Google%20Chrome&logoColor=white&color=blue&style=flat-square)](https://chrome.google.com/webstore/detail/ajax-interceptor/nhpjggchkhnlbgdfcbgpdpkifemomkpg) 
[![](https://img.shields.io/chrome-web-store/stars/nhpjggchkhnlbgdfcbgpdpkifemomkpg.svg?logo=Google%20Chrome&logoColor=white&color=blue&style=flat-square)](https://chrome.google.com/webstore/detail/ajax-interceptor/nhpjggchkhnlbgdfcbgpdpkifemomkpg) 
[![](https://img.shields.io/chrome-web-store/users/nhpjggchkhnlbgdfcbgpdpkifemomkpg.svg?logo=Google%20Chrome&logoColor=white&color=blue&style=flat-square)](https://chrome.google.com/webstore/detail/ajax-interceptor/nhpjggchkhnlbgdfcbgpdpkifemomkpg)    

[![](https://img.shields.io/github/followers/YGYOOO.svg?label=Follow&style=social)](https://github.com/YGYOOO)
[![](https://img.shields.io/badge/Follow%20@卧槽竟然是YGY的微博--brightgreen.svg?logo=Sina%20Weibo&style=social)](https://weibo.com/u/5352731024)
[![](https://img.shields.io/badge/Follow%20@YGYOOO--brightgreen.svg?logo=Twitter&style=social)](https://twitter.com/YGYOOO)

A Chrome extension for modifying any Ajax requests or responses easily. You can use it to debug errors or mock data.

## Install

https://chrome.google.com/webstore/detail/ajax-interceptor/nhpjggchkhnlbgdfcbgpdpkifemomkpg

Or load the unpacked extension from the project root in `chrome://extensions/` (Developer mode).

## Notes

1. It is recommended to disable cache (DevTools → Network → Disable cache) when using this extension.
2. It is recommended to turn off this extension when you are not using it.
3. This extension only overrides the response data in the XMLHttpRequest object as well as the fetch method. The "original" response which you can see in DevTools' "Network" panel will not be changed.

## Release Notes

### version 0.0.3

- Add global request headers management
- Improve status label display and global headers editing experience

### version 0.0.2

- Add drag-and-drop reordering for rule groups
- Add expand/collapse for groups and rules, with state persistence
- Enhance toolbar UI and interactions
- Add comprehensive usage documentation ([docs.html](./docs.html))

### version 0.0.1

- Add rule groups with per-group name, domain, and switch
- Support Mock.js templates and ts-mock (TypeScript interface to Mock template)
- Refactor iframe and content script communication
- Improve rule management, UI components, and panel layout

### version 0.0.0

Original plugin developed by [YGYOOO](https://github.com/YGYOOO). Core capabilities include:

- Intercept and modify XMLHttpRequest and fetch responses at the JavaScript level
- Match rules by URL (string or regex) and HTTP method
- Replace responses with custom JSON or advanced-mode functions (headers, query params, request body, response)
- Support non-200 status code response modification
- Single-rule toggle, panel position (floating / DevTools), and configuration import/export
- Request URL autofill, onload interception fix, and other stability improvements
