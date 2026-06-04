// ─────────────────────────────────────────────────────────────────────────────
// Shared phone helpers — single source of truth so every form stays consistent.
//
// Phones are entered in INTERNATIONAL (E.164) format, i.e. WITH the country code:
//   +201129841926   (Egypt)        +966501234567 (Saudi)        +12025550123 (US)
//
// The leading '+' is optional on input (we normalize it in) but the first digit
// must be non-zero — this rejects local 0-prefixed numbers (Egypt 01…, Gulf 05…)
// and forces the user to include the country code.
// ─────────────────────────────────────────────────────────────────────────────

/** E.164-ish: optional '+', first digit 1-9 (forces a country code), total 10–15 digits. */
export const PHONE_PATTERN = /^\+?[1-9]\d{9,14}$/;

/** Placeholder + helper example shown under every phone field. */
export const PHONE_PLACEHOLDER = '+201129841926';

/**
 * Normalize a phone string to canonical E.164 before sending to the API:
 * strips spaces / dashes / parentheses, keeps a single leading '+', and adds
 * the '+' when the user typed the number without it (e.g. "201129841926").
 * Returns '' for empty/blank input.
 */
export function normalizePhone(v: string | null | undefined): string {
  if (!v) return '';
  // keep digits only, then re-add a single leading '+'
  const digits = v.replace(/[^\d]/g, '');
  return digits ? '+' + digits : '';
}
