// Validation Utilities

/**
 * Validate email format
 * @param email Email address
 * @returns Is valid
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate password strength
 * @param password Password
 * @returns Strength level 0-4
 */
export function passwordStrength(password: string): number {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  return strength;
}

/**
 * Validate UUID format
 * @param uuid UUID string
 * @returns Is valid
 */
export function isValidUUID(uuid: string): boolean {
  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

/**
 * Validate URL format
 * @param url URL string
 * @returns Is valid
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number (China)
 * @param phone Phone number
 * @returns Is valid
 */
export function isValidPhone(phone: string): boolean {
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(phone);
}

/**
 * Get password strength text
 * @param strength Strength level 0-4
 * @returns Strength text
 */
export function getPasswordStrengthText(strength: number): string {
  const texts = ['太短', '弱', '一般', '强', '非常强'];
  return texts[strength] || '未知';
}

/**
 * Get password strength color
 * @param strength Strength level 0-4
 * @returns Color class
 */
export function getPasswordStrengthColor(strength: number): string {
  const colors = ['#F56C6C', '#F56C6C', '#E6A23C', '#67C23A', '#409EFF'];
  return colors[strength] || '#909399';
}
