-- Removes the test members from test_profiles.sql (and, through ON DELETE CASCADE,
-- their event applications, likes and matches). Matches on both nickname and phone
-- so a real member can never be caught.
DELETE FROM public.profiles
WHERE nickname LIKE '테스트%'
  AND phone IN (
    SELECT '010' || lpad(n::text, 8, '0') FROM generate_series(1, 10) AS n
    UNION ALL
    SELECT '010' || lpad(n::text, 4, '0') || '0000' FROM generate_series(1, 10) AS n
  );
