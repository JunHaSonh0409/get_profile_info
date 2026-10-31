import { readCookie, readEnv, sessionCookie, signSessionToken, verifySessionToken } from '@/lib/sessionToken';
import { digitsOnly } from '@/lib/format';

// Member session: issued by /api/verify/check after the SMS check passes.
// Signed with its own secret so an admin token can never pass as a member token (and vice versa).
export const MEMBER_COOKIE_NAME = 'orbit_member_session';
export const MEMBER_SESSION_SECONDS = 30 * 24 * 60 * 60;

const secret = () => readEnv('MEMBER_SESSION_SECRET');

export const isMemberAuthConfigured = () => Boolean(secret());

export function createMemberSessionToken(phone: string): string {
  if (!secret()) throw new Error('MEMBER_SESSION_SECRET is not configured');
  return signSessionToken({ sub: digitsOnly(phone), role: 'member' }, secret(), MEMBER_SESSION_SECONDS);
}

/** Verified phone (digits only) from the member session cookie, or null. */
export function getMemberPhone(request: Request): string | null {
  const token = readCookie(request, MEMBER_COOKIE_NAME);
  const payload = token ? verifySessionToken(token, secret()) : null;
  return payload?.role === 'member' && typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
}

/** Set-Cookie value; Lax so the session survives arriving from a shared link. Empty token clears it. */
export const memberCookie = (token: string) =>
  sessionCookie(MEMBER_COOKIE_NAME, token, token ? MEMBER_SESSION_SECONDS : 0, 'Lax');

// SMS challenge: /api/verify/request issues the code inside a short-lived signed cookie, and
// /api/verify/check only accepts that exact code for that exact phone. The client never chooses the text.
const CHALLENGE_COOKIE = 'orbit_verify';
export const CHALLENGE_SECONDS = 5 * 60;

export const challengeText = (code: string) => `OCTOMO 인증 ${code}`;

export const challengeCookie = (phone: string, code: string) =>
  sessionCookie(CHALLENGE_COOKIE, signSessionToken({ sub: digitsOnly(phone), code, role: 'verify' }, secret(), CHALLENGE_SECONDS), CHALLENGE_SECONDS, 'Strict');

export const clearChallengeCookie = () => sessionCookie(CHALLENGE_COOKIE, '', 0, 'Strict');

/** The unexpired code issued to this phone, or null. */
export function readChallenge(request: Request, phone: string): string | null {
  const token = readCookie(request, CHALLENGE_COOKIE);
  const payload = token ? verifySessionToken(token, secret()) : null;
  return payload?.role === 'verify' && payload.sub === digitsOnly(phone) && typeof payload.code === 'string' ? payload.code : null;
}
