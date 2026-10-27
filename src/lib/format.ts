// Client- and server-safe formatting helpers.

export const digitsOnly = (value: unknown) => String(value ?? '').replace(/[^0-9]/g, '');

/** 01012345678 -> 010-1234-5678 (formats progressively while typing). */
export function formatPhone(value: string): string {
  const d = digitsOnly(value).slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
}

/** 01012345678 -> 010-1***-**** (only the carrier prefix and one digit stay visible) */
export function maskPhone(value: string): string {
  const d = digitsOnly(value);
  if (d.length < 10) return '010-****-****';
  return `${d.slice(0, 3)}-${d[3]}${'*'.repeat(d.length === 11 ? 3 : 2)}-****`;
}
