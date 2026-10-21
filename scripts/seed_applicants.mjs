import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://brgudktnkiyzbazqhmqc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZ3Vka3Rua2l5emJhenFobXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNzUyMjcsImV4cCI6MjEwNzc1MTIyN30.cveN4d3KJh0i-PQ5g5NtsA9PesA_1J1NSUEKnwqWs4E';
const supabase = createClient(supabaseUrl, supabaseKey);

const now = new Date();

const maleApplicants = [
  { name: '김도윤', phone: '010-8291-3482', gender: '남성', age: '29', memo: '좋은 인연 찾고 싶어서 신청합니다! 밝고 긍정적인 성격이에요.' },
  { name: '이서진', phone: '010-3948-1928', gender: '남성', age: '31', memo: '주말에 함께 맛집 탐방하고 대화 잘 통하는 분 만나고 싶어요.' },
  { name: '박민재', phone: '010-5829-4710', gender: '남성', age: '28', memo: 'Orbit 이벤트 기대하고 있었습니다. 진솔한 만남 기대합니다.' },
  { name: '정우성', phone: '010-7193-8472', gender: '남성', age: '32', memo: '운동 좋아하고 차분한 스타일입니다. 좋은 인연 닿기를 바라요.' },
  { name: '최현우', phone: '010-4820-1938', gender: '남성', age: '27', memo: '음악과 전시회 좋아합니다. 코드 잘 맞는 분과 친해지고 싶어요.' },
  { name: '강태오', phone: '010-9182-3746', gender: '남성', age: '30', memo: '서로 존중하고 편안하게 오래 만날 분 찾습니다.' },
  { name: '조민성', phone: '010-2849-5719', gender: '남성', age: '26', memo: '새로운 인연과의 만남에 설렙니다. 성실하고 유쾌합니다.' },
  { name: '윤시우', phone: '010-6391-4820', gender: '남성', age: '33', memo: '따뜻하고 배려심 깊은 만남 원합니다. 잘 부탁드립니다.' },
  { name: '임준혁', phone: '010-1849-3920', gender: '남성', age: '29', memo: '여행과 커피 좋아합니다! 서로 긍정적인 에너지 나눌 분 희망해요.' },
  { name: '한승우', phone: '010-8472-1948', gender: '남성', age: '30', memo: '진지하게 미래를 함께 그려나갈 소중한 인연을 기다립니다.' },
];

const femaleApplicants = [
  { name: '이수아', phone: '010-9382-4719', gender: '여성', age: '27', memo: '따뜻하고 다정한 분과 함께 주말 데이트하고 싶어요 :)' },
  { name: '박지유', phone: '010-7482-1938', gender: '여성', age: '28', memo: '웃음이 많고 밝은 편입니다. 서로 편안한 인연 만나길 기대해요.' },
  { name: '김하은', phone: '010-5928-3847', gender: '여성', age: '26', memo: '카페 투어랑 산책 좋아해요. 대화가 깊게 통하는 분이었으면 좋겠습니다.' },
  { name: '정예린', phone: '010-3849-2819', gender: '여성', age: '29', memo: '서로 배려하고 존중하는 진중한 만남 기대하고 신청합니다.' },
  { name: '최서연', phone: '010-8291-5738', gender: '여성', age: '31', memo: '일도 열심히 하고 쉴 땐 함께 소소한 행복 나눌 수 있는 분!' },
  { name: '윤채원', phone: '010-4729-1849', gender: '여성', age: '25', memo: '좋은 에너지 주고받을 수 있는 다정한 인연을 찾고 있어요.' },
  { name: '강민서', phone: '010-6839-2948', gender: '여성', age: '30', memo: '취미 공유하면서 주말을 즐겁게 보낼 메이트이자 연인을 원해요.' },
  { name: '송지아', phone: '010-1948-5829', gender: '여성', age: '28', memo: 'Orbit 이벤트 콘셉트가 너무 설레서 신청했어요! 좋은 만남 기다릴게요.' },
  { name: '오유진', phone: '010-3829-4710', gender: '여성', age: '29', memo: '따뜻하고 유머러스한 스타일 좋아합니다. 반갑습니다!' },
  { name: '백서율', phone: '010-5839-1928', gender: '여성', age: '27', memo: '솔직하고 편안한 분위기에서 서로를 알아가고 싶어요 :)' },
];

const allData = [];
let offsetMinutes = 120;

// Interleave men and women for a natural submission timeline
for (let i = 0; i < 10; i++) {
  const m = maleApplicants[i];
  const f = femaleApplicants[i];

  const mTime = new Date(now.getTime() - (offsetMinutes * 60 * 1000));
  offsetMinutes -= 5;
  const fTime = new Date(now.getTime() - (offsetMinutes * 60 * 1000));
  offsetMinutes -= 5;

  allData.push({
    id: `app_seed_m_${i + 1}`,
    eventSlug: 'vol01',
    volNumber: 'VOL.01',
    name: m.name,
    phone: m.phone,
    gender: m.gender,
    age: m.age,
    status: 'confirmed',
    memo: m.memo,
    created_at: mTime.toISOString(),
  });

  allData.push({
    id: `app_seed_f_${i + 1}`,
    eventSlug: 'vol01',
    volNumber: 'VOL.01',
    name: f.name,
    phone: f.phone,
    gender: f.gender,
    age: f.age,
    status: 'confirmed',
    memo: f.memo,
    created_at: fTime.toISOString(),
  });
}

// 1. Write to data/event_applications.json
const localPath = path.join(process.cwd(), 'data', 'event_applications.json');
fs.writeFileSync(localPath, JSON.stringify(allData, null, 2), 'utf8');
console.log(`Saved ${allData.length} applicants to ${localPath}`);

// 2. Try inserting into Supabase
async function syncToSupabase() {
  try {
    for (const item of allData) {
      const { data, error } = await supabase.from('event_applications').upsert({
        event_slug: item.eventSlug,
        vol_number: item.volNumber,
        name: item.name,
        phone: item.phone,
        gender: item.gender,
        age: item.age,
        status: item.status,
        memo: item.memo,
        created_at: item.created_at,
      }, { onConflict: 'event_slug, phone' });

      if (error) {
        console.log(`Supabase notice for ${item.name}:`, error.message);
      }
    }
    console.log('Supabase sync attempt finished.');
  } catch (err) {
    console.log('Supabase sync skipped/error:', err.message);
  }
}

syncToSupabase();
