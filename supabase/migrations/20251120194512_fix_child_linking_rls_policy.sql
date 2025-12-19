/*
  # Fix Child Linking RLS Policy

  ## Problem
  When a child logs in for the first time, they cannot update their own record
  to set the user_id because the existing RLS policy requires user_id = auth.uid(),
  but user_id is NULL during first login.

  ## Solution
  Add a new UPDATE policy that allows children to link themselves by:
  - Being authenticated as a child user type
  - The child_id in their metadata matches the record being updated
  - They are setting the user_id to their own auth.uid()

  ## Changes
  - Add policy: "Children can link themselves on first login"
*/

-- Drop the restrictive child update policy
DROP POLICY IF EXISTS "Children can update own progress" ON children;

-- Create new policy that allows children to update when:
-- 1. They're already linked (user_id matches)
-- 2. OR they're linking for the first time (child_id in metadata matches)
CREATE POLICY "Children can update own profile and link themselves"
  ON children
  FOR UPDATE
  TO authenticated
  USING (
    -- Either already linked
    user_id = auth.uid()
    -- OR linking for first time (child_id in metadata matches record id)
    OR (
      (auth.jwt()->>'user_type' = 'child')
      AND (auth.jwt()->>'child_id' = id::text)
      AND user_id IS NULL
    )
  )
  WITH CHECK (
    -- Must set user_id to their own auth id
    user_id = auth.uid()
  );