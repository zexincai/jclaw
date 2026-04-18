import { http } from '../utils/request'

/** 将 file.type 映射为阿里云 ASR format 参数 */
export function getAsrFormat(mimeType: string): string {
  if (mimeType.includes('webm')) return 'opus'   // Chrome/Edge: audio/webm;codecs=opus
  if (mimeType.includes('mp3'))  return 'mp3'
  if (mimeType.includes('wav'))  return 'wav'
  if (mimeType.includes('aac'))  return 'aac'
  if (mimeType.includes('ogg'))  return 'ogg'
  if (mimeType.includes('opus')) return 'opus'
  return 'mp3'
}

/** 从后端获取阿里云 Token + Appkey */
export async function getAliyunToken(): Promise<{ token: string; appkey: string }> {
  const res = await http.get<{ token: string; appkey: string }>('/eng/voice/aliyunToken')
  return res.data
}

const ASR_ENDPOINT = 'https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/asr'
const ASR_TIMEOUT_MS = 20_000

/**
 * 将音频文件发送至阿里云 ISI 一句话识别，返回识别文字。
 * 识别失败时抛出 Error，识别为空时返回空字符串（由调用方处理）。
 */
export async function transcribeAudio(
  file: File,
  token: string,
  appkey: string,
  format: string,
): Promise<string> {
  const url = `${ASR_ENDPOINT}?appkey=${encodeURIComponent(appkey)}&format=${format}&sample_rate=16000&enable_punctuation_prediction=true`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ASR_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-NLS-Token': token,
      },
      body: file,
      signal: controller.signal,
    })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('语音识别超时，请重试')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    throw new Error(`语音识别请求失败（HTTP ${res.status}）`)
  }

  const data = await res.json() as { status: number; result: string; message: string }
  if (data.status !== 20000000) {
    throw new Error(data.message || '语音识别失败')
  }

  return data.result ?? ''
}
