import { NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';

export const API_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'X-Content-Type-Options': 'nosniff',
};

export function json(body: unknown, status = 200, headers: HeadersInit = API_HEADERS) {
  return NextResponse.json(body, { status, headers });
}

export function fail(error: string, status: number, extra: Record<string, unknown> = {}) {
  return json({ success: false, error, ...extra }, status);
}

export function errorMessage(err: unknown, fallback = '서버 오류가 발생했습니다.') {
  return err instanceof Error ? err.message : fallback;
}

/** Returns a 401 response when the request has no valid admin session, otherwise null. */
export function requireAdmin(request: Request) {
  return getAdminSessionFromRequest(request).authenticated
    ? null
    : fail('접근 권한이 없습니다. 관리자 로그인이 필요합니다.', 401);
}
