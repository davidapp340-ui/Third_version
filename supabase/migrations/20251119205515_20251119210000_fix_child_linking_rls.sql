/*
  # Fix Child Linking RLS Policy

  ## Problem
  When a child tries to link their account using a parent code:
  1. A new auth user is created successfully
  2. The code tries to UPDATE the children table to set user_id
  3. RLS blocks the update because user_id is NULL (doesn't match auth.uid())
  4. This creates a chicken-and-egg problem

  ## Solution
  Add a permissive RLS policy that allows:
  - Authenticated users to update a child record
  - ONLY if that child's user_id is NULL (not yet linked)
  - ONLY to set user_id to their own auth.uid()

  ## Security
  - The policy is secure because it only allows linking to yourself
  - It only works on unlinked children (user_id IS NULL)
  - Once linked, the restrictive policies take over
*/

-- Add policy to allow initial child linking
CREATE POLICY "Allow initial child linking"
  ON children
  FOR UPDATE
  TO authenticated
  USING (
    user_id IS NULL
    AND is_linked = false
  )
  WITH CHECK (
    user_id = auth.uid()
    AND is_linked = true
  );