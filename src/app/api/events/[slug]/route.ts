import { memberBoard } from '@/lib/eventFlow';
import { failWith, json } from '@/lib/http';
import { getMemberPhone } from '@/lib/memberAuth';

/** The event plus what the current member may see: their status, the lineup, likes and match. */
export async function GET(request: Request, ctx: RouteContext<'/api/events/[slug]'>) {
  try {
    const { slug } = await ctx.params;
    return json({ success: true, ...(await memberBoard(slug, getMemberPhone(request))) });
  } catch (err) {
    return failWith(err);
  }
}
