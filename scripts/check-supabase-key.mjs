// Diagnoses why Supabase rejects the server key WITHOUT printing any secret value.
// Run from the project root:  node --env-file=.env.local scripts/check-supabase-key.mjs

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const raw = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const line = (label, value) => console.log(`${label.padEnd(28)} ${value}`);
const urlRef = (url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/) || [])[1];

line('URL 프로젝트 ref', urlRef || `인식 불가 (${url ? 'https://<ref>.supabase.co 형식이 아님' : '비어 있음'})`);

if (raw === undefined) {
  line('SERVICE_ROLE_KEY', '없음 → 변수 이름 오타이거나 .env.local에 없음');
  process.exit(1);
}

const key = raw.trim();
line('앞뒤 공백/줄바꿈', raw === key ? '없음' : '있음 (코드는 trim하므로 보통 괜찮음)');
line('따옴표 포함', /^["']|["']$/.test(key) ? '있음 → 따옴표를 빼세요' : '없음');
line('길이', key.length);

let kind = '알 수 없는 형식';
if (key.startsWith('sb_secret_')) kind = 'sb_secret_ (새 방식 서버 키) ✅';
else if (key.startsWith('sb_publishable_')) kind = 'sb_publishable_ (공개 키) ❌ 서버 키가 아님';
else if (key.startsWith('eyJ')) {
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
    kind = `JWT (예전 방식), role=${payload.role}, ref=${payload.ref}`;
    if (payload.role !== 'service_role') kind += '  ❌ service_role이 아님 (anon 키를 넣은 것)';
    if (urlRef && payload.ref && payload.ref !== urlRef) kind += '  ❌ URL과 다른 프로젝트의 키';
  } catch {
    kind = 'JWT처럼 보이지만 해석 불가 → 복사하다 잘린 것 같음';
  }
}
line('키 종류', kind);
line('anon 키와 동일', anon && anon.trim() === key ? '예 ❌ 공개 키를 서버 키 자리에 넣음' : '아니오');

if (!urlRef) process.exit(1);
const res = await fetch(`${url}/rest/v1/events?select=slug&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
const body = await res.text();
line('Supabase 실제 응답', `${res.status} ${res.ok ? 'OK ✅ 키 정상' : body.slice(0, 160)}`);
