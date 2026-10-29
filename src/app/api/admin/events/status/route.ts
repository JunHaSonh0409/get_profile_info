import type { EventStatus } from '@/types/event';
import { adminSetStatus } from '@/lib/eventFlow';
import { STAGE_LABEL, STAGE_ORDER } from '@/lib/eventStages';
import { fail, failWith, json, requireAdmin } from '@/lib/http';

/** Manual stage change (deadlines also move events forward automatically). */
export async function PATCH(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { slug, status } = await request.json();
    if (!slug || !STAGE_ORDER.includes(status)) return fail('slug와 올바른 단계가 필요해요.', 400);
    const event = await adminSetStatus(slug, status as EventStatus);
    return json({ success: true, event, message: `${event.volNumber} 이벤트를 [${STAGE_LABEL[event.status]}] 단계로 바꿨어요.` });
  } catch (err) {
    return failWith(err, '단계를 바꾸지 못했어요.');
  }
}
