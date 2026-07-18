/*
# Create folders table for grouping teams within an archetype

1. New Tables
- `folders`
  - `id` (uuid, primary key, default gen_random_uuid())
  - `gen` (int, not null) — generation number (1-12), matches teams.gen
  - `format` (text, not null) — format slug (ou, uu, etc.), matches teams.format
  - `archetype` (text, not null) — archetype slug, matches teams.archetype
  - `name` (text, not null) — folder display name (e.g. "Stall Variants")
  - `description` (text, nullable) — optional longer description shown on the folder card
  - `preview_team_id` (uuid, nullable) — references teams.id; the team whose 6 Pokémon are shown as the folder's preview. Defaults to first team in folder when null.
  - `sort_order` (int, not null default 0) — manual ordering of folders within a category
  - `created_at` (timestamptz, default now())

2. Modified Tables
- `teams`
  - Add `folder_id` (uuid, nullable) — references folders.id. When set, the team belongs to that folder. On folder delete, set null so teams remain as standalone.
  - Add `sort_order` (int, not null default 0) — manual ordering of teams within a folder or standalone list.

3. Indexes
- `idx_folders_category` on folders (gen, format, archetype) for fast category filtering
- `idx_folders_sort` on folders (gen, format, archetype, sort_order)
- `idx_teams_folder_id` on teams (folder_id) for fast folder membership lookups

4. Constraints
- `folders_category_name_unique` UNIQUE on (gen, format, archetype, name) — no duplicate folder names within the same category
- Foreign key from folders.preview_team_id to teams(id) ON DELETE SET NULL
- Foreign key from teams.folder_id to folders(id) ON DELETE SET NULL

5. Security
- Enable RLS on `folders`.
- Public read (TO anon, authenticated) — the showcase is intentionally public.
- Only authenticated admin can insert, update, delete folders.
- teams.folder_id is writable through the existing teams-admin edge function (service role bypasses RLS).
*/

CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gen int NOT NULL CHECK (gen >= 1 AND gen <= 12),
  format text NOT NULL,
  archetype text NOT NULL,
  name text NOT NULL,
  description text,
  preview_team_id uuid,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT folders_category_name_unique UNIQUE (gen, format, archetype, name)
);

-- Add folder_id and sort_order to teams (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'teams' AND column_name = 'folder_id') THEN
    ALTER TABLE teams ADD COLUMN folder_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'teams' AND column_name = 'sort_order') THEN
    ALTER TABLE teams ADD COLUMN sort_order int NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Foreign keys (idempotent via DO block check on pg_constraint)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'folders_preview_team_id_fkey') THEN
    ALTER TABLE folders
      ADD CONSTRAINT folders_preview_team_id_fkey
      FOREIGN KEY (preview_team_id) REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_folder_id_fkey') THEN
    ALTER TABLE teams
      ADD CONSTRAINT teams_folder_id_fkey
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_folders_category ON folders (gen, format, archetype);
CREATE INDEX IF NOT EXISTS idx_folders_sort ON folders (gen, format, archetype, sort_order);
CREATE INDEX IF NOT EXISTS idx_teams_folder_id ON teams (folder_id);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can view folders
DROP POLICY IF EXISTS "public_select_folders" ON folders;
CREATE POLICY "public_select_folders"
ON folders FOR SELECT
TO anon, authenticated
USING (true);

-- Admin insert
DROP POLICY IF EXISTS "admin_insert_folders" ON folders;
CREATE POLICY "admin_insert_folders"
ON folders FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admin update (rename, description, preview team, sort order)
DROP POLICY IF EXISTS "admin_update_folders" ON folders;
CREATE POLICY "admin_update_folders"
ON folders FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Admin delete
DROP POLICY IF EXISTS "admin_delete_folders" ON folders;
CREATE POLICY "admin_delete_folders"
ON folders FOR DELETE
TO authenticated
USING (true);
