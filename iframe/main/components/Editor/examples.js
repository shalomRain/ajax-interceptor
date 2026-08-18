export const HEADERS_EXAMPLES = [{
  egText: `/**
 * Modify headers here
 **/

/* console to see the arguments */
// console.log(...arguments)

/* get origin headers */
let headersArgs = arguments[0] ? arguments[0] : {}
/* modify headers */
headersArgs["Accept"] = "*/*"

/* return new headers */
return headersArgs
`
}]
export const REQUEST_PAYLOAD_EXAMPLES = [
  {
    egTitle: 'e.g. GET',
    egText: `/**
 * Modify payload here
 * This example is of GET method.
 **/

/* console to see the arguments */
// console.log(...arguments)

/* get origin url and params */
const {
  requestUrl,
  queryParams
} = arguments[0]

let newRequestUrl = requestUrl.split('?')[0] + '?'

/* modify params */
const newQueryParams = Object.assign(queryParams, {
  test: 'test123'
})

/* connect url and params */
Object.keys(newQueryParams).forEach((key, index) => {
  if (index !== 0) newRequestUrl += '&'
  newRequestUrl += key + '=' + newQueryParams[key]
})

/* return new request url */
return newRequestUrl
`
  },
  {
    egTitle: 'e.g. POST JSON',
    egText: `/**
 * Modify payload here
 * This example is of POST Method and JSON type.
 **/

/* console to see the arguments */
// console.log(...arguments)

/* get origin payload */
const orgArgs = arguments[0]

/* modify payload */
const newParams = JSON.parse(orgArgs)
newParams.test = 'test123'

/* return new payload */
return JSON.stringify(newParams)
`
  },
  {
    egTitle: 'e.g. POST FormData',
    egText: `/**
 * Modify payload here
 * This example is of POST Method and FormData type.
 **/

/* console to see the arguments */
// console.log(...arguments)

/* get origin payload */
const newArgs = arguments[0]

/* modify payload */
newArgs.append('test', 'test123')

/* return new payload */
return newArgs
`
  }
]

export const RESPONSE_EXAMPLES = [
  {
    egTitle: 'e.g. json',
    egText: `/**
 * Modify response here
 * This example is of JSON type response.
 * 按 queryParams / requestPayload / orgStatus 返回不同 mock，改条件即可用。
 **/

/* console to see the arguments */
// console.log(...arguments)

/* get origin params and response */
const {
  method,
  payload: {
    queryParams,    // URL 查询对象，如 /api?userId=100&page=1 → { userId: '100', page: '1' }；无 query 时可能为 null
    requestPayload  // 请求体：POST JSON 多为字符串 '{"userId":100}'；GET 时常为 undefined
  },
  orgResponse,
  orgStatus,
  orgStatusText
} = arguments[0]

console.log('queryParams', queryParams)
console.log('requestPayload', requestPayload)
console.log('method / orgStatus', method, orgStatus)

const query = queryParams || {}
const payloadText = typeof requestPayload === 'string' ? requestPayload : ''
const httpMethod = String(method || '').toUpperCase()

/* modify response */
let newResponse = {}
try {
  newResponse = typeof orgResponse === 'string' ? JSON.parse(orgResponse) : (orgResponse || {})
} catch (e) {}

/* 按入参、状态返回不同 mock（改下面的条件即可） */
if (orgStatus >= 400) {
  newResponse = { code: orgStatus, message: 'mocked error' }
} else if (query.userId === '100') {
  newResponse = { code: 0, message: 'ok', data: { userId: 100, name: 'Alice' } }
} else if (httpMethod === 'POST' && payloadText.includes('keyword')) {
  newResponse = { code: 0, message: 'ok', list: [] }
} else {
  newResponse.message = 'Modify success!'
}

/* return new response and status */
return {
  response: JSON.stringify(newResponse),
  status: 200,
  statusText: 'OK'
}
`
  },
  {
    egTitle: 'e.g. text',
    egText: `/**
 * Modify response here
 * This example is of text type response.
 * 按 queryParams / requestPayload / orgStatus 返回不同 mock，改条件即可用。
 **/

/* console to see the arguments */
// console.log(...arguments)

/* get origin params and response */
const {
  method,
  payload: {
    queryParams,    // URL 查询对象，如 /api?userId=100&page=1 → { userId: '100', page: '1' }；无 query 时可能为 null
    requestPayload  // 请求体：POST 多为字符串；GET 时常为 undefined
  },
  orgResponse,
  orgStatus,
  orgStatusText
} = arguments[0]

console.log('queryParams', queryParams)
console.log('requestPayload', requestPayload)
console.log('method / orgStatus', method, orgStatus)

const query = queryParams || {}
const payloadText = typeof requestPayload === 'string' ? requestPayload : ''
const httpMethod = String(method || '').toUpperCase()

/* modify response */
let newResponse = orgResponse

/* 按入参、状态返回不同 mock（text 需返回字符串；改下面的条件即可） */
if (orgStatus >= 400) {
  newResponse = 'mocked error'
} else if (query.userId === '100') {
  newResponse = JSON.stringify({ userId: 100, name: 'Alice' })
} else if (httpMethod === 'POST' && payloadText.includes('keyword')) {
  newResponse = JSON.stringify({ result: 'ok', message: '操作成功' })
}

/* return new response and status */
return {
  response: newResponse,
  status: 200,
  statusText: 'OK'
}
`
  }
]

export const RESPONSE_SIMPLE_EXAMPLES = [
  {
    egTitle: 'e.g. json',
    egLanguage: 'json',
    egText: `{
  "code": 0,
  "message": "ok"
}
`
  }
]

/** Mock.js：合法 JSON + Mock.js 占位符与语法，每次拦截生成新随机数据 */
export const RESPONSE_MOCKJS_EXAMPLES = [
  {
    egTitle: 'e.g. Mock 字段',
    egLanguage: 'json',
    egText: `{
  "code": 0,
  "id": "@guid",
  "name": "@cname",
  "city": "@city",
  "email": "@email",
  "url": "@url"
}
`
  },
  {
    egTitle: 'e.g. 列表与次数',
    egLanguage: 'json',
    egText: `{
  "list|3-5": [
    {
      "id|+1": 1,
      "title": "@ctitle",
      "score|60-100": 80
    }
  ]
}
`
  }
]

/** ts-mock：粘贴 TypeScript interface，由扩展解析为 Mock 模板（根类型优先 interface Root） */
export const RESPONSE_TS_MOCK_EXAMPLES = [
  {
    egTitle: 'e.g. Root + Result',
    egLanguage: 'typescript',
    egText: `export interface Root {
  message?: string
  status?: boolean
  statusCode?: string
  result?: Result
}

export interface Result {
  billCode?: string
  associationCode?: string
  hasWarmTag?: boolean
  picCounts?: number
  allTracings?: AllTracing[]
}

export interface AllTracing {
  scanType?: string
  scanMan?: string
  scanDate?: string
  registerDate?: string
  billCode?: string
}
`
  }
]
