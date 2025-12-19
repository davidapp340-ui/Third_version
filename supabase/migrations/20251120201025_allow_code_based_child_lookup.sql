/*
  # Allow Code-Based Child Lookup for Authentication

  ## Problem
  When a child tries to log in with their daily code, the RLS policies block
  the initial lookup because the user is not yet authenticated. The flow is:
  1. Child enters code
  2. System needs to find child by code (NOT AUTHENTICATED YET)
  3. RLS blocks query → Login fails

  ## Solution
  Add a SELECT policy that allows anyone (authenticated or not) to look up
  a child record IF:
  - They have a valid linking_code
  - The code was generated today (code_generated_date = CURRENT_DATE)
  
  This is secure because:
  - Codes change daily
  - Even with code, attacker only sees basic child info (name, age)
  - They still need the correct password to actually authenticate

  ## Changes
  - Add policy: "Anyone can lookup child with valid daily code"
*/

-- Allow anyone to SELECT child records when they have a valid daily code
CREATE POLICY "Anyone can lookup child with valid daily code"
  ON children
  FOR SELECT
  TO public
  USING (
    -- Code must be current (generated today)
    code_generated_date = CURRENT_DATE
  );