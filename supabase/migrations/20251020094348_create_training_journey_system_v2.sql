/*
  # Training Journey System - Monthly Workout Tracks

  ## Overview
  This migration creates a comprehensive training journey system where users
  follow a 30-day workout track (similar to Duolingo's learning path).

  ## New Tables

  ### `training_tracks`
  Stores different monthly training programs
  - `id` (uuid, primary key) - Unique track identifier
  - `name` (text) - Track name (e.g., "Beginner Track - Level 1")
  - `name_he` (text) - Hebrew track name
  - `description` (text) - Track description
  - `description_he` (text) - Hebrew description
  - `difficulty_level` (integer) - 1-5 difficulty rating
  - `total_days` (integer) - Total days in track (default 30)
  - `is_active` (boolean) - Whether track is available
  - `display_order` (integer) - Order for displaying tracks
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `track_days`
  Individual days within each training track
  - `id` (uuid, primary key) - Unique day identifier
  - `track_id` (uuid) - References training_tracks.id
  - `day_number` (integer) - Day number (1-30)
  - `title` (text) - Day title (e.g., "Focus Building Day")
  - `title_he` (text) - Hebrew day title
  - `description` (text) - Day description
  - `description_he` (text) - Hebrew description
  - `is_locked` (boolean) - Whether day requires previous completion
  - `google_sheets_id` (text) - ID from Google Sheets for sync
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `track_day_exercise_assignments`
  Exercises assigned to each day (stores exercise IDs as text for now)
  - `id` (uuid, primary key) - Unique assignment identifier
  - `track_day_id` (uuid) - References track_days.id
  - `exercise_id_text` (text) - Exercise ID (will link to exercises table later)
  - `exercise_order` (integer) - Order within the day
  - `duration_override` (integer) - Optional duration override in seconds
  - `notes` (text) - Special instructions for this exercise on this day

  ### `user_track_progress`
  Tracks user progress through training tracks
  - `id` (uuid, primary key) - Unique progress identifier
  - `child_id` (uuid) - References children.id
  - `track_id` (uuid) - References training_tracks.id
  - `current_day` (integer) - Current day user is on (1-30)
  - `days_completed` (integer[]) - Array of completed day numbers
  - `started_at` (timestamptz) - When user started this track
  - `last_activity_at` (timestamptz) - Last activity timestamp
  - `completed_at` (timestamptz) - When track was fully completed

  ### `track_day_completions`
  Records when users complete specific days
  - `id` (uuid, primary key) - Unique completion identifier
  - `child_id` (uuid) - References children.id
  - `track_day_id` (uuid) - References track_days.id
  - `completed_at` (timestamptz) - Completion timestamp
  - `total_duration_seconds` (integer) - Total time spent on day
  - `exercises_completed` (integer) - Number of exercises completed

  ## Security
  All tables have RLS enabled with appropriate policies
*/

-- Create training_tracks table
CREATE TABLE IF NOT EXISTS training_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_he text NOT NULL,
  description text DEFAULT '',
  description_he text DEFAULT '',
  difficulty_level integer DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  total_days integer DEFAULT 30 CHECK (total_days > 0),
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  google_sheets_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create track_days table
CREATE TABLE IF NOT EXISTS track_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES training_tracks(id) ON DELETE CASCADE,
  day_number integer NOT NULL CHECK (day_number > 0),
  title text NOT NULL,
  title_he text NOT NULL,
  description text DEFAULT '',
  description_he text DEFAULT '',
  is_locked boolean DEFAULT true,
  google_sheets_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(track_id, day_number)
);

-- Create track_day_exercise_assignments table (temporary without FK to exercises)
CREATE TABLE IF NOT EXISTS track_day_exercise_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_day_id uuid NOT NULL REFERENCES track_days(id) ON DELETE CASCADE,
  exercise_id_text text NOT NULL,
  exercise_order integer DEFAULT 0,
  duration_override integer CHECK (duration_override >= 0),
  notes text DEFAULT ''
);

-- Create user_track_progress table
CREATE TABLE IF NOT EXISTS user_track_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES training_tracks(id) ON DELETE CASCADE,
  current_day integer DEFAULT 1 CHECK (current_day > 0),
  days_completed integer[] DEFAULT ARRAY[]::integer[],
  started_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(child_id, track_id)
);

