// 命名空间
let ajax_interceptor_qoweifjqon = {
  settings: {
    ajaxInterceptor_switchOn: false,
    ajaxInterceptor_always200On: true, // 默认开启，后期可以扩展成设置项
    ajaxInterceptor_groups: [],
    ajaxInterceptor_rules: [],
  },
  isRuleGroupOn: (item) => {
    const groupId = item && item.groupId
    const groups = ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_groups || []
    if (!groupId) {
      return !groups.length || (groups[0] && groups[0].switchOn)
    }
    const g = groups.find(x => x && x.id === groupId)
    if (!g) return true
    return g.switchOn !== false
  },
  getGroupById: (groupId) => {
    const groups = ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_groups || []
    if (!groupId) return groups[0] || null
    return groups.find(x => x && x.id === groupId) || null
  },
  normalizeGroupDomain: (domain) => {
    if (!domain || typeof domain !== 'string') return ''
    let d = domain.trim()
    if (!d) return ''
    try {
      if (/^https?:\/\//i.test(d)) {
        return new URL(d).host.toLowerCase()
      }
    } catch (e) {}
    return d.split('/')[0].split('?')[0].toLowerCase()
  },
  joinDomainAndPath: (domain, path) => {
    const host = ajax_interceptor_qoweifjqon.normalizeGroupDomain(domain)
    const p = (path || '').trim()
    if (!host) return p
    if (!p) return host
    const pathPart = p.startsWith('/') ? p : '/' + p
    return host + pathPart
  },
  /** 组未填域名时不限制；填写后请求 host 须与域名一致 */
  isGroupDomainMatch: (requestUrl, groupId) => {
    const group = ajax_interceptor_qoweifjqon.getGroupById(groupId)
    const domain = ajax_interceptor_qoweifjqon.normalizeGroupDomain(group && group.domain)
    if (!domain) return true
    try {
      const host = new URL(requestUrl, window.location.href).host.toLowerCase()
      return host === domain
    } catch (e) {
      return false
    }
  },
  /** 组有域名时仅在 pathname+search 上匹配路径；无域名时在完整 URL 上匹配（兼容旧行为） */
  getRuleMatchTarget: (requestUrl, groupId) => {
    const group = ajax_interceptor_qoweifjqon.getGroupById(groupId)
    const domain = ajax_interceptor_qoweifjqon.normalizeGroupDomain(group && group.domain)
    if (!domain) return requestUrl
    try {
      const u = new URL(requestUrl, window.location.href)
      return u.pathname + u.search
    } catch (e) {
      return requestUrl
    }
  },
  // 获取匹配到的规则项
  getMatchedInterface: ({
    thisRequestUrl = '',
    thisMethod = ''
  }) => {
    return ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_rules.find(item => {
      const {
        filterType = 'normal', limitMethod = 'ALL', switchOn = true, match
      } = item
      if (!match || !switchOn || !ajax_interceptor_qoweifjqon.isRuleGroupOn(item)) {
        return false
      }
      if (!ajax_interceptor_qoweifjqon.isGroupDomainMatch(thisRequestUrl, item.groupId)) {
        return false
      }
      const matchedMethod = thisMethod === limitMethod || limitMethod === 'ALL'
      const group = ajax_interceptor_qoweifjqon.getGroupById(item.groupId)
      const groupDomain = ajax_interceptor_qoweifjqon.normalizeGroupDomain(group && group.domain)
      const matchTarget = ajax_interceptor_qoweifjqon.getRuleMatchTarget(thisRequestUrl, item.groupId)
      let matchedRequest = false
      if (filterType === 'normal') {
        if (groupDomain) {
          const combined = ajax_interceptor_qoweifjqon.joinDomainAndPath(group && group.domain, match)
          const pathNorm = match.startsWith('/') ? match : '/' + match
          matchedRequest = thisRequestUrl.indexOf(combined) > -1 ||
            matchTarget.indexOf(match) > -1 ||
            matchTarget.indexOf(pathNorm) > -1
        } else {
          matchedRequest = matchTarget.indexOf(match) > -1
        }
      } else if (filterType === 'regex') {
        matchedRequest = !!matchTarget.match(new RegExp(match, 'i'))
      }
      return matchedMethod && matchedRequest
    })
  },
  // 执行用户输入的函数，如果有错误会抛出到控制台
  executeStringFunction: (stringFunction, args, funcName = '') => {
    try {
      stringFunction = (new Function('...args', stringFunction))(args)
    } catch (e) {
      console.error(`[Ajax Modifier] ExecuteFunctionError: Please check the ${funcName} function.\n`, e)
    }
    return stringFunction;
  },
  /** replaceMode: json | advanced | mockjs | ts-mock；未设置时按 isExpert 兼容旧数据 */
  isAdvancedRule: (item) => {
    if (!item) return false
    const m = item.replaceMode
    if (m === 'advanced') return true
    if (m === 'json' || m === 'mockjs' || m === 'ts-mock') return false
    return !!item.isExpert
  },
  /** mockjs / ts-mock 均使用 overrideTxt 存 Mock 模板 JSON（ts-mock 在面板内由 TS 生成） */
  isMockjsTemplateRule: (item) => item && (item.replaceMode === 'mockjs' || item.replaceMode === 'ts-mock'),
  /**
   * 兼容别名：Mock.js 内置没有 @number（只有 @integer/@float/@natural...）
   * 如果用户写了 @number 或 @number(a,b)，这里自动转换为 @integer(...)
   */
  normalizeMockTemplate: (input) => {
    const walk = (val) => {
      if (val == null) return val
      if (Array.isArray(val)) return val.map(walk)
      if (typeof val === 'object') {
        const out = {}
        Object.keys(val).forEach((k) => {
          out[k] = walk(val[k])
        })
        return out
      }
      if (typeof val === 'string') {
        const s = val.trim()
        if (s === '@number') return '@integer(0, 999999999)'
        if (s.startsWith('@number(') && s.endsWith(')')) {
          return '@integer' + s.slice('@number'.length)
        }
        return val
      }
      return val
    }
    return walk(input)
  },
  mockResponseFromOverrideTxt: (overrideTxt) => {
    try {
      if (typeof Mock === 'undefined') {
        console.error('[Ajax Modifier] Mock.js is not loaded.')
        return overrideTxt
      }
      const template = ajax_interceptor_qoweifjqon.normalizeMockTemplate(JSON.parse(overrideTxt))
      const data = Mock.mock(template)
      return typeof data === 'string' ? data : JSON.stringify(data)
    } catch (e) {
      console.error('[Ajax Modifier] Mock.js template generate error:\n', e)
      return overrideTxt
    }
  },
  getRequestParams: (requestUrl) => {
    if (!requestUrl) {
      return null;
    }
    const paramStr = requestUrl.split('?').pop();
    const keyValueArr = paramStr.split('&');
    let keyValueObj = {};
    keyValueArr.forEach((item) => {
      // 保证中间不会把=给忽略掉
      const itemArr = item.replace('=', '〓').split('〓');
      const itemObj = {
        [itemArr[0]]: itemArr[1]
      };
      keyValueObj = Object.assign(keyValueObj, itemObj);
    });
    return keyValueObj;
  },
  getCompleteUrl: (inputUrl) => {
    let url = inputUrl.trim()
    const protocol = window.location.protocol
    const host = window.location.host
    const currentUrl = window.location.href
    try {
      // 如果解析成功，表示输入是完整的URL，不需要处理
      new URL(url)
    } catch (e) {
      if (url.startsWith("./") || url.startsWith("../")) {
        // 相对路由
        url = new URL(url, currentUrl).href
      } else if (url.startsWith("//")) {
        // 只缺少协议，补全协议
        url = protocol + url
      } else {
        // 既没有协议也没有域名，补全域名和协议
        url = protocol + "//" + host + (url.startsWith("/") ? "" : "/") + url
      }
    }
    return url
  },
  originalXHR: window.XMLHttpRequest,
  myXHR: function () {
    const modifyResponse = () => {
      const [method, requestUrl] = this._openArgs
      const queryParams = ajax_interceptor_qoweifjqon.getRequestParams(requestUrl)
      const [requestPayload] = this._sendArgs
      const matchedInterface = this._matchedInterface
      if (matchedInterface && (matchedInterface.overrideTxt || matchedInterface.overrideResponseFunc)) {
        const {
          overrideTxt,
          overrideResponseFunc
        } = matchedInterface
        const isAdvanced = ajax_interceptor_qoweifjqon.isAdvancedRule(matchedInterface)
        const isMockjs = ajax_interceptor_qoweifjqon.isMockjsTemplateRule(matchedInterface)
        let overrideResponse = undefined
        let overrideStatus = undefined
        let overrideStatusText = undefined
        if (overrideResponseFunc && isAdvanced) {
          // Advanced：用函数替换
          const funcArgs = {
            method,
            payload: {
              queryParams,
              requestPayload
            },
            orgResponse: this.response,
            orgStatus: this.status,
            orgStatusText: this.statusText
          }
          const res = ajax_interceptor_qoweifjqon.executeStringFunction(overrideResponseFunc, funcArgs, 'response')
          // 返回是对象才处理
          if (typeof res === 'object' && res !== null) {
            const {
              response: newResponse = undefined,
              status: newStatus = undefined,
              statusText: newStatusText = undefined
            } = res
            overrideResponse = newResponse
            overrideStatus = newStatus
            overrideStatusText = newStatusText
          } else {
            console.error(`[Ajax Modifier] ExecuteFunctionError: Please check your return in the response function. See more details in the examples. \n`)
          }
        } else if (overrideTxt && isMockjs) {
          // Mock.js / ts-mock：overrideTxt 为 Mock 模板 JSON，每次请求重新随机
          overrideResponse = ajax_interceptor_qoweifjqon.mockResponseFromOverrideTxt(overrideTxt)
          if (ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_always200On && this.status !== 200) {
            overrideStatus = 200
            overrideStatusText = 'OK'
          }
        } else if (overrideTxt && !isAdvanced) {
          // 普通 JSON，直接替换
          overrideResponse = overrideTxt
          if (ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_always200On && this.status !== 200) {
            overrideStatus = 200
            overrideStatusText = 'OK'
          }
        }
        // 没有返回不替换
        this.responseText = overrideResponse !== undefined ? overrideResponse : this.responseText
        this.response = overrideResponse !== undefined ? overrideResponse : this.response
        this.status = overrideStatus !== undefined ? overrideStatus : this.status
        this.statusText = overrideStatusText !== undefined ? overrideStatusText : this.statusText
      }
    }

    const xhr = new ajax_interceptor_qoweifjqon.originalXHR
    for (let attr in xhr) {
      if (attr === 'onreadystatechange') {
        xhr.onreadystatechange = (...args) => {
          if (this.readyState === 4) {
            // 请求成功
            modifyResponse()
          }
          this.onreadystatechange && this.onreadystatechange.apply(this, args)
        }
        this.onreadystatechange = null
        continue
      } else if (attr === 'onload') {
        xhr.onload = (...args) => {
          // 请求成功
          modifyResponse()
          this.onload && this.onload.apply(this, args)
        }
        this.onload = null
        continue
      } else if (attr === 'open') {
        this.open = (...args) => {
          this._openArgs = args
          const [method, requestUrl] = args
          this._matchedInterface = ajax_interceptor_qoweifjqon.getMatchedInterface({
            thisRequestUrl: ajax_interceptor_qoweifjqon.getCompleteUrl(requestUrl),
            thisMethod: method
          })
          const matchedInterface = this._matchedInterface
          // modify request
          if (matchedInterface) {
            const {
              overridePayloadFunc
            } = matchedInterface
            const isAdvanced = ajax_interceptor_qoweifjqon.isAdvancedRule(matchedInterface)
            if (overridePayloadFunc && isAdvanced && args[0] && args[1] && args[0].toUpperCase() === 'GET') {
              const queryParams = ajax_interceptor_qoweifjqon.getRequestParams(args[1])
              const data = {
                requestUrl: args[1],
                queryParams
              }
              args[1] = ajax_interceptor_qoweifjqon.executeStringFunction(overridePayloadFunc, data, 'payload')
            }
          }
          xhr.open && xhr.open.apply(xhr, args)
        }
        continue
      } else if (attr === 'setRequestHeader') {
        this.setRequestHeader = (...args) => {
          // get headers
          this._headerArgs = this._headerArgs ? Object.assign(this._headerArgs, {
            [args[0]]: args[1]
          }) : {
            [args[0]]: args[1]
          };
          const matchedInterface = this._matchedInterface;
          if (!(matchedInterface && matchedInterface.overrideHeadersFunc && ajax_interceptor_qoweifjqon.isAdvancedRule(matchedInterface))) { // 没有要拦截修改或添加的header
            xhr.setRequestHeader && xhr.setRequestHeader.apply(xhr, args);
          }
        }
        continue;
      } else if (attr === 'send') {
        this.send = (...args) => {
          const matchedInterface = this._matchedInterface
          if (matchedInterface) {
            // modify headers
            const {
              overrideHeadersFunc,
              overridePayloadFunc
            } = matchedInterface
            const isAdvanced = ajax_interceptor_qoweifjqon.isAdvancedRule(matchedInterface)
            if (overrideHeadersFunc && isAdvanced) {
              const headers = ajax_interceptor_qoweifjqon.executeStringFunction(overrideHeadersFunc, this._headerArgs, 'headers')
              Object.keys(headers).forEach((key) => {
                xhr.setRequestHeader && xhr.setRequestHeader.apply(xhr, [key, headers[key]]);
              })
            }
            // modify not GET payload
            const [method] = this._openArgs
            if (overridePayloadFunc && isAdvanced && method !== 'GET') {
              args[0] = ajax_interceptor_qoweifjqon.executeStringFunction(overridePayloadFunc, args[0], 'payload');
            }
          }
          this._sendArgs = args
          xhr.send && xhr.send.apply(xhr, args)
        }
        continue
      }

      if (typeof xhr[attr] === 'function') {
        this[attr] = xhr[attr].bind(xhr)
      } else {
        // responseText和response不是writeable的，但拦截时需要修改它，所以修改就存储在this[`_${attr}`]上
        if (['responseText', 'response', 'status', 'statusText'].includes(attr)) {
          Object.defineProperty(this, attr, {
            get: () => this[`_${attr}`] == undefined ? xhr[attr] : this[`_${attr}`],
            set: (val) => this[`_${attr}`] = val,
            enumerable: true
          })
        } else {
          Object.defineProperty(this, attr, {
            get: () => xhr[attr],
            set: (val) => xhr[attr] = val,
            enumerable: true
          })
        }
      }
    }
  },
  originalFetch: window.fetch.bind(window),
  myFetch: async function (...args) {

    const getOriginalResponse = async (stream) => {
      let text = '';
      const decoder = new TextDecoder('utf-8');
      const reader = stream.getReader();
      const processData = (result) => {
        if (result.done) {
          return text;
        }
        const value = result.value; // Uint8Array
        text += decoder.decode(value, {
          stream: true
        });
        // 读取下一个文件片段，重复处理步骤
        return reader.read().then(processData);
      };
      return await reader.read().then(processData);
    }

    async function readReadableStream(readableStream) {
      const reader = readableStream.getReader();
      let chunks = [];
      let done, value;

      while ({
          done,
          value
        } = await reader.read(), !done) {
        chunks.push(value);
      }

      // 将所有块合并到一个单独的 Uint8Array 中
      let combined = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (let chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      // 使用 TextDecoder 将 Uint8Array 转换为字符串
      const decoder = new TextDecoder();
      return decoder.decode(combined);
    }


    function createReadableStream(text) {
      const encoder = new TextEncoder();
      const encodedText = encoder.encode(text);

      const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encodedText);
          controller.close();
        }
      });

      return readableStream;
    }

    const isReadableStream = (obj) => {
      return obj instanceof ReadableStream
    }

    let [requestUrl, data] = args;

    let inputUrl = ''

    if (typeof requestUrl === 'string') {
      inputUrl = requestUrl
    } else if (typeof requestUrl === 'object') {
      inputUrl = requestUrl.url || ''
      // readbleStream 的时候，data(args[1]存在空的情况)
      if (!data) {
        data = requestUrl
      }
    }

    let bodyData = data?.body

    const matchedInterface = ajax_interceptor_qoweifjqon.getMatchedInterface({
      thisRequestUrl: ajax_interceptor_qoweifjqon.getCompleteUrl(inputUrl),
      thisMethod: data && data.method
    })
    if (matchedInterface && args) {
      if (bodyData && isReadableStream(data.body)) {
        bodyData = await readReadableStream(bodyData)
      }
      const {
        overrideHeadersFunc,
        overridePayloadFunc
      } = matchedInterface;
      const isAdvancedFetch = ajax_interceptor_qoweifjqon.isAdvancedRule(matchedInterface)
      if (overrideHeadersFunc && isAdvancedFetch && data) {
        const headers = ajax_interceptor_qoweifjqon.executeStringFunction(overrideHeadersFunc, this._headerArgs, 'headers')
        args[1].headers = headers
      }
      if (overridePayloadFunc && isAdvancedFetch && requestUrl && data) {
        const {
          method
        } = data
        if (['GET', 'HEAD'].includes(method.toUpperCase())) {
          const queryParams = ajax_interceptor_qoweifjqon.getRequestParams(inputUrl);
          const data = {
            requestUrl: inputUrl,
            queryParams
          }
          args[0] = ajax_interceptor_qoweifjqon.executeStringFunction(overridePayloadFunc, data, 'payload');
        } else {
          const dataer = await ajax_interceptor_qoweifjqon.executeStringFunction(overridePayloadFunc, bodyData, 'payload');
          if (isReadableStream(data.body)) {
            const body = createReadableStream(dataer)
            // const [body1] = dataer.tee()
            args[0] = new Request(args[0], {
              body,
              duplex: 'half'
            });
          } else {
            data.body = dataer
          }
        }
      }
    }
    return ajax_interceptor_qoweifjqon.originalFetch(...args).then(async (response) => {
      if (matchedInterface && (matchedInterface.overrideTxt || matchedInterface.overrideResponseFunc)) {
        let txt = undefined
        txt = matchedInterface.overrideTxt
        const {
          overrideTxt,
          overrideResponseFunc
        } = matchedInterface
        const isAdvanced = ajax_interceptor_qoweifjqon.isAdvancedRule(matchedInterface)
        const isMockjs = ajax_interceptor_qoweifjqon.isMockjsTemplateRule(matchedInterface)
        let overrideResponse = undefined
        let overrideStatus = undefined
        let overrideStatusText = undefined

        if (overrideResponseFunc && isAdvanced) {
          // Advanced：用函数替换
          const queryParams = ajax_interceptor_qoweifjqon.getRequestParams(requestUrl)
          const orgResponse = await getOriginalResponse(response.body);
          const funcArgs = {
            method: data?.method,
            payload: {
              queryParams,
              requestPayload: data?.body
            },
            orgResponse,
            orgStatus: response.status,
            orgStatusText: response.statusText
          }
          const res = ajax_interceptor_qoweifjqon.executeStringFunction(overrideResponseFunc, funcArgs, 'response')
          if (typeof res === 'object' && res !== null) {
            const {
              response: newResponse = undefined,
              status: newStatus = undefined,
              statusText: newStatusText = undefined
            } = res
            overrideResponse = newResponse
            overrideStatus = newStatus
            overrideStatusText = newStatusText
          } else {
            console.error(`[Ajax Modifier] ExecuteFunctionError: Please check your return in the response function. See more details in the examples. \n`)
          }
        } else if (overrideTxt && isMockjs) {
          overrideResponse = ajax_interceptor_qoweifjqon.mockResponseFromOverrideTxt(overrideTxt)
          if (ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_always200On && response.status !== 200) {
            overrideStatus = 200
            overrideStatusText = 'OK'
          }
        } else if (overrideTxt && !isAdvanced) {
          // 普通 JSON，直接替换
          overrideResponse = overrideTxt
          if (ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_always200On && response.status !== 200) {
            overrideStatus = 200
            overrideStatusText = 'OK'
          }
        }
        txt = overrideResponse !== undefined ? overrideResponse : response.responseText
        const stream = new ReadableStream({
          start(controller) {
            // const bufView = new Uint8Array(new ArrayBuffer(txt.length))
            // for (var i = 0 i < txt.length i++) {
            //   bufView[i] = txt.charCodeAt(i)
            // }
            controller.enqueue(new TextEncoder().encode(txt))
            controller.close()
          }
        })
        let params = {
          status: overrideStatus !== undefined ? overrideStatus : response.status,
          statusText: overrideStatusText !== undefined ? overrideStatusText : response.statusText,
        }
        const newResponse = new Response(stream, {
          headers: response.headers,
          ...params
        })
        const proxy = new Proxy(newResponse, {
          get: function (target, name) {
            switch (name) {
              case 'redirected':
              case 'type':
              case 'url':
              case 'useFinalURL':
              case 'body':
              case 'bodyUsed':
                return response[name]
            }
            return target[name]
          }
        })
        for (let key in proxy) {
          if (typeof proxy[key] === 'function') {
            proxy[key] = proxy[key].bind(newResponse)
          }
        }
        return proxy
      } else {
        return response
      }
    })
  },
}

