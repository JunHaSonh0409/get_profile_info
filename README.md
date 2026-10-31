# Orbit Love - 감성 프로필 매칭 온보딩 웹 애플리케이션

Vercel과 Supabase를 기반으로 제작된 단계별(Multi-step) 프로필 등록 및 매칭 신청 웹 애플리케이션입니다.

한 페이지에 긴 설문을 늘어놓지 않고, 세련된 카드 인터페이스와 단계별 안내를 통해 사용자의 즐거운 몰입과 높은 응답 완료율을 유도합니다.

---

## 🌟 주요 기능 및 단계별 구성

1. **Step 1: 기본 인적사항**
   - 이름 (실명)
   - 닉네임 (프로필 노출용)
2. **Step 2: 성별 및 나이**
   - 성별 직관적 버튼 토글 ([ 🙋‍♂️ 남성 ] / [ 🙋‍♀️ 여성 ])
   - 나이 숫자 입력 및 빠른 나이 칩 (24세, 26세, 28세, 30세, 32세, 34세)
3. **Step 3: 신체 스펙 및 연락처**
   - 키 (cm) 입력 및 빠른 키 칩 (158, 163, 168, 173, 178, 183cm)
   - 전화번호 자동 하이픈 포맷팅 (`010-XXXX-XXXX`)
   - 개인정보 안심 보관 안내
4. **Step 4: 거주 및 활동 지역 (구 단위까지만)**
   - 전국 17개 시/도 및 시/군/구 2단계 셀렉터
   - 자주 선택하는 서울/경기/인천/부산 인기 지역 빠른 태그
   - 직접 입력 및 수정 지원
5. **Step 5: 선호하는 이성상 (외모 및 동물상)**
   - 🐶 강아지상, 🐱 고양이상, 🦊 여우상, 🐰 토끼상, 🐻 곰돌이상, 🦖 공룡상, 🐺 늑대상, 🦌 사슴상
   - ✨ **상관없음** (외모나 동물상보다는 성격/느낌 우선)
   - 다중 선택 지원 및 직관적인 칩 UI
6. **Step 6: 선호하는 이성 (자세히)**
   - 대화 스타일, 취향, 가치관 등 상세 서술
   - 아이디어 추천 칩 (클릭 시 자동 추가)
   - 글자 수 카운터 및 적정 작성 권장 안내
7. **Step 7: 본인은 어떤 사람인가 (자세히)**
   - 나의 매력, 성격, 취미, 휴일을 보내는 방식 등 상세 소개
   - 작성 영감을 주는 추천 칩 제공
   - 실시간 글자 수 카운터
8. **Step 8: 최종 확인 및 검토 (Review)**
   - 작성된 모든 프로필을 카드 형태로 한눈에 점검
   - 각 항목별 `[수정]` 클릭 시 해당 스텝으로 즉시 점프
   - 개인정보 제공 및 매칭 동의
9. **Step 9: 등록 완료 축하 (Success)**
   - 화려한 폭죽 애니메이션 (`canvas-confetti`)
   - 접수 일시 및 고유 접수 번호 안내
   - 상단 `📋 접수 목록` 모달을 통해 등록된 신청 내역 즉시 열람 가능

---

## 🚀 빠른 시작 (로컬 실행)

```bash
# 1. 패키지 설치
npm install

# 2. 로컬 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) (또는 지정된 포트)으로 접속합니다.

> 💡 Supabase 환경변수가 없으면 저장 API가 오류를 돌려줍니다 (가짜로 저장된 척하는 데모 모드는 없어요).

---

## 🗄️ Supabase 데이터베이스 연동 방법

### 1. Supabase 프로젝트 생성
[Supabase](https://supabase.com)에 로그인 후 새 프로젝트를 생성합니다.

### 2. 테이블 생성 (SQL Editor)
`supabase/schema.sql` 파일의 내용을 복사하여 Supabase의 **SQL Editor**에 붙여넣고 `Run`을 누릅니다.

```sql
-- profiles 테이블 생성 및 RLS 정책 활성화
-- (상세 쿼리는 supabase/schema.sql 파일 참조)
```

### 3. API 키 복사 및 환경변수 설정
Supabase 대시보드의 **Project Settings -> API**에서:
- `Project URL` 복사
- `service_role` 키 복사 (서버 전용, 외부에 노출 금지)

프로젝트 루트의 `.env.local` 파일에 기입합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. 인증 관련 환경변수

| 변수 | 필수 | 설명 |
| --- | --- | --- |
| `MEMBER_SESSION_SECRET` | ✅ | 회원 세션 쿠키(`orbit_member_session`) HMAC 서명 키. 없으면 로그인이 503으로 막힙니다. `ADMIN_SECRET_KEY`와 다른 값을 쓰세요. |
| `OCTOMO_API_KEY` | production ✅ | 문자 인증 확인용. 비어 있으면 **개발 환경(`NODE_ENV !== production`)에서만** 모든 번호가 데모 통과하고, production에서는 인증이 503으로 거부됩니다. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_SECRET_KEY` | ✅ (관리자) | 관리자 로그인. 하나라도 없으면 관리자 로그인이 막힙니다. |

랜덤 시크릿 생성: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

