import { applyToEvent } from '@/lib/eventFlow';
import { failWith, json, requireMember } from '@/lib/http';

/** Apply with the logged-in member's profile; the only input is the memo. */
export async function POST(request: Request, ctx: RouteContext<'/api/events/[slug]/apply'>) {
  const phone = requireMember(request);
  if (typeof phone !== 'string') return phone;
  try {
    const { slug } = await ctx.params;
    const { memo } = await request.json();
    await applyToEvent(slug, phone, memo);
    return json({ success: true });
  } catch (err) {
    return failWith(err, '신청하지 못했어요.');
  }
}
