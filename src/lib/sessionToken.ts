import crypto from 'crypto';

// Shared HMAC-signed session tokens and cookie helpers for admin and member sessions.

/** Reads an env var with surrounding quotes stripped. Missing -> '' (callers fail closed). */
export const readEnv = (name: string) => (process.env[name] || '').replace(/^["']|["']$/g, '').trim();

/** Constant-time comparison via fixed-length SHA-256 digests. */
export function timingSafeCompare(a: string, b: string): boolean {
  const hash = (s: string) => crypto.createHash('sha256').update(s, 'utf8').digest();
  return crypto.timingSafeEqual(hash(a), hash(b));
}

const sign = (payloadB64: string, secret: string) =>
  crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');

/** base64url(payload).signature, with iat/exp/nonce added to the payload. */
export function signSessionToken(claims: Record<string, unknown>, secret: string, ttlSeconds: number): string {
  if (!secret) throw new Error('Session secret is not configured');
  const now = Date.now();
  const payload = { ...claims, iat: now, exp: now + ttlSeconds * 1000, nonce: crypto.randomBytes(16).toString('hex') };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

/** Returns the payload of a correctly signed, unexpired token, otherwise null. */
export function verifySessionToken(token: string, secret: string): Record<string, unknown> | null {
  const [payloadB64, signature, extra] = token.split('.');
  if (!secret || !payloadB64 || !signature || extra !== undefined) return null;
  if (!timingSafeCompare(signature, sign(payloadB64, secret))) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    return typeof payload?.exp === 'number' && Date.now() <= payload.exp ? payload : null;
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name: string): string | undefined {
  return (request.headers.get('cookie') || '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

/** Set-Cookie value for an HttpOnly session cookie; maxAge 0 clears it. */
export function sessionCookie(name: string, token: string, maxAge: number, sameSite: 'Strict' | 'Lax') {
  return [
    `${name}=${token}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    `SameSite=${sameSite}`,
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}
