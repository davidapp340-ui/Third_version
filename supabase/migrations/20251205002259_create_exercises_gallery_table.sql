/*
  # Create Exercises Gallery Table

  1. New Tables
    - `exercises_gallery`
      - `id` (text, primary key, foreign key) - Links to eye_exercises.id
      - `category` (text, not null) - Exercise category name (e.g., "Stretching", "Focus", "Relaxation")
      - `color` (text, not null) - Hex color code for button appearance (format: #RRGGBB)
      - `display` (boolean, not null, default true) - Controls visibility in gallery
      - `display_order` (integer) - Optional ordering for gallery display
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `exercises_gallery` table
    - Add policy for authenticated users to read all gallery exercises
    - Add policy for public users to read visible gallery exercises (where display = true)

  3. Indexes
    - Primary key index on `id`
    - Index on `category` for category-based filtering
    - Index on `display` for visibility filtering
    - Composite index on `category` and `display_order` for efficient ordered queries

  4. Constraints
    - Foreign key constraint to eye_exercises table
    - Check constraint for valid hex color format
    - Check constraint for valid display_order (positive integers)
*/

-- Create exercises_gallery table
CREATE TABLE IF NOT EXISTS exercises_gallery (
  id text PRIMARY KEY,
  category text NOT NULL,
  color text NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  display boolean NOT NULL DEFAULT true,
  display_order integer CHECK (display_order > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Foreign key constraint to eye_exercises
  CONSTRAINT fk_exercise_id 
    FOREIGN KEY (id) 
    REFERENCES eye_exercises(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);

-- Enable RLS
ALTER TABLE exercises_gallery ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view all gallery exercises
CREATE POLICY "Authenticated users can view all gallery exercises"
  ON exercises_gallery
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow public users to view only displayed exercises
CREATE POLICY "Public users can view displayed exercises"
  ON exercises_gallery
  FOR SELECT
  TO anon
  USING (display = true);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_exercises_gallery_category 
  ON exercises_gallery(category);

CREATE INDEX IF NOT EXISTS idx_exercises_gallery_display 
  ON exercises_gallery(display);

CREATE INDEX IF NOT EXISTS idx_exercises_gallery_category_order 
  ON exercises_gallery(category, display_order) 
  WHERE display = true;

-- Insert sample data to demonstrate the table structure
INSERT INTO exercises_gallery (id, category, color, display, display_order) VALUES
('MTIHA1', 'Stretching', '#FF6B6B', true, 1),
('MTIHA2', 'Stretching', '#FF6B6B', true, 2),
('TNOA1', 'Focus & Blinking', '#4ECDC4', true, 1),
('DIMYON1', 'Relaxation', '#95E1D3', true, 1),
('HIMUM1', 'Massage & Cool-down', '#F38181', true, 1)
ON CONFLICT (id) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_exercises_gallery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exercises_gallery_updated_at
  BEFORE UPDATE ON exercises_gallery
  FOR EACH ROW
  EXECUTE FUNCTION update_exercises_gallery_updated_at();
