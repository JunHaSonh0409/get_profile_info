-- "관심있어요" carries a short note to the recipient (shown on their lineup page).
ALTER TABLE public.event_likes ADD COLUMN IF NOT EXISTS message VARCHAR(100) NOT NULL DEFAULT '';
