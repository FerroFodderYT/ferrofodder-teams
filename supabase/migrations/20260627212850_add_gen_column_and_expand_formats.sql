/*
# Add gen column and expand format tiers

1. Summary
This migration restructures the teams table to support a three-level navigation
hierarchy: Generation -> Format tier -> Archetype. Previously the table only
tracked `format` ('ou' or 'ndou') and `archetype`. We now introduce a `gen`
column (9, 8, 7, ...) and broaden the `format` CHECK constraint to accept the
standard Smogon tier slugs across generations (ou, uuru, nu, pu, zu, ndou, etc.).

2. New Columns
- `teams.gen` (integer, not null, default 9)
  - The generation the team belongs to (9 = Scarlet/Violet, 8 = Sword/Shield,
    7 = Sun/Moon, 6 = XY, 5 = BW, 4 = DPPt, 3 = Adv, 2 = GSC, 1 = RBY).
  - Defaults to 9 so existing rows (if any) land in Gen 9.

3. Modified Tables
- `teams`
  - Add column `gen integer NOT NULL DEFAULT 9`.
  - Replace the `format` CHECK constraint: drop the old `teams_format_check`
    that limited format to ('ou','ndou') and add a new one allowing the full
    tier slug set: ou, uuru, nu, pu, zu, lc, ndou, doubles, vgc, bss, random.
    (ndou is retained for backward compatibility with existing National Dex OU
    teams; new National Dex teams should use 'ndou' under the appropriate gen.)
  - Add a composite index on (gen, format, archetype) to support the new
    three-level filtering used by the sidebar.

4. Security
- No RLS policy changes. The existing `public_select_teams` policy (anon +
  authenticated, USING true) remains the only policy. All mutations continue
  to go through the `teams-admin` edge function with the service-role key,
  which bypasses RLS, so no insert/update/delete policies are needed.

5. Important Notes
- The `format` CHECK is intentionally permissive: it lists the canonical
  Smogon tier slugs but does not enforce which tiers exist per generation —
  that mapping is enforced in the frontend (types.ts). The database only
  guarantees the slug is one of the known tier identifiers.
- Existing rows, if any, keep their current `format` value because the new
  CHECK list is a superset of the old one ('ou' and 'ndou' are both included).
- No data is dropped or renamed; this is purely additive.
*/

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS gen integer NOT NULL DEFAULT 9;

-- Replace the format CHECK constraint with the expanded tier list.
-- The original constraint was named teams_format_check (Postgres default).
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_format_check;
ALTER TABLE teams ADD CONSTRAINT teams_format_check
  CHECK (format IN (
    'ou', 'uu', 'ru', 'nu', 'pu', 'zu',
    'lc', 'ndou', 'doubles', 'vgc', 'bss', 'random'
  ));

-- Composite index for the three-level sidebar filter (gen, format, archetype).
CREATE INDEX IF NOT EXISTS idx_teams_gen_format_archetype
  ON teams (gen, format, archetype);