import { NextResponse } from 'next/server';
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

const securityHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

/**
 * GET: Check admin authentication state
 */
export async function GET(request: Request) {
  const session = getAdminSessionFromRequest(request);

  if (!session.authenticated) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401, headers: securityHeaders }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      username: session.username,
      timestamp: Date.now(),
    },
    { status: 200, headers: securityHeaders }
  );
}

/**
 * POST: Authenticate admin credentials with rate-limiting & timing-attack defense
 */
export async function POST(request: Request) {
  // 0. Fail closed when admin credentials / signing secret are not configured
  if (!isAdminAuthConfigured()) {
    console.error('Admin auth is not configured: set ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_SECRET_KEY.');
    return NextResponse.json(
      { success: false, error: '관리자 인증이 서버에 설정되지 않았습니다. 관리자에게 문의해주세요.' },
      { status: 503, headers: securityHeaders }
    );
  }

  const ip = getClientIp(request);

  // 1. Check Rate Limit (Anti-Brute Force)
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    const mins = Math.ceil(rateLimit.remainingSeconds / 60);
    return NextResponse.json(
      {
        success: false,
        error: `비정상적인 접근 시도가 감지되어 접근이 차단되었습니다. ${mins}분 (${rateLimit.remainingSeconds}초) 후 다시 시도해주세요.`,
        locked: true,
        remainingSeconds: rateLimit.remainingSeconds,
      },
      {
        status: 429,
        headers: {
          ...securityHeaders,
          'Retry-After': String(rateLimit.remainingSeconds),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '아이디와 비밀번호를 모두 입력해주세요.' },
        { status: 400, headers: securityHeaders }
      );
    }

    // 2. Constant-time credential check
    const isValid = verifyAdminCredentials(String(username).trim(), String(password).trim());

    if (!isValid) {
      // Record failed attempt
      const attemptResult = recordFailedAttempt(ip);

      if (attemptResult.blocked) {
        return NextResponse.json(
          {
            success: false,
            error: `연속된 로그인 실패로 15분간 관리자 로그인이 잠금 처리되었습니다.`,
            locked: true,
            remainingSeconds: attemptResult.remainingSeconds,
          },
          {
            status: 429,
            headers: {
              ...securityHeaders,
              'Retry-After': String(attemptResult.remainingSeconds),
            },
          }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `관리자 인증에 실패했습니다. (남은 시도 횟수: ${attemptResult.attemptsLeft}회)`,
          attemptsLeft: attemptResult.attemptsLeft,
        },
        { status: 401, headers: securityHeaders }
      );
    }

    // 3. Success: Reset rate limit & generate signed token
    resetRateLimit(ip);
    const token = createAdminSessionToken(username);

    // Secure cookie attributes
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      `${ADMIN_COOKIE_NAME}=${token}`,
      `Path=/`,
      `Max-Age=${SESSION_DURATION_SECONDS}`,
      `HttpOnly`,
      `SameSite=Strict`,
      isProd ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ');

    const response = NextResponse.json(
      {
        success: true,
        message: '보안 관리자 인증 완료',
        username,
      },
      { status: 200, headers: securityHeaders }
    );

    response.headers.set('Set-Cookie', cookieOptions);
    return response;
  } catch (err) {
    console.error('Admin auth error:', err);
    return NextResponse.json(
      { success: false, error: '인증 처리 중 서버 오류가 발생했습니다.' },
      { status: 500, headers: securityHeaders }
    );
  }
}

/**
 * DELETE: Admin Logout
 */
export async function DELETE() {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `${ADMIN_COOKIE_NAME}=`,
    `Path=/`,
    `Max-Age=0`,
    `HttpOnly`,
    `SameSite=Strict`,
    isProd ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');

  const response = NextResponse.json(
    { success: true, message: '보안 로그아웃 완료' },
    { status: 200, headers: securityHeaders }
  );

  response.headers.set('Set-Cookie', cookieOptions);
  return response;
}
