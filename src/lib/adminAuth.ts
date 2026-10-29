import { readCookie, readEnv, signSessionToken, timingSafeCompare, verifySessionToken } from '@/lib/sessionToken';

// No fallbacks: when a variable is missing, auth fails closed.
export function isAdminAuthConfigured(): boolean {
  return Boolean(readEnv('ADMIN_USERNAME') && readEnv('ADMIN_PASSWORD') && readEnv('ADMIN_SECRET_KEY'));
}

export const ADMIN_COOKIE_NAME = 'orbit_admin_session';
export const SESSION_DURATION_SECONDS = 8 * 60 * 60;

// In-memory brute-force limiter (per server instance).
interface RateLimitRecord {
  attempts: number;
  blockedUntil: number;
  firstAttemptAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || '127.0.0.1';
}

export function checkRateLimit(ip: string): { allowed: boolean; remainingSeconds: number } {
  const now = Date.now();
  for (const [key, record] of rateLimitStore) {
    if (now > record.blockedUntil && now - record.firstAttemptAt > WINDOW_MS) rateLimitStore.delete(key);
  }

  const record = rateLimitStore.get(ip);
  if (record && record.blockedUntil > now) {
    return { allowed: false, remainingSeconds: Math.ceil((record.blockedUntil - now) / 1000) };
  }
  return { allowed: !record || record.attempts < MAX_ATTEMPTS, remainingSeconds: 0 };
}

export function recordFailedAttempt(ip: string): { blocked: boolean; remainingSeconds: number; attemptsLeft: number } {
  const now = Date.now();
  const existing = rateLimitStore.get(ip);
  const record =
    existing && now - existing.firstAttemptAt <= WINDOW_MS
      ? { ...existing, attempts: existing.attempts + 1 }
      : { attempts: 1, firstAttemptAt: now, blockedUntil: 0 };

  if (record.attempts >= MAX_ATTEMPTS) record.blockedUntil = now + LOCKOUT_MS;
  rateLimitStore.set(ip, record);

  return record.blockedUntil
    ? { blocked: true, remainingSeconds: Math.ceil(LOCKOUT_MS / 1000), attemptsLeft: 0 }
    : { blocked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS - record.attempts };
}

export function resetRateLimit(ip: string): void {
  rateLimitStore.delete(ip);
}

export function verifyAdminCredentials(user: string, pass: string): boolean {
  if (!isAdminAuthConfigured()) return false;
  // Evaluate both so timing does not reveal which one failed.
  const userOk = timingSafeCompare(user, readEnv('ADMIN_USERNAME'));
  const passOk = timingSafeCompare(pass, readEnv('ADMIN_PASSWORD'));
  return userOk && passOk;
}

/** HMAC-SHA256 signed session token: base64url(payload).signature */
export function createAdminSessionToken(username: string): string {
  const secret = readEnv('ADMIN_SECRET_KEY');
  if (!secret) throw new Error('ADMIN_SECRET_KEY is not configured');
  return signSessionToken({ sub: username, role: 'super_admin' }, secret, SESSION_DURATION_SECONDS);
}

export function getAdminSessionFromRequest(request: Request): { authenticated: boolean; username?: string } {
  const token = readCookie(request, ADMIN_COOKIE_NAME);
  const payload = token ? verifySessionToken(token, readEnv('ADMIN_SECRET_KEY')) : null;
  return payload?.role === 'super_admin' && typeof payload.sub === 'string'
    ? { authenticated: true, username: payload.sub }
    : { authenticated: false };
}
