-- ==============================================================================
-- Supabase Profiles Table Schema
-- Supabase 대시보드 -> SQL Editor 에서 아래 쿼리를 실행하시면 테이블이 생성됩니다.
-- ==============================================================================

-- 1. profiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE, -- 중복 가입 방지 (1인 1계정)
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('남성', '여성')),
    age VARCHAR(50) NOT NULL, -- 몇년생 (예: 98년생, 01년생)
    height INTEGER NOT NULL CHECK (height >= 120 AND height <= 230),
    location VARCHAR(100) NOT NULL, -- 구 단위까지 (예: 서울 강남구, 경기 성남시 분당구)
    preferred_animals TEXT[] NOT NULL DEFAULT '{}', -- 선호 동물상 리스트
    preferred_appearance_detail TEXT DEFAULT '', -- 원하시는 외적인 구체적인 상 설명
    mbti VARCHAR(10) DEFAULT '', -- MBTI 성격 유형 (예: ENFP, INTJ)
    preferred_partner_detail TEXT NOT NULL, -- 선호하는 이성 상세
    self_intro TEXT NOT NULL, -- 본인은 어떤 사람인가 상세
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 기존 테이블 업데이트 및 전화번호 중복 방지 (1인 1프로필 제한)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_appearance_detail TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mbti VARCHAR(10) DEFAULT '';

-- 기존 데이터 전화번호의 하이픈(-) 제거 표준화
UPDATE public.profiles SET phone = regexp_replace(phone, '[^0-9]', '', 'g');

-- 전화번호 UNIQUE 제약조건 추가 (중복 방지)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_phone_unique'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);
  END IF;
END $$;

-- 전화번호 유니크 인덱스 생성
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique ON public.profiles(phone);

-- 2. RLS(Row Level Security) 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 익명 사용자(웹 방문자)가 프로필을 등록(INSERT)할 수 있도록 허용하는 정책
CREATE POLICY "누구나 프로필을 제출할 수 있습니다" 
ON public.profiles 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- (선택) 서비스 키 또는 인증 사용자가 프로필 목록을 조회(SELECT)할 수 있는 정책
CREATE POLICY "등록된 프로필 조회 정책" 
ON public.profiles 
FOR SELECT 
TO anon, authenticated
USING (true);

-- 회원이 자신의 프로필을 수정(UPDATE)할 수 있도록 허용하는 정책
CREATE POLICY "프로필 수정 정책" 
ON public.profiles 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 인덱스 생성 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);

-- 3. Supabase Realtime 실시간 동기화 활성화
-- 웹소켓을 통해 새 프로필이 등록될 때 실시간으로 알림을 받을 수 있도록 설정합니다.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- ==============================================================================
-- 4. Supabase Storage 설정 (profile-photos 공개 버킷)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "누구나 프로필 사진을 업로드할 수 있습니다" ON storage.objects;
CREATE POLICY "누구나 프로필 사진을 업로드할 수 있습니다"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "누구나 프로필 사진을 볼 수 있습니다" ON storage.objects;
CREATE POLICY "누구나 프로필 사진을 볼 수 있습니다"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "프로필 사진 수정/삭제 정책" ON storage.objects;
CREATE POLICY "프로필 사진 수정/삭제 정책"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "프로필 사진 삭제 정책" ON storage.objects;
CREATE POLICY "프로필 사진 삭제 정책"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'profile-photos');

-- ==============================================================================
-- 5. Events 테이블 생성 (이벤트 카드 및 이벤트 상세 페이지 관리)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.events (
    id VARCHAR(50) PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    vol_number VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(200) DEFAULT '',
    status VARCHAR(20) DEFAULT 'upcoming',
    image_url TEXT DEFAULT '',
    d_day_text VARCHAR(100) DEFAULT '',
    badge_text VARCHAR(100) DEFAULT 'ORBIT EXCLUSIVE',
    description TEXT DEFAULT '',
    date VARCHAR(100) DEFAULT '',
    location VARCHAR(100) DEFAULT '',
    capacity VARCHAR(100) DEFAULT '',
    content TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS 활성화
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 누구나 이벤트 목록 및 상세 조회를 허용하는 정책
DROP POLICY IF EXISTS "누구나 이벤트를 조회할 수 있습니다" ON public.events;
CREATE POLICY "누구나 이벤트를 조회할 수 있습니다" 
ON public.events 
FOR SELECT 
TO anon, authenticated
USING (true);

-- 관리자(또는 anon 서비스)가 이벤트를 생성/수정/삭제할 수 있는 정책
DROP POLICY IF EXISTS "이벤트 관리 정책" ON public.events;
CREATE POLICY "이벤트 관리 정책" 
ON public.events 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- 6. Event Applications 테이블 (이벤트 참가 신청자 명단 관리)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.event_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_slug VARCHAR(50) NOT NULL,
    vol_number VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    gender VARCHAR(10) DEFAULT '',
    age VARCHAR(50) DEFAULT '',
    status VARCHAR(20) DEFAULT 'confirmed', -- 'pending', 'confirmed', 'cancelled'
    memo TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 이벤트별 전화번호 중복 신청 방지 유니크 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_app_unique ON public.event_applications(event_slug, phone);

-- RLS 활성화
ALTER TABLE public.event_applications ENABLE ROW LEVEL SECURITY;

-- 누구나 이벤트 참가 신청(INSERT)할 수 있는 정책
DROP POLICY IF EXISTS "누구나 이벤트에 참가 신청할 수 있습니다" ON public.event_applications;
CREATE POLICY "누구나 이벤트에 참가 신청할 수 있습니다" 
ON public.event_applications 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 관리자/조회 정책
DROP POLICY IF EXISTS "이벤트 신청자 조회 및 관리 정책" ON public.event_applications;
CREATE POLICY "이벤트 신청자 조회 및 관리 정책" 
ON public.event_applications 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);



