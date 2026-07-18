/*
# Create gen_visibility table for admin-controlled generation display

1. Summary
Creates a `gen_visibility` table that stores which Pokemon generations (1-12)
are visible to the public. Admins can toggle visibility for each generation,
allowing future generations (10-12) to be shown only after they are officially
released.

2. New Tables
- `gen_visibility`
  - `gen` (integer, primary key, 1-12) — the generation number
  - `visible` (boolean, not null, default true for 1-9, false for 10-12)
  - `updated_at` (timestamptz, default now()) — when visibility was last changed

3. Initial Data
- Inserts default rows for generations 1-12
- Gens 1-9 default to visible=true (currently released)
- Gens 10-12 default to visible=false (future generations)

4. Security
- Enable RLS on `gen_visibility`
- Public read: anon + authenticated can SELECT all rows (needed for frontend)
- No direct write policies — all mutations go through the teams-admin edge
  function with service-role key, which bypasses RLS

5. Important Notes
- This table is intentionally small (12 rows max) and read-heavy
- Frontend fetches visibility on load to filter the sidebar generation list
- Admins always see all generations; public only sees visible ones
*/

CREATE TABLE IF NOT EXISTS gen_visibility (
  gen integer PRIMARY KEY CHECK (gen >= 1 AND gen <= 12),
  visible boolean NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default values: gens 1-9 visible, gens 10-12 hidden
INSERT INTO gen_visibility (gen, visible) VALUES
  (1, true),
  (2, true),
  (3, true),
  (4, true),
  (5, true),
  (6, true),
  (7, true),
  (8, true),
  (9, true),
  (10, false),
  (11, false),
  (12, false)
ON CONFLICT (gen) DO NOTHING;

ALTER TABLE gen_visibility ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can see visibility settings
DROP POLICY IF EXISTS "public_read_gen_visibility" ON gen_visibility;
CREATE POLICY "public_read_gen_visibility"
ON gen_visibility FOR SELECT
TO anon, authenticated
USING (true);