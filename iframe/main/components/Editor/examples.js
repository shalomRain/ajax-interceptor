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
 **/

/* console to see the arguments */
// console.log(...arguments)

/* get origin params and response */
const {
  method,
  payload: {
    queryParams,
    requestPayload
  },
  orgResponse,
  orgStatus,
  orgStatusText
} = arguments[0]

/* modify response */
let newResponse = JSON.parse(orgResponse)
newResponse.message = 'Modify success!'

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
 **/

/* console to see the arguments */
// console.log(...arguments)

/* get origin params and response */
const {
  method,
  payload: {
    queryParams,
    requestPayload
  },
  orgResponse,
  orgStatus,
  orgStatusText
} = arguments[0]

/* modify response */
let newResponse = orgResponse

/* modify only in some cases */
if (method === 'post') {
  newResponse = 'Modify success!'
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
