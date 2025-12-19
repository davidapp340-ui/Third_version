/*
  # Add INSERT policy for child_points

  1. Security
    - Allow service to create child_points records automatically
    - Allow children to initialize their own points when first accessing
*/

-- Drop existing policy if it exists
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow automatic child points creation" ON child_points;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policy to allow insertion of child_points for authenticated users
CREATE POLICY "Allow automatic child points creation"
  ON child_points FOR INSERT
  TO authenticated
  WITH CHECK (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    ) OR
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON f.id = c.family_id
      WHERE f.parent_id = auth.uid()
    )
  );
