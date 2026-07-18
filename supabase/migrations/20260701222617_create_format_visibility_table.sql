/*
# Create format_visibility table for admin-controlled format display

1. Summary
Creates a `format_visibility` table that stores which format tabs (OU, UU, etc.)
are visible within each generation. Admins can toggle visibility for any format
within any generation, allowing fine-grained control over what the public sees.

2. New Tables
- `format_visibility`
  - `gen` (integer, 1-12) — the generation number
  - `format` (text) — the format slug (ou, uu, ru, nu, pu, zu, lc, ndou, doubles, vgc, bss, random)
  - `visible` (boolean, not null, default true)
  - `updated_at` (timestamptz, default now())
  - Primary key: composite (gen, format)

3. Initial Data
- Inserts default rows for all gen/format combinations from the types.ts GENS array
- All default to visible=true

4. Security
- Enable RLS on `format_visibility`
- Public read: anon + authenticated can SELECT all rows
- No direct write policies — all mutations go through the teams-admin edge function

5. Important Notes
- This table works alongside gen_visibility — a format is only shown if:
  1. Its generation is visible, AND
  2. The format is visible within that generation
- Allows hiding specific formats (e.g., "Random" in Gen 9) without hiding the whole generation
*/

CREATE TABLE IF NOT EXISTS format_visibility (
  gen integer NOT NULL CHECK (gen >= 1 AND gen <= 12),
  format text NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (gen, format)
);

-- Insert default values for all existing gen/format combinations (all visible)
INSERT INTO format_visibility (gen, format, visible) VALUES
  -- Gen 9
  (9, 'ou', true), (9, 'uu', true), (9, 'ru', true), (9, 'nu', true), (9, 'pu', true),
  (9, 'zu', true), (9, 'ndou', true), (9, 'doubles', true), (9, 'vgc', true), (9, 'random', true),
  -- Gen 8
  (8, 'ou', true), (8, 'uu', true), (8, 'ru', true), (8, 'nu', true), (8, 'pu', true),
  (8, 'zu', true), (8, 'ndou', true), (8, 'doubles', true), (8, 'bss', true), (8, 'vgc', true),
  -- Gen 7
  (7, 'ou', true), (7, 'uu', true), (7, 'ru', true), (7, 'nu', true), (7, 'pu', true),
  (7, 'lc', true), (7, 'doubles', true), (7, 'bss', true), (7, 'vgc', true), (7, 'random', true),
  -- Gen 6
  (6, 'ou', true), (6, 'uu', true), (6, 'ru', true), (6, 'nu', true), (6, 'pu', true),
  (6, 'lc', true), (6, 'doubles', true), (6, 'bss', true),
  -- Gen 5
  (5, 'ou', true), (5, 'uu', true), (5, 'ru', true), (5, 'nu', true), (5, 'pu', true),
  (5, 'lc', true), (5, 'doubles', true),
  -- Gen 4
  (4, 'ou', true), (4, 'uu', true), (4, 'ru', true), (4, 'nu', true),
  (4, 'lc', true), (4, 'doubles', true),
  -- Gen 3
  (3, 'ou', true), (3, 'uu', true), (3, 'ru', true), (3, 'nu', true), (3, 'doubles', true),
  -- Gen 2
  (2, 'ou', true), (2, 'uu', true), (2, 'nu', true), (2, 'doubles', true),
  -- Gen 1
  (1, 'ou', true), (1, 'uu', true), (1, 'nu', true), (1, 'random', true),
  -- Gen 10 (future)
  (10, 'ou', true), (10, 'uu', true), (10, 'ru', true), (10, 'nu', true), (10, 'pu', true),
  (10, 'zu', true), (10, 'ndou', true), (10, 'doubles', true), (10, 'vgc', true), (10, 'random', true),
  -- Gen 11 (future)
  (11, 'ou', true), (11, 'uu', true), (11, 'ru', true), (11, 'nu', true), (11, 'pu', true),
  (11, 'zu', true), (11, 'ndou', true), (11, 'doubles', true), (11, 'vgc', true), (11, 'random', true),
  -- Gen 12 (future)
  (12, 'ou', true), (12, 'uu', true), (12, 'ru', true), (12, 'nu', true), (12, 'pu', true),
  (12, 'zu', true), (12, 'ndou', true), (12, 'doubles', true), (12, 'vgc', true), (12, 'random', true)
ON CONFLICT (gen, format) DO NOTHING;

ALTER TABLE format_visibility ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can see format visibility settings
DROP POLICY IF EXISTS "public_read_format_visibility" ON format_visibility;
CREATE POLICY "public_read_format_visibility"
ON format_visibility FOR SELECT
TO anon, authenticated
USING (true);