/**
 * 设备标识工具
 * 用于确保设备 ID 与手机号一一对应，避免重复授权
 */

const STORAGE_KEY = 'jclaw_persistent_device_id';

/**
 * 简单的哈希函数，将字符串转为固定长度的 ID
 */
async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 获取设备 ID
 * @param phoneNumber 手机号。如果提供，则返回基于手机号的确定性 ID；
 *                    如果不提供，则尝试从本地存储获取上一次的 ID，或者生成一个随机 ID。
 */
export async function getDeviceId(phoneNumber?: string | null): Promise<string> {
  // 如果提供了手机号，直接根据手机号生成确定性 ID
  if (phoneNumber) {
    // 加上固定前缀以防冲突
    return await sha256(`jclaw_device_v2_${phoneNumber}`);
  }

  // 尝试从存储中恢复上一次使用的手机号对应的 ID (由 useAuth 维护)
  const lastPhone = localStorage.getItem('jclaw_last_phone');
  if (lastPhone) {
    return await sha256(`jclaw_device_v2_${lastPhone}`);
  }

  // 兜底：永久随机 ID
  let guestId = localStorage.getItem(STORAGE_KEY);
  if (!guestId) {
    guestId = crypto.randomUUID().replace(/-/g, '');
    localStorage.setItem(STORAGE_KEY, guestId);
  }
  return guestId;
}
