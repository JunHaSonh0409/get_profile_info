import crypto from 'crypto';
import { cookies } from 'next/headers';

// Environment credentials & secret getters with quotation cleanup
function getAdminUsername(): string {
  const raw = process.env.ADMIN_USERNAME || 'admin';
  return raw.replace(/^["']|["']$/g, '').trim();
}

function getAdminPassword(): string {
  const raw = process.env.ADMIN_PASSWORD || 'orbit2026!@#secure';
  return raw.replace(/^["']|["']$/g, '').trim();
}

function getAdminSecretKey(): string {
  const raw = process.env.ADMIN_SECRET_KEY || 'b95d909988a873e16447c2162657e2bbcf9e8f6eacb07978d3ba1d48c0a373b5';
  return raw.replace(/^["']|["']$/g, '').trim();
}

export const ADMIN_COOKIE_NAME = 'orbit_admin_session';
export const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 hours

// In-memory rate limiting store for brute-force prevention
interface RateLimitRecord {
  attempts: number;
  blockedUntil: number;
  firstAttemptAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

/**
 * Clean up expired rate limit entries periodically
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.blockedUntil && now - record.firstAttemptAt > WINDOW_MS) {
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Extracts client IP from standard reverse proxy headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Checks if the client IP is currently rate-limited
 */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
} {
  cleanupRateLimitStore();
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record) {
    return { allowed: true, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS };
  }

  // Check if currently locked out
  if (record.blockedUntil > now) {
    const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingSeconds, attemptsLeft: 0 };
  }

  // Check if attempt window has passed
  if (now - record.firstAttemptAt > WINDOW_MS) {
    rateLimitStore.delete(ip);
    return { allowed: true, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS };
  }

  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - record.attempts);
  return { allowed: attemptsLeft > 0, remainingSeconds: 0, attemptsLeft };
}

/**
 * Records a failed login attempt for an IP
 */
export function recordFailedAttempt(ip: string): { blocked: boolean; remainingSeconds: number; attemptsLeft: number } {
  const now = Date.now();
  let record = rateLimitStore.get(ip);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    record = {
      attempts: 1,
      firstAttemptAt: now,
      blockedUntil: 0,
    };
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    record.blockedUntil = now + LOCKOUT_MS;
    rateLimitStore.set(ip, record);
    return {
      blocked: true,
      remainingSeconds: Math.ceil(LOCKOUT_MS / 1000),
      attemptsLeft: 0,
    };
  }

  rateLimitStore.set(ip, record);
  return {
    blocked: false,
    remainingSeconds: 0,
    attemptsLeft: MAX_ATTEMPTS - record.attempts,
  };
}

/**
 * Resets rate limit for an IP upon successful login
 */
export function resetRateLimit(ip: string): void {
  rateLimitStore.delete(ip);
}

/**
 * Constant-time string comparison using SHA-256 hashes to prevent side-channel timing attacks
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hashB = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Validates admin credentials using timing-safe comparison
 */
export function verifyAdminCredentials(inputUser: string, inputPass: string): boolean {
  const isUserValid = timingSafeCompare(inputUser, getAdminUsername());
  const isPassValid = timingSafeCompare(inputPass, getAdminPassword());
  return isUserValid && isPassValid;
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token
 */
export function createAdminSessionToken(username: string): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_DURATION_SECONDS * 1000;
  const nonce = crypto.randomBytes(16).toString('hex');

  const payload = {
    sub: username,
    role: 'super_admin',
    iat: issuedAt,
    exp: expiresAt,
    nonce,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getAdminSecretKey())
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a session token signature and expiration in constant time
 */
export function verifyAdminSessionToken(token: string | null | undefined): {
  valid: boolean;
  username?: string;
  error?: string;
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'NO_TOKEN' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'MALFORMED_TOKEN' };
  }

  const [payloadB64, signature] = parts;

  // Expected signature
  const expectedSig = crypto
    .createHmac('sha256', getAdminSecretKey())
    .update(payloadB64)
    .digest('base64url');

  // Constant-time compare signature
  if (!timingSafeCompare(signature, expectedSig)) {
    return { valid: false, error: 'INVALID_SIGNATURE' };
  }

  try {
    const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr);

    if (Date.now() > payload.exp) {
      return { valid: false, error: 'TOKEN_EXPIRED' };
    }

    if (payload.role !== 'super_admin') {
      return { valid: false, error: 'FORBIDDEN_ROLE' };
    }

    return { valid: true, username: payload.sub };
  } catch (err) {
    return { valid: false, error: 'INVALID_PAYLOAD' };
  }
}

/**
 * Checks session validity from an incoming Next.js Request (reading Cookie header)
 */
export function getAdminSessionFromRequest(request: Request): {
  authenticated: boolean;
  username?: string;
} {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_COOKIE_NAME}=`));

  if (!match) {
    return { authenticated: false };
  }

  const token = match.substring(ADMIN_COOKIE_NAME.length + 1);
  const result = verifyAdminSessionToken(token);

  if (result.valid && result.username) {
    return { authenticated: true, username: result.username };
  }

  return { authenticated: false };
}
