/*
  # Child Health Metrics System

  ## Overview
  This migration creates tables to track children's subjective health metrics
  related to their vision training progress.

  ## New Tables

  ### `child_visual_acuity_logs`
  Tracks the child's self-reported visual acuity over time
  - `id` (uuid, primary key) - Unique log identifier
  - `child_id` (uuid) - References children.id
  - `rating` (integer) - Rating from 1-5 (1=worse, 3=same, 5=much better)
  - `notes` (text) - Optional notes from the child
  - `logged_at` (timestamptz) - When the rating was logged

  ### `child_eye_fatigue_logs`
  Tracks the child's daily eye fatigue levels
  - `id` (uuid, primary key) - Unique log identifier
  - `child_id` (uuid) - References children.id
  - `fatigue_level` (integer) - Fatigue level from 1-5 (1=not tired, 5=very tired)
  - `logged_at` (timestamptz) - When the fatigue was logged

  ### `child_goals`
  Stores goals set by parents for their children
  - `id` (uuid, primary key) - Unique goal identifier
  - `child_id` (uuid) - References children.id
  - `goal_type` (text) - Type: 'daily' or 'weekly'
  - `target_exercises` (integer) - Number of exercises to complete
  - `target_minutes` (integer) - Minutes to practice
  - `set_by_parent_id` (uuid) - Parent who set the goal
  - `is_active` (boolean) - Whether goal is currently active
  - `created_at` (timestamptz) - When goal was created
  - `updated_at` (timestamptz) - Last update timestamp

  ### `parent_encouragements`
  Stores encouragement messages sent by parents to children
  - `id` (uuid, primary key) - Unique message identifier
  - `child_id` (uuid) - References children.id
  - `parent_id` (uuid) - Parent who sent the message
  - `message` (text) - Encouragement message
  - `sent_at` (timestamptz) - When message was sent
  - `read_at` (timestamptz) - When child read the message

  ## Security
  All tables have RLS enabled with appropriate policies for parents and children
*/

-- Create child_visual_acuity_logs table
CREATE TABLE IF NOT EXISTS child_visual_acuity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  notes text DEFAULT '',
  logged_at timestamptz DEFAULT now()
);

-- Create child_eye_fatigue_logs table
CREATE TABLE IF NOT EXISTS child_eye_fatigue_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  fatigue_level integer NOT NULL CHECK (fatigue_level >= 1 AND fatigue_level <= 5),
  logged_at timestamptz DEFAULT now()
);

-- Create child_goals table
CREATE TABLE IF NOT EXISTS child_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  goal_type text NOT NULL CHECK (goal_type IN ('daily', 'weekly')),
  target_exercises integer DEFAULT 0 CHECK (target_exercises >= 0),
  target_minutes integer DEFAULT 0 CHECK (target_minutes >= 0),
  set_by_parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create parent_encouragements table
CREATE TABLE IF NOT EXISTS parent_encouragements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Enable RLS on all tables
ALTER TABLE child_visual_acuity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_eye_fatigue_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_encouragements ENABLE ROW LEVEL SECURITY;

-- Visual acuity logs policies
CREATE POLICY "Children can read own visual acuity logs"
  ON child_visual_acuity_logs FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Children can insert own visual acuity logs"
  ON child_visual_acuity_logs FOR INSERT TO authenticated
  WITH CHECK (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can read children visual acuity logs in their family"
  ON child_visual_acuity_logs FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON f.id = c.family_id
      WHERE f.parent_id = auth.uid()
    )
  );

-- Eye fatigue logs policies
CREATE POLICY "Children can read own eye fatigue logs"
  ON child_eye_fatigue_logs FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Children can insert own eye fatigue logs"
  ON child_eye_fatigue_logs FOR INSERT TO authenticated
  WITH CHECK (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can read children eye fatigue logs in their family"
  ON child_eye_fatigue_logs FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON f.id = c.family_id
      WHERE f.parent_id = auth.uid()
    )
  );

-- Child goals policies
CREATE POLICY "Children can read own goals"
  ON child_goals FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can read goals for children in their family"
  ON child_goals FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON f.id = c.family_id
      WHERE f.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can insert goals for children in their family"
  ON child_goals FOR INSERT TO authenticated
  WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON f.id = c.family_id
      WHERE f.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update goals for children in their family"
  ON child_goals FOR UPDATE TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON f.id = c.family_id
      WHERE f.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON f.id = c.family_id
      WHERE f.parent_id = auth.uid()
    )
  );

-- Parent encouragements policies
CREATE POLICY "Children can read encouragements sent to them"
  ON parent_encouragements FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Children can update read status of their encouragements"
  ON parent_encouragements FOR UPDATE TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can read encouragements they sent"
  ON parent_encouragements FOR SELECT TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can insert encouragements for children in their family"
  ON parent_encouragements FOR INSERT TO authenticated
  WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON f.id = c.family_id
      WHERE f.parent_id = auth.uid()
    )
    AND parent_id = auth.uid()
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visual_acuity_child_id ON child_visual_acuity_logs(child_id);
CREATE INDEX IF NOT EXISTS idx_visual_acuity_logged_at ON child_visual_acuity_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_eye_fatigue_child_id ON child_eye_fatigue_logs(child_id);
CREATE INDEX IF NOT EXISTS idx_eye_fatigue_logged_at ON child_eye_fatigue_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_child_goals_child_id ON child_goals(child_id);
CREATE INDEX IF NOT EXISTS idx_child_goals_active ON child_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_encouragements_child_id ON parent_encouragements(child_id);
CREATE INDEX IF NOT EXISTS idx_encouragements_parent_id ON parent_encouragements(parent_id);

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for child_goals updated_at
CREATE TRIGGER update_child_goals_updated_at
  BEFORE UPDATE ON child_goals FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
