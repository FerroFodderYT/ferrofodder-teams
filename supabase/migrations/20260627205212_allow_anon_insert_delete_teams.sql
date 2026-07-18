/*
# Open anon insert + delete on teams

The admin verification is now handled client-side via a password modal.
There is no longer a Supabase authenticated session — the frontend uses the
anon key for all operations. We therefore need to extend the insert and delete
policies to the anon role so the admin (who has verified via the password
modal) can write to the table.

Public read already covers anon, so no change there.

Changes:
- Drop the authenticated-only insert policy and replace with anon+authenticated.
- Drop the authenticated-only delete policy and replace with anon+authenticated.
*/

DROP POLICY IF EXISTS "admin_insert_teams" ON teams;
CREATE POLICY "admin_insert_teams"
ON teams FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_teams" ON teams;
CREATE POLICY "admin_delete_teams"
ON teams FOR DELETE
TO anon, authenticated
USING (true);
