import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  verifyAdminCredentials,
  createAdminSessionToken,
  getAdminSessionFromRequest,
  isAdminAuthConfigured,
  ADMIN_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from '@/lib/adminAuth';
import { API_HEADERS, fail, json } from '@/lib/http';

function sessionCookie(token: string, maxAge: number) {
  return [
    `${ADMIN_COOKIE_NAME}=${token}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Strict',
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

function locked(error: string, remainingSeconds: number) {
  return json({ success: false, error, locked: true, remainingSeconds }, 429, {
    ...API_HEADERS,
    'Retry-After': String(remainingSeconds),
  });
}

export async function GET(request: Request) {
  const session = getAdminSessionFromRequest(request);
  return session.authenticated
    ? json({ authenticated: true, username: session.username })
    : json({ authenticated: false }, 401);
}

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    console.error('Admin auth is not configured: set ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_SECRET_KEY.');
    return fail('관리자 인증이 서버에 설정되지 않았습니다. 관리자에게 문의해주세요.', 503);
  }

  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    const mins = Math.ceil(rateLimit.remainingSeconds / 60);
    return locked(`로그인 시도가 너무 많습니다. ${mins}분 후 다시 시도해주세요.`, rateLimit.remainingSeconds);
  }

  try {
    const { username, password } = await request.json();
    if (!username || !password) return fail('아이디와 비밀번호를 모두 입력해주세요.', 400);

    if (!verifyAdminCredentials(String(username).trim(), String(password).trim())) {
      const attempt = recordFailedAttempt(ip);
      if (attempt.blocked) {
        return locked('연속된 로그인 실패로 15분간 관리자 로그인이 잠금 처리되었습니다.', attempt.remainingSeconds);
      }
      return fail(`관리자 인증에 실패했습니다. (남은 시도 횟수: ${attempt.attemptsLeft}회)`, 401, {
        attemptsLeft: attempt.attemptsLeft,
      });
    }

    resetRateLimit(ip);
    const response = json({ success: true, username });
    response.headers.set('Set-Cookie', sessionCookie(createAdminSessionToken(username), SESSION_DURATION_SECONDS));
    return response;
  } catch (err) {
    console.error('Admin auth error:', err);
    return fail('인증 처리 중 서버 오류가 발생했습니다.', 500);
  }
}

export async function DELETE() {
  const response = json({ success: true });
  response.headers.set('Set-Cookie', sessionCookie('', 0));
  return response;
}
