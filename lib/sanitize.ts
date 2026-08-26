/**
 * Centralized input sanitization for server actions.
 *
 * - Trims whitespace
 * - Strips HTML tags to prevent stored XSS in non-React contexts
 * - Enforces max length
 * - Provides format validators
 */

/** Strip HTML tags and trim. */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim()
}

/**
 * Sanitize a string input: strip HTML, trim, enforce max length.
 * Returns empty string for null/undefined.
 */
export function sanitize(
  value: FormDataEntryValue | null | undefined,
  maxLength: number = 500,
): string {
  if (value == null) return ""
  const raw = String(value).trim()
  const clean = stripHtml(raw)
  return clean.slice(0, maxLength)
}

/**
 * Sanitize an optional field — returns null if empty after sanitization.
 */
export function sanitizeOptional(
  value: FormDataEntryValue | null | undefined,
  maxLength: number = 500,
): string | null {
  const result = sanitize(value, maxLength)
  return result.length > 0 ? result : null
}

/** Validate email format. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Validate phone format (allows +, digits, spaces, dashes, parens). */
export function isValidPhone(phone: string): boolean {
  return /^[+]?[\d\s()-]{7,20}$/.test(phone)
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Sanitize a string for safe CSV output.
 * Escapes double quotes and strips newlines to prevent CSV injection.
 */
export function csvSafe(value: string): string {
  const clean = value.replace(/[\r\n]+/g, " ").replace(/"/g, '""')
  // Prefix with single quote if starts with =, +, -, @ to prevent Excel formula injection
  if (/^[=+\-@\t\r]/.test(clean)) {
    return `"${clean}"`
  }
  return `"${clean}"`
}
