// One-off: moves profile photos stored under a phone-number folder (profile-photos/01012345678/...)
// to random names (profile-photos/photos/<uuid>.<ext>), so photo URLs shown to other members no longer
// reveal phone numbers. Updates profiles.photos and deletes the old files. Safe to re-run.
//
// Dry run (prints what would change):  node --env-file=.env.local scripts/migrate-photo-paths.mjs
// Apply:                               node --env-file=.env.local scripts/migrate-photo-paths.mjs --apply

import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'profile-photos';
const apply = process.argv.includes('--apply');
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '');
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const prefix = `${url}/storage/v1/object/public/${BUCKET}/`;
const leaksPhone = (path) => /^\d{9,11}\//.test(path);

const { data: profiles, error } = await db.from('profiles').select('id, nickname, photos');
if (error) throw new Error(error.message);

let moved = 0;
for (const profile of profiles) {
  const photos = Array.isArray(profile.photos) ? profile.photos : [];
  const oldPaths = photos.filter((u) => u.startsWith(prefix)).map((u) => decodeURIComponent(u.slice(prefix.length))).filter(leaksPhone);
  if (oldPaths.length === 0) continue;
  console.log(`${profile.nickname}: ${oldPaths.length} photo(s)`);
  if (!apply) continue;

  const next = [];
  for (const photo of photos) {
    const path = photo.startsWith(prefix) ? decodeURIComponent(photo.slice(prefix.length)) : '';
    if (!leaksPhone(path)) {
      next.push(photo);
      continue;
    }
    const target = `photos/${randomUUID()}.${path.split('.').pop() || 'jpg'}`;
    const { error: copyError } = await db.storage.from(BUCKET).copy(path, target);
    if (copyError) throw new Error(`${path}: ${copyError.message}`);
    next.push(db.storage.from(BUCKET).getPublicUrl(target).data.publicUrl);
  }
  const { error: updateError } = await db.from('profiles').update({ photos: next }).eq('id', profile.id);
  if (updateError) throw new Error(updateError.message);
  await db.storage.from(BUCKET).remove(oldPaths);
  moved += oldPaths.length;
}

console.log(apply ? `Moved ${moved} photo(s).` : 'Dry run only. Re-run with --apply to move them.');
