ALTER TABLE teams ADD COLUMN IF NOT EXISTS folder text;

-- Backfill folder text from existing folders table for teams already grouped
UPDATE teams t
SET folder = f.name
FROM folders f
WHERE t.folder_id = f.id
  AND t.folder IS NULL;