window.addEventListener("message", function (event) {
  const data = event.data

  if (data.type === 'ajaxInterceptor' && data.to === 'pageScript') {
    // ts-mock 预览：在页面环境使用全局 Mock 生成一次随机结果，并回传 content script
    if (data.action === 'mockPreview') {
      const { requestId, templateText } = data
      try {
        if (typeof Mock === 'undefined') {
          window.postMessage({
            type: 'ajaxInterceptor',
            to: 'content',
            action: 'mockPreviewResult',
            requestId,
            ok: false,
            error: 'Mock.js 未加载（请刷新页面后重试）'
          }, '*')
          return
        }
        const template = ajax_interceptor_qoweifjqon.normalizeMockTemplate(JSON.parse(templateText || '{}'))
        const out = Mock.mock(template)
        window.postMessage({
          type: 'ajaxInterceptor',
          to: 'content',
          action: 'mockPreviewResult',
          requestId,
          ok: true,
          body: typeof out === 'string' ? out : JSON.stringify(out, null, 2)
        }, '*')
      } catch (e) {
        window.postMessage({
          type: 'ajaxInterceptor',
          to: 'content',
          action: 'mockPreviewResult',
          requestId,
          ok: false,
          error: (e && e.message) ? e.message : String(e)
        }, '*')
      }
      return
    }

    ajax_interceptor_qoweifjqon.settings[data.key] = data.value
  }

  if (ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_switchOn) {
    // https://github.com/YGYOOO/ajax-interceptor/issues/78
    // https://github.com/YGYOOO/ajax-interceptor/issues/93
    for (const k in ajax_interceptor_qoweifjqon.originalXHR) {
      ajax_interceptor_qoweifjqon.myXHR[k] = ajax_interceptor_qoweifjqon.originalXHR[k]
    }
    window.XMLHttpRequest = ajax_interceptor_qoweifjqon.myXHR
    window.fetch = ajax_interceptor_qoweifjqon.myFetch
  } else {
    window.XMLHttpRequest = ajax_interceptor_qoweifjqon.originalXHR
    window.fetch = ajax_interceptor_qoweifjqon.originalFetch
  }
}, false)
