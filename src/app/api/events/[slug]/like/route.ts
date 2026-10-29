import { sendLike } from '@/lib/eventFlow';
import { fail, failWith, json, requireMember } from '@/lib/http';

/** "관심있어요": once per member per event, only to a selected participant of the other gender. */
export async function POST(request: Request, ctx: RouteContext<'/api/events/[slug]/like'>) {
  const phone = requireMember(request);
  if (typeof phone !== 'string') return phone;
  try {
    const { slug } = await ctx.params;
    const { applicationId } = await request.json();
    if (typeof applicationId !== 'string' || !applicationId) return fail('관심을 보낼 사람을 골라주세요.', 400);
    await sendLike(slug, phone, applicationId);
    return json({ success: true });
  } catch (err) {
    return failWith(err, '관심을 보내지 못했어요.');
  }
}