-- Create track_day_completions table
CREATE TABLE IF NOT EXISTS track_day_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  track_day_id uuid NOT NULL REFERENCES track_days(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  total_duration_seconds integer DEFAULT 0 CHECK (total_duration_seconds >= 0),
  exercises_completed integer DEFAULT 0 CHECK (exercises_completed >= 0)
);

-- Enable RLS on all tables
ALTER TABLE training_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_day_exercise_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_track_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_day_completions ENABLE ROW LEVEL SECURITY;

-- Training tracks policies
CREATE POLICY "All authenticated users can read active training tracks"
  ON training_tracks FOR SELECT TO authenticated USING (is_active = true);

-- Track days policies
CREATE POLICY "All authenticated users can read track days"
  ON track_days FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_tracks
      WHERE training_tracks.id = track_days.track_id
      AND training_tracks.is_active = true
    )
  );

-- Track day exercise assignments policies
CREATE POLICY "All authenticated users can read track day exercises"
  ON track_day_exercise_assignments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM track_days td
      JOIN training_tracks tt ON tt.id = td.track_id
      WHERE td.id = track_day_exercise_assignments.track_day_id
      AND tt.is_active = true
    )
  );

-- User track progress policies
CREATE POLICY "Children can read own track progress"
  ON user_track_progress FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Children can insert own track progress"
  ON user_track_progress FOR INSERT TO authenticated
  WITH CHECK (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Children can update own track progress"
  ON user_track_progress FOR UPDATE TO authenticated
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

CREATE POLICY "Parents can read children track progress in their family"
  ON user_track_progress FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON f.id = c.family_id
      WHERE f.parent_id = auth.uid()
    )
  );

-- Track day completions policies
CREATE POLICY "Children can read own track day completions"
  ON track_day_completions FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Children can insert own track day completions"
  ON track_day_completions FOR INSERT TO authenticated
  WITH CHECK (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can read children track day completions in their family"
  ON track_day_completions FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON f.id = c.family_id
      WHERE f.parent_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_track_days_track_id ON track_days(track_id);
CREATE INDEX IF NOT EXISTS idx_track_days_day_number ON track_days(day_number);
CREATE INDEX IF NOT EXISTS idx_track_day_exercises_track_day_id ON track_day_exercise_assignments(track_day_id);
CREATE INDEX IF NOT EXISTS idx_user_track_progress_child_id ON user_track_progress(child_id);
CREATE INDEX IF NOT EXISTS idx_user_track_progress_track_id ON user_track_progress(track_id);
CREATE INDEX IF NOT EXISTS idx_track_day_completions_child_id ON track_day_completions(child_id);
CREATE INDEX IF NOT EXISTS idx_track_day_completions_track_day_id ON track_day_completions(track_day_id);

-- Triggers for updated_at
CREATE TRIGGER update_training_tracks_updated_at
  BEFORE UPDATE ON training_tracks FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_track_days_updated_at
  BEFORE UPDATE ON track_days FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check if user can access a track day
CREATE OR REPLACE FUNCTION can_access_track_day(
  p_child_id uuid,
  p_track_day_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_day_number integer;
  v_track_id uuid;
  v_days_completed integer[];
  v_is_locked boolean;
BEGIN
  -- Get day info
  SELECT td.day_number, td.track_id, td.is_locked
  INTO v_day_number, v_track_id, v_is_locked
  FROM track_days td
  WHERE td.id = p_track_day_id;

  -- Day 1 is always accessible if not locked
  IF v_day_number = 1 THEN
    RETURN NOT v_is_locked;
  END IF;

  -- Check if previous day is completed
  SELECT utp.days_completed
  INTO v_days_completed
  FROM user_track_progress utp
  WHERE utp.child_id = p_child_id
  AND utp.track_id = v_track_id;

  -- If no progress record, can't access
  IF v_days_completed IS NULL THEN
    RETURN false;
  END IF;

  -- Check if previous day is in completed array
  RETURN (v_day_number - 1) = ANY(v_days_completed);
END;
$$ LANGUAGE plpgsql;

-- Insert default training track (placeholder until Google Sheets sync)
INSERT INTO training_tracks (name, name_he, description, description_he, difficulty_level, total_days)
VALUES
  ('Beginner Track', 'מסלול מתחילים', 'Perfect for starting your vision training journey', 'מושלם להתחלת מסע אימוני הראייה שלך', 1, 30)
ON CONFLICT DO NOTHING;
