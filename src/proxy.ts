import { NextResponse, type NextRequest } from 'next/server';

const hostOf = (origin: string) => URL.canParse(origin) ? new URL(origin).host : null; // 'null' origins never match

/**
 * CSRF guard for the API: a state-changing request sent by a browser from another site is refused.
 * Browsers always attach Origin to cross-site POST/PUT/PATCH/DELETE; server-to-server calls (no Origin)
 * still need their own credentials, e.g. the cron secret.
 */
export function proxy(request: NextRequest) {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') return NextResponse.next();
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin && hostOf(origin) !== request.headers.get('host')) {
    return NextResponse.json({ success: false, error: '허용되지 않은 요청이에요.' }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
