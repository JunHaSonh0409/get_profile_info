-- ==============================================================================
-- Orbit event stages: 진행중 → 선별중 → 선택중 → 종료
-- Run once in Supabase Dashboard → SQL Editor.
--
-- IMPORTANT: this also locks every table down to the server. After running it,
-- the app must use SUPABASE_SERVICE_ROLE_KEY (Vercel env); the public anon key
-- can no longer read or write profiles / applications.
-- ==============================================================================

-- 1. Events: stage deadlines (auto transition) and the moment the lineup was published.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS apply_ends_at TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS like_ends_at TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS choose_ends_at TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Old statuses map onto the new flow ('ongoing' and 'ended' are unchanged).
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events ADD CONSTRAINT events_status_check
  CHECK (status IN ('upcoming', 'ongoing', 'screening', 'choosing', 'ended'));

-- 2. Applications: tied to the member profile, plus the admin's selection flag.
ALTER TABLE public.event_applications ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.event_applications ADD COLUMN IF NOT EXISTS selected BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_app_profile ON public.event_applications(event_slug, profile_id);

-- 3. Likes ("관심있어요"): one per member per event.
CREATE TABLE IF NOT EXISTS public.event_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_slug VARCHAR(50) NOT NULL,
    from_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_application_id UUID NOT NULL REFERENCES public.event_applications(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_slug, from_profile_id)
);
CREATE INDEX IF NOT EXISTS idx_event_likes_target ON public.event_likes(to_application_id);

-- 4. Matches: a selected participant picks exactly one of the people who liked them.
CREATE TABLE IF NOT EXISTS public.event_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_slug VARCHAR(50) NOT NULL,
    application_id UUID NOT NULL REFERENCES public.event_applications(id) ON DELETE CASCADE,
    like_id UUID NOT NULL REFERENCES public.event_likes(id) ON DELETE CASCADE,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_slug, application_id),
    UNIQUE (like_id)
);

-- 5. Lock down: RLS on, no anon/authenticated policies. The server's service-role key bypasses RLS.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "누구나 프로필을 제출할 수 있습니다" ON public.profiles;
DROP POLICY IF EXISTS "등록된 프로필 조회 정책" ON public.profiles;
DROP POLICY IF EXISTS "프로필 수정 정책" ON public.profiles;
DROP POLICY IF EXISTS "누구나 이벤트를 조회할 수 있습니다" ON public.events;
DROP POLICY IF EXISTS "이벤트 관리 정책" ON public.events;
DROP POLICY IF EXISTS "누구나 이벤트에 참가 신청할 수 있습니다" ON public.event_applications;
DROP POLICY IF EXISTS "이벤트 신청자 조회 및 관리 정책" ON public.event_applications;

-- Photos stay publicly readable (public bucket URLs), but only the server may write them.
DROP POLICY IF EXISTS "누구나 프로필 사진을 업로드할 수 있습니다" ON storage.objects;
DROP POLICY IF EXISTS "프로필 사진 수정/삭제 정책" ON storage.objects;
DROP POLICY IF EXISTS "프로필 사진 삭제 정책" ON storage.objects;

-- Stop broadcasting new profiles (with phone numbers) over Realtime.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
  END IF;
END $$;
