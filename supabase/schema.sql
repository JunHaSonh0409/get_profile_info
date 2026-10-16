-- ==============================================================================
-- Supabase Profiles Table Schema
-- Supabase 대시보드 -> SQL Editor 에서 아래 쿼리를 실행하시면 테이블이 생성됩니다.
-- ==============================================================================

-- 1. profiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('남성', '여성')),
    age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
    height INTEGER NOT NULL CHECK (height >= 120 AND height <= 230),
    location VARCHAR(100) NOT NULL, -- 구 단위까지 (예: 서울 강남구, 경기 성남시 분당구)
    preferred_animals TEXT[] NOT NULL DEFAULT '{}', -- 선호 동물상 리스트
    preferred_partner_detail TEXT NOT NULL, -- 선호하는 이성 상세
    self_intro TEXT NOT NULL, -- 본인은 어떤 사람인가 상세
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

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

-- 인덱스 생성 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
