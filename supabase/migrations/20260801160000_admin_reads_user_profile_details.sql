-- The admin panel's Users tab needs to display city/date_of_birth, but there was no
-- admin-scoped SELECT policy on this table (only "own row"), matching the admin-access
-- pattern already used on every other admin-managed table.
-- Applied directly to production first; this records it.
CREATE POLICY "JeetoBaz admin reads profile details" ON public.user_profile_details
FOR SELECT TO authenticated
USING (auth.uid() = '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid);
