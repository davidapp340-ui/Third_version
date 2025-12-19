/*
  # Support Independent Children

  1. Schema Changes
    - Make `family_id` nullable in `children` table to support independent children
    - Add `is_independent` boolean column to identify independent children

  2. Security Changes
    - Update RLS policies to allow independent children to:
      - Read their own record
      - Insert track progress
      - Read track progress
    
  3. Notes
    - Independent children are those who sign up directly without a parent
    - They won't have a family_id but will have a user_id
*/

-- Make family_id nullable to support independent children
ALTER TABLE children 
ALTER COLUMN family_id DROP NOT NULL;

-- Add is_independent column to identify independent children
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'is_independent'
  ) THEN
    ALTER TABLE children ADD COLUMN is_independent boolean DEFAULT false;
  END IF;
END $$;

-- Update RLS policy for children table to allow independent children to read their own record
DROP POLICY IF EXISTS "Independent children can read own record" ON children;
CREATE POLICY "Independent children can read own record"
  ON children
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND is_independent = true);

-- Update RLS policy for user_track_progress to include independent children
DROP POLICY IF EXISTS "Independent children can read own track progress" ON user_track_progress;
CREATE POLICY "Independent children can read own track progress"
  ON user_track_progress
  FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children 
      WHERE user_id = auth.uid() AND is_independent = true
    )
  );

DROP POLICY IF EXISTS "Independent children can insert own track progress" ON user_track_progress;
CREATE POLICY "Independent children can insert own track progress"
  ON user_track_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    child_id IN (
      SELECT id FROM children 
      WHERE user_id = auth.uid() AND is_independent = true
    )
  );

DROP POLICY IF EXISTS "Independent children can update own track progress" ON user_track_progress;
CREATE POLICY "Independent children can update own track progress"
  ON user_track_progress
  FOR UPDATE
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children 
      WHERE user_id = auth.uid() AND is_independent = true
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT id FROM children 
      WHERE user_id = auth.uid() AND is_independent = true
    )
  );
