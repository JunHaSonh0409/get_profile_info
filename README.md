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

> 💡 **데모 모드 지원**: Supabase 환경변수를 아직 설정하지 않았더라도 로컬 모의 접수(Local Storage 연동)를 통해 전 단계를 테스트해볼 수 있습니다.

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
- `anon public key` 복사

프로젝트 루트의 `.env.local` 파일에 기입합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

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
   Vercel 대시보드의 **Settings -> Environment Variables**에 아래 2가지 변수를 추가합니다:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key-here`

4. **Deploy 버튼 클릭**
   - 1분 안에 전 세계 CDN에 최적화된 URL이 발급됩니다!
# get_profile_info
