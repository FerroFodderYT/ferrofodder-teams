/*
# Restrict teams INSERT and DELETE to authenticated role only

Previously insert and delete policies used `TO anon, authenticated` with
USING/WITH CHECK (true), which triggered "RLS policy always true" security
warnings and left the table open to unauthenticated writes from any client.

The new approach: all mutations go through the `teams-admin` edge function,
which verifies the admin password server-side and writes using the
service-role key. The service-role key bypasses RLS entirely, so the
policies below never block it. The anon key (browser) can only SELECT.

Changes:
- Drop the open anon+authenticated insert policy, replace with authenticated-only.
- Drop the open anon+authenticated delete policy, replace with authenticated-only.
- SELECT policy (anon+authenticated, USING true) is intentionally public and unchanged.
*/

DROP POLICY IF EXISTS "admin_insert_teams" ON teams;
CREATE POLICY "admin_insert_teams"
ON teams FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_teams" ON teams;
CREATE POLICY "admin_delete_teams"
ON teams FOR DELETE
TO authenticated
USING (true);
