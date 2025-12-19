/*
  # Family Management System - Parents and Children

  ## Overview
  This migration creates a secure family management system where parents can manage multiple children
  and children can link to parents using unique codes.

  ## New Tables

  ### `parents`
  Stores parent profile information linked to auth.users
  - `id` (uuid, primary key) - References auth.users.id
  - `first_name` (text) - Parent's first name
  - `email` (text) - Parent's email (from auth)
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `families`
  Represents a family unit managed by a parent
  - `id` (uuid, primary key) - Unique family identifier
  - `parent_id` (uuid) - References parents.id
  - `name` (text) - Family name (optional)
  - `created_at` (timestamptz) - Family creation timestamp

  ### `children`
  Stores child profile information
  - `id` (uuid, primary key) - Unique child identifier
  - `family_id` (uuid) - References families.id
  - `user_id` (uuid, nullable) - References auth.users.id (if child has account)
  - `name` (text) - Child's name
  - `age` (integer) - Child's age
  - `avatar_url` (text, nullable) - Profile picture URL
  - `linking_code` (text, unique) - 6-character code for linking child device
  - `is_linked` (boolean) - Whether child device is linked
  - `linked_at` (timestamptz, nullable) - When device was linked
  - `current_step` (integer) - Progress in exercise program (default 1)
  - `total_steps` (integer) - Total steps in program (default 20)
  - `consecutive_days` (integer) - Days of continuous practice (default 0)
  - `last_practice_date` (date, nullable) - Date of last practice
  - `created_at` (timestamptz) - Child added timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `research_messages`
  Dynamic motivational messages about research contribution
  - `id` (uuid, primary key) - Unique message identifier
  - `message_key` (text, unique) - Key for text management system
  - `display_order` (integer) - Order for rotation
  - `is_active` (boolean) - Whether message is currently shown
  - `created_at` (timestamptz) - Message creation timestamp

  ## Security

  ### Row Level Security (RLS)
  All tables have RLS enabled with the following policies:

  #### Parents Table
  - Parents can read and update their own profile
  - Parents can insert their own profile during registration

  #### Families Table
  - Parents can read and manage their own family
  - Parents can create their own family

  #### Children Table
  - Parents can read all children in their family
  - Parents can add, update, and delete children in their family
  - Children (when linked) can read their own profile
  - Children can update their own progress data

  #### Research Messages Table
  - All authenticated users can read active messages
  - Only system/admin can modify messages

  ## Important Notes
  1. Linking codes are unique 6-character uppercase alphanumeric codes
  2. Children can exist without a linked user_id (parent adds them first)
  3. When a child enters the code, they link their device to the child profile
  4. All timestamps use timezone-aware timestamps for accuracy
  5. RLS ensures parents can only access their own family data
*/

-- Create parents table
CREATE TABLE IF NOT EXISTS parents (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  name text DEFAULT 'My Family',
  created_at timestamptz DEFAULT now()
);

-- Create children table
CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  age integer NOT NULL CHECK (age > 0 AND age < 18),
  avatar_url text,
  linking_code text UNIQUE NOT NULL,
  is_linked boolean DEFAULT false,
  linked_at timestamptz,
  current_step integer DEFAULT 1 CHECK (current_step > 0),
  total_steps integer DEFAULT 20 CHECK (total_steps > 0),
  consecutive_days integer DEFAULT 0 CHECK (consecutive_days >= 0),
  last_practice_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create research messages table
CREATE TABLE IF NOT EXISTS research_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_key text UNIQUE NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_messages ENABLE ROW LEVEL SECURITY;

-- Parents table policies
CREATE POLICY "Parents can read own profile"
  ON parents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Parents can insert own profile"
  ON parents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Parents can update own profile"
  ON parents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Families table policies
CREATE POLICY "Parents can read own family"
  ON families
  FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can create own family"
  ON families
  FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update own family"
  ON families
  FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- Children table policies
CREATE POLICY "Parents can read children in their family"
  ON children
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = children.family_id
      AND families.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can add children to their family"
  ON children
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = children.family_id
      AND families.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update children in their family"
  ON children
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = children.family_id
      AND families.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = children.family_id
      AND families.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can delete children from their family"
  ON children
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = children.family_id
      AND families.parent_id = auth.uid()
    )
  );

CREATE POLICY "Children can read own profile"
  ON children
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Children can update own progress"
  ON children
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Research messages policies
CREATE POLICY "All authenticated users can read active research messages"
  ON research_messages
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_families_parent_id ON families(parent_id);
CREATE INDEX IF NOT EXISTS idx_children_family_id ON children(family_id);
CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id);
CREATE INDEX IF NOT EXISTS idx_children_linking_code ON children(linking_code);
CREATE INDEX IF NOT EXISTS idx_children_is_linked ON children(is_linked);

-- Function to generate unique linking code
CREATE OR REPLACE FUNCTION generate_linking_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_parents_updated_at
  BEFORE UPDATE ON parents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default research messages
INSERT INTO research_messages (message_key, display_order, is_active)
VALUES
  ('research.message_1', 1, true),
  ('research.message_2', 2, true),
  ('research.message_3', 3, true)
ON CONFLICT (message_key) DO NOTHING;
