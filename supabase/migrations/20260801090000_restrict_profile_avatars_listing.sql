-- Public buckets already serve objects via the public URL endpoint without
-- needing an RLS SELECT policy. This broad policy let anyone list every
-- file in the profile-avatars bucket via the storage API. The app only
-- ever uses upload()/getPublicUrl()/remove() (no list() or download()
-- calls), so dropping it doesn't change app behavior.
-- Applied directly to production first; this records it.
drop policy if exists "profile_avatars_public_read" on storage.objects;
