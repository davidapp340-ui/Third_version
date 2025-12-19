/*
  # Remove All Google Sheets Imported Tables and Columns

  ## Deletion Summary
  This migration removes all tables and columns that were created from Google Sheets imports.
  
  ## Tables Being DROPPED
  1. `gallery_categories` - Gallery exercise categories (28 rows)
  2. `exercise_completions` - Exercise completion tracking (0 rows)
  3. `exercises` - Exercise library (60 rows)
  4. `exercise_categories` - Exercise categories (6 rows)
  5. `sync_logs` - Sync operation logs (6 rows)

  ## Columns Being DROPPED
  - `exercises.google_sheets_id` (if table still exists)
  - `training_tracks.google_sheets_id`
  - `track_days.google_sheets_id`

  ## Impact
  - Exercise Gallery will be completely empty
  - All exercise-related data will be permanently deleted
  - Training tracks remain but lose Google Sheets sync capability
  
  ## Note
  This is a destructive operation and cannot be undone.
*/

-- Drop tables in dependency order (children first, then parents)

-- 1. Drop exercise_completions (depends on exercises and children)
DROP TABLE IF EXISTS exercise_completions CASCADE;

-- 2. Drop gallery_categories (standalone table)
DROP TABLE IF EXISTS gallery_categories CASCADE;

-- 3. Drop sync_logs (standalone table)
DROP TABLE IF EXISTS sync_logs CASCADE;

-- 4. Drop exercises (depends on exercise_categories)
DROP TABLE IF EXISTS exercises CASCADE;

-- 5. Drop exercise_categories (parent table)
DROP TABLE IF EXISTS exercise_categories CASCADE;

-- Remove google_sheets_id columns from remaining tables

-- Remove from training_tracks
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_tracks' AND column_name = 'google_sheets_id'
  ) THEN
    ALTER TABLE training_tracks DROP COLUMN google_sheets_id;
  END IF;
END $$;

-- Remove from track_days
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'track_days' AND column_name = 'google_sheets_id'
  ) THEN
    ALTER TABLE track_days DROP COLUMN google_sheets_id;
  END IF;
END $$;
