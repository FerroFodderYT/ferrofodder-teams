/*
# Drop unused INSERT and DELETE RLS policies from teams

All mutations to the teams table are performed exclusively by the
`teams-admin` edge function, which authenticates using the Supabase
service-role key. The service-role key bypasses RLS entirely, so these
policies are never evaluated and serve no purpose.

Retaining them causes security scanner warnings because their conditions
are unconditionally true (USING (true) / WITH CHECK (true)) for the
authenticated role, which the scanner correctly flags as unrestricted access.

The only remaining policy is public_select_teams, which allows anon and
authenticated users to read all rows — this is intentional for the public
showcase.

Changes:
- DROP POLICY admin_insert_teams ON teams
- DROP POLICY admin_delete_teams ON teams
*/

DROP POLICY IF EXISTS "admin_insert_teams" ON teams;
DROP POLICY IF EXISTS "admin_delete_teams" ON teams;
