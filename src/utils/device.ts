/**
 * 设备标识工具 (Ed25519)
 * 用于确保设备 ID 与手机号一一对应，并满足 OpenClaw 密钥挑战要求
 *
 * 核心逻辑：
 * 1. 每个手机号 (或 Guest) 对应一个唯一的 Ed25519 密钥对。
 * 2. deviceId 永远是 publicKey 的 SHA-256 哈希值，确保满足 server-side 校验。
 * 3. 身份在同一手机号下跨会话持久化。
 */

const STORAGE_KEY_PREFIX = 'jclaw_device_keypair_v2';
const LAST_PHONE_KEY = 'jclaw_last_phone';

export interface DeviceIdentity {
  privateKey: CryptoKey;
  publicKeyBase64: string;
  deviceId: string;
}

interface StoredKeyPair {
  privateKeyJwk: JsonWebKey;
  publicKeyBase64: string;
  deviceId: string;
}

// 内存缓存
let identityCache: DeviceIdentity | null = null;
let identityCacheKey = '';

export function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * 获取设备完整身份
 */
export async function getDeviceIdentity(phoneNumber?: string | null): Promise<DeviceIdentity> {
  const finalPhone = phoneNumber || localStorage.getItem(LAST_PHONE_KEY);
  const storageKey = finalPhone ? `${STORAGE_KEY_PREFIX}_${finalPhone}` : STORAGE_KEY_PREFIX;
  
  // 缓存检查
  if (identityCache && identityCacheKey === storageKey) {
    return identityCache;
  }

  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      const { privateKeyJwk, publicKeyBase64, deviceId } = JSON.parse(stored) as StoredKeyPair;
      const privateKey = await crypto.subtle.importKey(
        "jwk",
        privateKeyJwk,
        { name: "Ed25519" },
        false,
        ["sign"],
      );
      const identity = { privateKey, publicKeyBase64, deviceId };
      identityCache = identity;
      identityCacheKey = storageKey;
      return identity;
    } catch { /* 损坏则重新生成 */ }
  }

  // 生成新密钥
  const keyPair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const pubRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const publicKeyBase64 = base64UrlEncode(new Uint8Array(pubRaw));

  // 关键：deviceId 必须是 publicKey 的 sha256 摘要以满足 OpenClaw 校验
  const hashBuf = await crypto.subtle.digest("SHA-256", pubRaw);
  const deviceId = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const toStore: StoredKeyPair = { privateKeyJwk, publicKeyBase64, deviceId };
  localStorage.setItem(storageKey, JSON.stringify(toStore));

  const identity = { privateKey: keyPair.privateKey, publicKeyBase64, deviceId };
  identityCache = identity;
  identityCacheKey = storageKey;
  return identity;
}

/**
 * 获取设备 ID (Client ID) - 用于 HTTP 请求头
 */
export async function getDeviceId(phoneNumber?: string | null): Promise<string> {
  const identity = await getDeviceIdentity(phoneNumber);
  return identity.deviceId;
}
