/*
# Create teams table for FerroFodder's Teams

1. New Tables
- `teams`
  - `id` (uuid, primary key, default gen_random_uuid())
  - `format` (text, not null) — 'ou' or 'ndou'
  - `archetype` (text, not null) — one of 8 slugs: hyper-offense, offense, bulky-offense, balance, bulky-balance, semi-stall, stall, heat
  - `date_created` (date, not null) — date the team was created
  - `pokepaste_text` (text, not null) — raw pokepaste import text
  - `pokepaste_url` (text) — link to pokepast.es page
  - `pokemon` (jsonb, not null) — array of 6 objects { nickname, species }
  - `created_at` (timestamptz, default now())

2. Indexes
- Index on (format, archetype) for fast category filtering
- Index on date_created desc for ordering

3. Security
- Enable RLS on `teams`.
- Public can read all rows (TO anon, authenticated) — the showcase is intentionally public.
- Only authenticated admin can insert and delete rows (TO authenticated).
- No update policy needed — teams are created and deleted, not edited.
*/

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  format text NOT NULL CHECK (format IN ('ou', 'ndou')),
  archetype text NOT NULL CHECK (archetype IN ('hyper-offense', 'offense', 'bulky-offense', 'balance', 'bulky-balance', 'semi-stall', 'stall', 'heat')),
  date_created date NOT NULL,
  pokepaste_text text NOT NULL,
  pokepaste_url text,
  pokemon jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teams_format_archetype ON teams (format, archetype);
CREATE INDEX IF NOT EXISTS idx_teams_date_created ON teams (date_created DESC);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Public read: anyone (anon + authenticated) can view all teams
DROP POLICY IF EXISTS "public_select_teams" ON teams;
CREATE POLICY "public_select_teams"
ON teams FOR SELECT
TO anon, authenticated
USING (true);

-- Admin insert: only authenticated admin can add teams
DROP POLICY IF EXISTS "admin_insert_teams" ON teams;
CREATE POLICY "admin_insert_teams"
ON teams FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admin delete: only authenticated admin can delete teams
DROP POLICY IF EXISTS "admin_delete_teams" ON teams;
CREATE POLICY "admin_delete_teams"
ON teams FOR DELETE
TO authenticated
USING (true);
