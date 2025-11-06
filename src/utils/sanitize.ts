// Simple client-side sanitization helpers

export function sanitizeBasic(input: string, maxLen = 512): string {
  if (!input) return '';
  return input.slice(0, maxLen);
}

// Allow only numbers, letters, '/', ',', '-', and spaces (for dates list)
export function sanitizeDates(input: string, maxLen = 10000): string {
  if (!input) return '';
  const filtered = input.replace(/[^0-9A-Za-z/,\-\s]/g, '');
  // normalize comma spacing
  return filtered
    .replace(/\s*,\s*/g, ', ') // single space after commas
    .replace(/\s+/g, ' ')
    .slice(0, maxLen);
}

// Validate a comma-separated list of dates like: 20/Aug/25, 21/Aug/25
const MONTHS = '(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)';
export const DATES_LIST_REGEX = new RegExp(
  `^\\d{1,2}/${MONTHS}/\\d{2}(, \\d{1,2}/${MONTHS}/\\d{2})*$`,
  'i'
);

export function isValidDatesList(input: string): boolean {
  if (!input) return false;
  const s = sanitizeDates(input);
  return DATES_LIST_REGEX.test(s);
}

// Ticket ID like ABC-123; keep letters, digits, dash
export function sanitizeTicketId(input: string, maxLen = 128): string {
  if (!input) return '';
  return input
    .replace(/[^A-Za-z0-9\-]/g, '')
    .toUpperCase()
    .slice(0, maxLen);
}

// Account names: keep letters, digits, and a few safe symbols
export function sanitizeAccount(input: string, maxLen = 128): string {
  if (!input) return '';
  return input.replace(/[^A-Za-z0-9_.\-]/g, '').slice(0, maxLen);
}

// Tokens: trim and strip tags/whitespace; don't change internal charset
export function sanitizeToken(input: string, maxLen = 256): string {
  return sanitizeBasic(input, maxLen);
}

export function sanitizeDescription(input: string, maxLen = 1000): string {
  return sanitizeBasic(input, maxLen);
}

export function sanitizeHours(
  input: string | number,
  min = 0.01,
  max = 8
): number {
  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num) || num < min) {
    return min;
  }

  if (num > max) {
    return max;
  }

  return Math.round(num * 100) / 100;
}
