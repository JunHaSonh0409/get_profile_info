import { chooseLiker } from '@/lib/eventFlow';
import { fail, failWith, isUuid, json, requireMember } from '@/lib/http';

/** A selected participant picks one of the people who liked them (once). */
export async function POST(request: Request, ctx: RouteContext<'/api/events/[slug]/choose'>) {
  const phone = requireMember(request);
  if (typeof phone !== 'string') return phone;
  try {
    const { slug } = await ctx.params;
    const { likeId } = await request.json();
    if (!isUuid(likeId)) return fail('선택할 사람을 골라주세요.', 400);
    await chooseLiker(slug, phone, likeId);
    return json({ success: true });
  } catch (err) {
    return failWith(err, '선택하지 못했어요.');
  }
}
