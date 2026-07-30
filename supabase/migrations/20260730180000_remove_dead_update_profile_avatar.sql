-- update_profile_avatar(requested_phone, requested_avatar_url) had no
-- caller-ownership check at all — it updated any user's avatar_url given
-- only their phone number, no auth.uid() or device-token check whatsoever.
-- Confirmed via repo-wide search: not called from any current frontend
-- code (superseded by update_my_profile, which correctly scopes to
-- auth.uid()). Removing it closes the hole outright instead of patching
-- unreachable code.

drop function if exists public.update_profile_avatar(text, text);
