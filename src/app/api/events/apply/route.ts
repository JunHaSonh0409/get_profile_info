import { createApplication, getApplications } from '@/lib/applications';
import { getEventBySlug } from '@/lib/events';
import { parseCapacity } from '@/lib/eventCapacity';
import { errorMessage, fail, json } from '@/lib/http';
import { getMemberPhone } from '@/lib/memberAuth';

export async function POST(request: Request) {
  try {
    const { eventSlug, name, phone, gender, age, memo } = await request.json();
    if (!eventSlug) return fail('이벤트 슬러그가 필요합니다.', 400);
    if (gender !== '남성' && gender !== '여성') return fail('성별을 선택해주세요.', 400);

    const event = await getEventBySlug(eventSlug);
    if (!event) return fail('존재하지 않는 이벤트입니다.', 404);
    if (event.status !== 'ongoing') {
      return fail('현재 신청 접수 중인 이벤트가 아닙니다. (오픈 대기중이거나 마감됨)', 400);
    }

    const limit = parseCapacity(event.capacity)[gender === '여성' ? 'female' : 'male'];
    if (limit !== null) {
      const taken = (await getApplications(eventSlug)).filter(
        (a) => a.gender === gender && a.status !== 'cancelled'
      ).length;
      if (taken >= limit) return fail(`${gender} 모집 인원(${limit}명)이 모두 마감되었습니다.`, 400);
    }

    const result = await createApplication({
      eventSlug,
      volNumber: event.volNumber,
      name: String(name || ''),
      // Applying stays open to guests, but a logged-in member applies with their verified number.
      phone: getMemberPhone(request) ?? String(phone || ''),
      gender,
      age: age || '',
      status: 'confirmed',
      memo: memo || '',
    });
    if (!result.success) return fail(result.error || '신청에 실패했습니다.', 400);

    return json({
      success: true,
      message: `${event.volNumber} 이벤트 참가 신청이 완료되었습니다!`,
      application: result.application,
    });
  } catch (err) {
    return fail(errorMessage(err, '신청 처리 중 오류가 발생했습니다.'), 500);
  }
}
