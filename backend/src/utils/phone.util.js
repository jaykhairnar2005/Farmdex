/**
 * Phone Number Normalization and Validation Helper
 */

/**
 * Normalize phone number by removing spaces, hyphens, and parentheses.
 * Preserves leading '+' for E.164 international numbers.
 * @param {string} phone
 * @returns {string|null}
 */
export function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;

  // Preserve leading '+' if present
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (!digits) return null;

  return hasPlus ? `+${digits}` : digits;
}

/**
 * Validate normalized phone number length (10 to 15 digits)
 * @param {string} normalizedPhone
 * @returns {boolean}
 */
export function isValidPhone(normalizedPhone) {
  if (!normalizedPhone) return false;
  const digits = normalizedPhone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}
