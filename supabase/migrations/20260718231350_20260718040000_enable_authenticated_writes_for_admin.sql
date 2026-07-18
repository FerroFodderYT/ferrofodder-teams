/*
# Enable authenticated writes for admin via Supabase Auth

## Background
The app is moving from a custom password-based admin (via the teams-admin
edge function + service-role key) to standard Supabase email/password auth.
The admin logs in at /admin/login; the browser client then carries an
 authenticated session, and RLS `authenticated` policies allow direct
 writes to teams, folders, and the visibility tables — no edge function
 needed.

## Changes
1. `teams` — add UPDATE policy for authenticated users (previously updates
   went through the service-role edge function, so no UPDATE policy existed).
2. `gen_visibility` — add UPDATE policy for authenticated users so the
   admin can toggle generation visibility from the browser.
3. `format_visibility` — add UPDATE policy for authenticated users so the
   admin can toggle format visibility from the browser.

## Security
- SELECT remains public (anon + authenticated) on all tables — the showcase
  is intentionally public.
- Writes (INSERT/UPDATE/DELETE) are restricted to `authenticated` only.
  Any signed-in admin can mutate; anonymous visitors cannot.
- No `user_id` ownership scoping is used because this is a single-admin
  showcase, not a multi-user app — any authenticated user is the admin.
*/

-- teams: allow authenticated users to update rows
DROP POLICY IF EXISTS "admin_update_teams" ON teams;
CREATE POLICY "admin_update_teams"
ON teams FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- gen_visibility: allow authenticated users to update visibility
DROP POLICY IF EXISTS "admin_update_gen_visibility" ON gen_visibility;
CREATE POLICY "admin_update_gen_visibility"
ON gen_visibility FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- format_visibility: allow authenticated users to update visibility
DROP POLICY IF EXISTS "admin_update_format_visibility" ON format_visibility;
CREATE POLICY "admin_update_format_visibility"
ON format_visibility FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
