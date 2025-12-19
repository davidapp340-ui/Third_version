/*
  # Allow Independent Children Self-Insert

  1. Security Changes
    - Add RLS policy to allow authenticated users to insert themselves as independent children
    - The user can only insert a record where user_id matches their own auth.uid()
    - The record must be marked as is_independent = true
*/

DROP POLICY IF EXISTS "Users can create own independent child record" ON children;
CREATE POLICY "Users can create own independent child record"
  ON children
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND is_independent = true
  );
