-- ==============================================================================
-- Orbit — full schema for a fresh Supabase project (safe to re-run).
-- Existing projects: run supabase/migrations/*.sql in order instead.
--
-- Security model: RLS is on for every table and there are NO anon/authenticated
-- policies. Only the server (SUPABASE_SERVICE_ROLE_KEY) reads or writes data.
-- ==============================================================================

-- 1. Member profiles (one per verified phone number)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE, -- digits only
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('남성', '여성')),
    age VARCHAR(50) NOT NULL, -- 예: 98년생
    height INTEGER NOT NULL CHECK (height >= 120 AND height <= 230),
    location VARCHAR(100) NOT NULL, -- 예: 서울 강남구
    preferred_animals TEXT[] NOT NULL DEFAULT '{}',
    preferred_appearance_detail TEXT DEFAULT '',
    mbti VARCHAR(10) DEFAULT '',
    preferred_partner_detail TEXT NOT NULL,
    self_intro TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);

-- 2. Photo storage: public read via bucket URLs, writes only through the server
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Events: upcoming → ongoing(진행중) → screening(선별중) → choosing(선택중) → ended(종료)
CREATE TABLE IF NOT EXISTS public.events (
    id VARCHAR(50) PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    vol_number VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(200) DEFAULT '',
    status VARCHAR(20) DEFAULT 'upcoming'
        CONSTRAINT events_status_check CHECK (status IN ('upcoming', 'ongoing', 'screening', 'choosing', 'ended')),
    image_url TEXT DEFAULT '',
    d_day_text VARCHAR(100) DEFAULT '',
    badge_text VARCHAR(100) DEFAULT '',
    description TEXT DEFAULT '',
    date VARCHAR(100) DEFAULT '',
    location VARCHAR(100) DEFAULT '',
    capacity VARCHAR(100) DEFAULT '', -- "남 N명 / 여 N명"
    content TEXT DEFAULT '',
    apply_ends_at TIMESTAMPTZ,  -- 진행중 → 선별중
    like_ends_at TIMESTAMPTZ,   -- 선별중 → 선택중 (after published_at)
    choose_ends_at TIMESTAMPTZ, -- 선택중 → 종료
    published_at TIMESTAMPTZ,   -- lineup published by the admin
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Applications: a member's profile + memo; name/phone/gender/age are copied from the profile
CREATE TABLE IF NOT EXISTS public.event_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_slug VARCHAR(50) NOT NULL,
    vol_number VARCHAR(50) NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    gender VARCHAR(10) DEFAULT '',
    age VARCHAR(50) DEFAULT '',
    status VARCHAR(20) DEFAULT 'confirmed',
    memo TEXT DEFAULT '',
    selected BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_app_unique ON public.event_applications(event_slug, phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_app_profile ON public.event_applications(event_slug, profile_id);

-- 5. Likes ("관심있어요"): one per member per event
CREATE TABLE IF NOT EXISTS public.event_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_slug VARCHAR(50) NOT NULL,
    from_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_application_id UUID NOT NULL REFERENCES public.event_applications(id) ON DELETE CASCADE,
    message VARCHAR(100) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_slug, from_profile_id)
);
CREATE INDEX IF NOT EXISTS idx_event_likes_target ON public.event_likes(to_application_id);

-- 6. Matches: each selected participant picks exactly one liker
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

-- 7. Server-only access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_matches ENABLE ROW LEVEL SECURITY;
