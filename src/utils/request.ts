import { getDeviceId } from './device'

//const BASE_URL = 'http://192.168.2.48:9199'       // AI-48 48开发环境
//const BASE_URL = 'http://192.168.2.97:9199'       // AI-97 97前端开发环境
//const BASE_URL = 'http://192.168.2.98:9199'       // AI-98 bug开发环境
//const BASE_URL = 'http://192.168.2.99:9199'         // AI-99 dev开发环境
config.baseUrl = 'http://192.168.2.103:9199'      //测AI-103 测试环境
//config.baseUrl = "https://staging.jianbiyou.com/gateway"; //预发布环境接口
// config.baseUrl = "https://pre.jianbiyou.com/gateway"; //影子环境接口
// config.baseUrl = "https://cos.jianbiyou.com/gateway"; //生产环境接口

// 统一响应结构
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  msg?: string
}

// 请求配置
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
}

/**
 * 统一请求封装
 */
async function request<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { params, ...fetchOptions } = options

  // 处理 URL 参数
  let finalUrl = url
  if (params) {
    const searchParams = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    )
    finalUrl = `${url}?${searchParams}`
  }

  try {
    const token = localStorage.getItem('jclaw_token')
    const clientId = await getDeviceId()
    const res = await fetch(`${BASE_URL}${finalUrl}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || '',
        'clientid': clientId,
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    })

    const json: ApiResponse<T> = await res.json()

    // 业务错误处理
    if (json.code !== 200) {
      throw new Error(json.msg || '请求失败')
    }
    return json
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('网络请求失败')
  }
}

export const http = {
  get<T>(url: string, params?: Record<string, string | number | boolean>) {
    return request<T>(url, { method: 'GET', params })
  },
  post<T>(url: string, data?: unknown) {
    return request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  },
  put<T>(url: string, data?: unknown) {
    return request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  },
  delete<T>(url: string, params?: Record<string, string | number | boolean>) {
    return request<T>(url, { method: 'DELETE', params })
  },
}
