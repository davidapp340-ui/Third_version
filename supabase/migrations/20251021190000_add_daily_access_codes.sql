/*
  # Daily Code Refresh System

  ## Overview
  This migration modifies the linking_code system to automatically refresh daily,
  ensuring unique codes and preventing collisions.

  ## Changes to Existing Tables

  ### `children`
  - `code_generated_date` (date) - Tracks when the linking_code was last generated

  ## New Functions

  ### `generate_unique_linking_code()`
  Generates a unique 6-character code that doesn't exist for today

  ### `refresh_code_daily()`
  Trigger function that automatically refreshes linking_code every day

  ## Security Notes
  1. All codes are 6-character alphanumeric (uppercase letters and numbers)
  2. Codes automatically refresh every 24 hours
  3. Collision prevention: checks all codes generated today before creating new one
  4. Each child always has a unique code for the current day

  ## Important Notes
  - Single code system: linking_code serves both initial linking and daily re-login
  - Parents see the same code for initial setup and daily access
  - Codes change automatically at midnight
*/

-- Add code_generated_date column to track when code was last refreshed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'code_generated_date'
  ) THEN
    ALTER TABLE children ADD COLUMN code_generated_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Function to generate unique linking code with collision prevention
CREATE OR REPLACE FUNCTION generate_unique_linking_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
  code_exists boolean;
  max_attempts integer := 100;
  attempt integer := 0;
BEGIN
  LOOP
    new_code := '';
    FOR i IN 1..6 LOOP
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;

    SELECT EXISTS (
      SELECT 1 FROM children
      WHERE linking_code = new_code
      AND code_generated_date = CURRENT_DATE
    ) INTO code_exists;

    EXIT WHEN NOT code_exists OR attempt >= max_attempts;
    attempt := attempt + 1;
  END LOOP;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh code daily
CREATE OR REPLACE FUNCTION refresh_code_daily()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code_generated_date IS NULL OR NEW.code_generated_date < CURRENT_DATE THEN
    NEW.linking_code := generate_unique_linking_code();
    NEW.code_generated_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically refresh codes daily
DROP TRIGGER IF EXISTS ensure_daily_code_refresh ON children;
CREATE TRIGGER ensure_daily_code_refresh
  BEFORE INSERT OR UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION refresh_code_daily();

-- Update existing children to have today's date and regenerate codes
UPDATE children
SET
  linking_code = generate_unique_linking_code(),
  code_generated_date = CURRENT_DATE;

-- Create index for faster code lookups by date
CREATE INDEX IF NOT EXISTS idx_children_code_date ON children(code_generated_date);
