import { resolveEvents } from '@/lib/eventFlow';
import { fail, failWith, json } from '@/lib/http';
import { readEnv, timingSafeCompare } from '@/lib/sessionToken';

/**
 * Vercel Cron backstop: applies due stage transitions (and the match notifications they trigger)
 * even when nobody visits. Page views run the same catch-up, so this only bounds the delay.
 */
export async function GET(request: Request) {
  const secret = readEnv('CRON_SECRET');
  const auth = request.headers.get('authorization') || '';
  if (!secret || !timingSafeCompare(auth, `Bearer ${secret}`)) return fail('Unauthorized', 401);
  try {
    const events = await resolveEvents();
    return json({ success: true, events: events.map((e) => ({ slug: e.slug, status: e.status })) });
  } catch (err) {
    return failWith(err);
  }
}
