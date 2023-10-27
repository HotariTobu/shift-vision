import { revalidateTag } from "next/cache"

export const access_token = process.env.FREEE_ACCESS_TOKEN
export const company_id = process.env.FREEE_COMPANY_ID

export class RequestResult<T> {
  constructor(
    public code: number,
    public data: T,
  ) { }
}

const createBody = (obj: object | null) => {
  if (obj === null) {
    return
  }

  return JSON.stringify(obj)
}

const request = async <T>(uri: string, method: 'get' | 'post' | 'put' | 'delete', body: object | null = null, headers: object | null = null, next?: NextFetchRequestConfig) => {
  const response = await fetch(uri, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'Authorization': `Bearer ${access_token}`,
      ...headers,
    },
    body: createBody(body),
    next,
  })

  const code = response.status
  const data: T = await response.json()

  if (!response.ok) {
    throw new RequestResult(
      code,
      JSON.stringify(data, null, 2),
    )
  }

  return new RequestResult<T>(
    code,
    data,
  )
}

export default request

const obj2query = (obj: object, encode = true) => {
  const entries = Object.entries(obj)
  const pairs = entries.filter(([_, v]) => {
    return typeof v !== 'undefined'
  }).map(([k, v]) => {
    if (encode) {
      v = encodeURIComponent(v)
    }

    return `${k}=${v}`
  })

  return pairs.join('&')
}

export const get = async <T>(path: string, query: object, tag: string) => {
  const uri = path + '?' + obj2query(query)
  return await request<T>(uri, 'get', null, null, {
    tags: [tag],
  })
}

export const post = async <T>(path: string, body: object, tag: string) => {
  const response = await request<T>(path, 'post', body)
  revalidateTag(tag)
  return response
}

export const put = async <T>(path: string, body: object, tag: string) => {
  const response = await request<T>(path, 'put', body)
  revalidateTag(tag)
  return response
}

export const del = async <T>(path: string, tag: string) => {
  const response = await request<T>(path, 'delete')
  revalidateTag(tag)
  return response
}
