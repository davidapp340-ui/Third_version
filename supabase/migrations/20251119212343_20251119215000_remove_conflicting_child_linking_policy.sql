/*
  # Remove Conflicting Child Linking Policy

  ## Problem
  The "Allow initial child linking" policy's WITH CHECK clause conflicts
  with the parent's ability to update child records during creation.
  
  When a parent creates a child:
  - Parent is authenticated (auth.uid() = parent's ID)
  - Parent calls signUp to create child auth account
  - Parent tries to UPDATE children table to set user_id = child's auth ID
  - Policy WITH CHECK fails because: user_id (child) != auth.uid() (parent)

  ## Solution
  Remove the conflicting policy and rely on "Parents can update children in their family"
  which correctly allows parents to update any field of children in their family.

  ## Security
  - Parent policy still protects updates (parent can only update their own children)
  - Child policy still protects updates (child can only update their own record)
  - No security regression
*/

DROP POLICY IF EXISTS "Allow initial child linking" ON children;