// Fixed-window request limiter, in memory. On serverless each instance keeps its own counts, so this
// slows down abuse from one client rather than enforcing an exact global limit.

const windows = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || '127.0.0.1';
}

/** Counts one hit for `key`; returns the seconds to wait when the limit is already used up, else 0. */
export function hit(key: string, max: number, windowMs: number): number {
  const now = Date.now();
  if (windows.size > 10_000) for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);

  const w = windows.get(key);
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return 0;
  }
  if (w.count >= max) return Math.ceil((w.resetAt - now) / 1000);
  w.count += 1;
  return 0;
}
