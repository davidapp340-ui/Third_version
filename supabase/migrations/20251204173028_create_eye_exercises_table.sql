/*
  # Create Eye Exercises Table

  1. New Tables
    - `eye_exercises`
      - `id` (text, primary key) - Unique identifier with category prefixes (MTIHA for stretches, DIMYON for relaxation)
      - `exercise_name` (text) - Official English name of the exercise
      - `icon` (text) - Placeholder for icon links/identifiers (currently "FALSE", supports URLs)
      - `description` (text) - Complete instructions for performing the exercise
      - `media_type` (text) - Primary format ("Video" for active exercises, "Audio" for guided relaxation)
      - `video_link` (text) - Direct URL to explanatory video (future-proofed for URLs)
      - `audio_link` (text) - Direct URL to explanatory audio file (future-proofed for URLs)
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `eye_exercises` table
    - Add policy for authenticated users to read all exercises
    - Add policy for authenticated users to manage their own data (if needed for future features)

  3. Indexes
    - Primary key index on `id` for fast lookups
    - Index on `media_type` for filtering by exercise type
*/

-- Create eye_exercises table
CREATE TABLE IF NOT EXISTS eye_exercises (
  id text PRIMARY KEY,
  exercise_name text NOT NULL,
  icon text DEFAULT 'FALSE',
  description text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('Video', 'Audio', 'video', 'audio')),
  video_link text DEFAULT 'FALSE',
  audio_link text DEFAULT 'FALSE',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE eye_exercises ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read exercises
CREATE POLICY "Authenticated users can view all exercises"
  ON eye_exercises
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow public access to exercises (for unauthenticated users if needed)
CREATE POLICY "Public users can view all exercises"
  ON eye_exercises
  FOR SELECT
  TO anon
  USING (true);

-- Create index on media_type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_eye_exercises_media_type 
  ON eye_exercises(media_type);

-- Create index on id prefix for category-based queries
CREATE INDEX IF NOT EXISTS idx_eye_exercises_id_prefix 
  ON eye_exercises(substring(id, 1, 6));
