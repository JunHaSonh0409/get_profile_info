-- ==============================================================================
-- Test members for trying the event flow (run in Supabase Dashboard → SQL Editor).
-- 여성 10명: 01000000001 ~ 01000000010
-- 남성 10명: 01000010000, 01000020000, ... 01000100000
-- Every test member's nickname starts with "테스트" so they are easy to spot and remove
-- (see test_profiles_delete.sql). Odd-numbered members get a photo so the
-- "사진 없는 사람 거르기" filter has something to filter. Re-running is safe: existing phones are skipped.
-- ==============================================================================

INSERT INTO public.profiles
  (name, nickname, phone, gender, age, height, location, mbti,
   preferred_animals, preferred_appearance_detail, preferred_partner_detail, self_intro, photos)
SELECT
  format('테스트%s%s', CASE WHEN g.female THEN '여' ELSE '남' END, lpad(g.n::text, 2, '0')),
  format('테스트%s%s', CASE WHEN g.female THEN '여' ELSE '남' END, lpad(g.n::text, 2, '0')),
  CASE WHEN g.female THEN '010' || lpad(g.n::text, 8, '0')
       ELSE '010' || lpad(g.n::text, 4, '0') || '0000' END,
  CASE WHEN g.female THEN '여성' ELSE '남성' END,
  (90 + g.n)::text || '년생',
  CASE WHEN g.female THEN 155 + g.n ELSE 168 + g.n END,
  (ARRAY['서울 강남구', '서울 마포구', '서울 송파구', '서울 성동구', '경기 성남시 분당구'])[1 + g.n % 5],
  (ARRAY['ENFP', 'INFJ', 'ISTJ', 'ESTP', 'INTP'])[1 + g.n % 5],
  CASE WHEN g.female THEN ARRAY['곰돌이상', '강아지상'] ELSE ARRAY['고양이상', '토끼상'] END,
  '웃는 모습이 편안한 인상이면 좋아요.',
  '대화가 잘 통하고 서로의 일상을 존중해 주는 사람을 만나고 싶어요. 주말에 같이 산책하거나 맛집을 찾아다니면 좋겠어요.',
  format('테스트 계정 %s번이에요. 처음엔 조금 낯을 가리지만 친해지면 장난도 많이 치는 편이에요. 요즘은 퇴근 후 러닝과 요리에 빠져 있어요.', g.n),
  CASE WHEN g.n % 2 = 1 THEN ARRAY['https://get-profile-info.vercel.app/images/event-galaxy.png'] ELSE '{}'::text[] END
FROM (
  SELECT n, true AS female FROM generate_series(1, 10) AS n
  UNION ALL
  SELECT n, false AS female FROM generate_series(1, 10) AS n
) AS g
ON CONFLICT (phone) DO NOTHING;

-- Check: should list 20 rows
SELECT nickname, phone, gender, age, height, cardinality(photos) AS photo_count
FROM public.profiles
WHERE nickname LIKE '테스트%'
ORDER BY gender, phone;
