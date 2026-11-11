/**
 * Strips non-numeric characters and enforces a maximum digit length.
 * @param {string} value
 * @param {number} maxLength
 * @returns {string}
 */
export function sanitizeDigits(value, maxLength = 10) {
  return String(value || '').replace(/\D/g, '').slice(0, maxLength);
}

/**
 * Blocks non-digit keystrokes and typing past maxLength (allows modifiers, navigation, selection replace).
 * @param {KeyboardEvent} e
 * @param {string} currentValue
 * @param {number} maxLength
 */
export function handleNumericKeyDown(e, currentValue = '', maxLength = 10) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key && e.key.length === 1) {
    const isDigit = /^\d$/.test(e.key);
    const hasSelection = e.target.selectionStart !== e.target.selectionEnd;
    if (!isDigit || (String(currentValue || '').length >= maxLength && !hasSelection)) {
      e.preventDefault();
    }
  }
}