문자 인증(`/api/verify/check`)이 통과하면 서버가 HttpOnly·SameSite=Lax(production에서는 Secure) 서명 쿠키를 발급하고,
`GET/POST/PUT /api/profile`과 `/api/upload`는 이 쿠키의 전화번호만 사용합니다(클라이언트가 보낸 phone/id는 무시, 세션이 없으면 401).
로그아웃은 `POST /api/member/logout`.

### 5. 데이터베이스 잠금 (필수)

`supabase/migrations/20261028_event_stages.sql`을 SQL Editor에서 한 번 실행하세요. 이벤트 단계용 컬럼·테이블을 만들고,
**모든 테이블을 서버 전용으로 잠급니다**(anon 정책 삭제, 프로필 Realtime 방송 중단). 실행 후에는 `SUPABASE_SERVICE_ROLE_KEY`가
반드시 서버 환경변수에 있어야 합니다. 공개 anon 키로는 더 이상 프로필·신청자를 읽거나 쓸 수 없어요.

| 변수 | 필수 | 설명 |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | 서버 전용 키(RLS 우회). 절대 `NEXT_PUBLIC_`으로 노출하지 마세요. |
| `NEXT_PUBLIC_SITE_URL` | 권장 | 알림톡 버튼 링크의 기준 주소. 기본값 `https://get-profile-info.vercel.app` |
| `CRON_SECRET` | 권장 | Vercel Cron이 `/api/cron/events`를 부를 때 쓰는 Bearer 토큰. |

## 🗓️ 이벤트 진행 방식

`오픈 예정 → 진행중(신청, 기본 3일) → 선별중(선별 공개 후 관심 보내기, 기본 2일) → 선택중(기본 1일) → 종료`

- **진행중**: 로그인하고 프로필이 있는 회원만, 한마디(30자 이상)로 신청합니다. 이름·연락처·성별·나이는 프로필에서 자동으로 들어갑니다.
- **선별중**: 관리자 > 진행·선별 탭에서 사진 없는 사람 거르기, 남·여 인원 무작위 뽑기, 직접 체크로 선별한 뒤 **선별 확정하고 공개**합니다(한 번만).
  공개되면 `/events/{slug}/lineup`에서 회원들이 이성 참가자 중 **한 명에게만** '관심있어요'를 보낼 수 있습니다.
  선별된 사람은 같은 페이지에서 **자신에게 관심을 보낸 사람의 프로필**(실명·연락처 제외)을 바로 확인합니다. 페이지를 켜 두면 30초마다 새 관심이 반영됩니다.
- **선택중**: 선별된 사람은 자신에게 관심을 보낸 사람 중 **한 명**을 고릅니다.
- **종료**: 서로 연결된 두 사람에게 상대의 전화번호가 담긴 카드가 선택 페이지와 알림톡으로 전달됩니다.
- 이벤트 카드 탭의 **단계 마감 시각**이 지나면 다음 단계로 자동으로 넘어갑니다. 페이지가 조회될 때마다 확인하고,
  Vercel Cron(`vercel.json`, 하루 1회)이 보조로 돌립니다. 선별중 → 선택중은 선별을 공개한 뒤에만 넘어갑니다.

### 카카오 알림톡 (SOLAPI)

**매칭 결과만** 카카오톡 알림톡으로 보냅니다(관심 도착은 웹사이트에서만 확인). 설정이 없으면 발송만 건너뛰고 나머지 흐름은 그대로 동작합니다.

1. 카카오톡 채널을 비즈니스 채널로 만들고 SOLAPI 콘솔에서 연동해 채널 ID(pfId)를 받습니다.
2. 아래 템플릿을 등록해 카카오 검수를 받습니다(정보성 메시지만 승인되며, 광고 문구를 넣으면 반려됩니다). 변수 이름은 코드와 같아야 합니다.
3. 환경변수 `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_PF_ID`, `SOLAPI_TEMPLATE_MATCH`를 넣습니다.
   `SOLAPI_SENDER`(등록된 발신번호)를 넣으면 알림톡 실패 시 문자로 대체 발송됩니다.

**매칭 결과 템플릿 (`SOLAPI_TEMPLATE_MATCH`)**
```
[Orbit] #{nickname}님, #{event} 매칭이 성사되었어요.

상대: #{partner}
연락처: #{partner_phone}

먼저 반갑게 인사를 건네보세요.
```
버튼(웹링크): `#{link}`

---

## ☁️ Vercel 배포 가이드

1. **GitHub 저장소에 코드 푸시**
   ```bash
   git add .
   git commit -m "feat: complete multi-step profile onboarding app"
   git push origin main
   ```

2. **Vercel 프로젝트 가져오기**
   - [Vercel](https://vercel.com) 로그인 -> `Add New...` -> `Project`
   - 해당 GitHub 저장소를 선택하여 `Import`

3. **환경 변수(Environment Variables) 등록**
   Vercel 대시보드의 **Settings -> Environment Variables**에 아래 변수를 추가합니다:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key`
   - `MEMBER_SESSION_SECRET`, `OCTOMO_API_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SECRET_KEY` (위 "인증 관련 환경변수" 참고)

4. **Deploy 버튼 클릭**
   - 1분 안에 전 세계 CDN에 최적화된 URL이 발급됩니다!
