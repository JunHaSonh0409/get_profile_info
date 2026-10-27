import { getEventBySlug, upsertEvent } from '@/lib/events';
import { errorMessage, fail, json, requireAdmin } from '@/lib/http';

const STATUS_LABEL = { upcoming: '오픈 대기', ongoing: '공식 오픈', ended: '종료' } as const;

export async function PATCH(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const { slug, status } = await request.json();
    if (!slug || !(status in STATUS_LABEL)) return fail('slug and a valid status are required', 400);

    const event = await getEventBySlug(slug);
    if (!event) return fail('Event not found', 404);

    const updated = await upsertEvent({ ...event, slug, status });
    return json({
      success: true,
      event: updated,
      message: `${updated.volNumber} 이벤트 상태가 [${STATUS_LABEL[status as keyof typeof STATUS_LABEL]}]으로 변경되었습니다.`,
    });
  } catch (err) {
    return fail(errorMessage(err, 'Failed'), 500);
  }
}
