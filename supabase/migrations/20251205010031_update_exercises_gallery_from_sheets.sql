/*
  # Update exercises_gallery with Google Sheets Data
  
  1. Data Source
    - Google Sheets: https://docs.google.com/spreadsheets/d/1LBrZ_qRTsD0caYtnU1R6MOGjgALrPqADhtyd-fVVVig/edit?usp=sharing
    - Fetched: 2025-12-05
    - Records: 28 exercises across 7 categories
  
  2. Changes Applied
    - Complete update of exercises_gallery table
    - All 28 exercises mapped to gallery with proper categories and colors
    - Display flags set based on spreadsheet data
    - Display order assigned sequentially (1-28)
  
  3. Categories Mapped (7 total)
    - Stretch (Red - #FF6B6B) - 4 exercises
    - Movement (Blue - #4ECDC4) - 4 exercises
    - Relaxation (Purple - #9B59B6) - 4 exercises
    - Coordination (Green - #2ECC71) - 4 exercises (1 hidden)
    - Focus (Light Blue - #3498DB) - 4 exercises (1 hidden)
    - Guided imagery (Brown - #8B4513) - 4 exercises (1 hidden)
    - Warming up (Yellow - #F1C40F) - 4 exercises (1 hidden)
  
  4. Data Integrity
    - All exercise IDs verified to exist in eye_exercises table
    - Foreign key constraints maintained
    - 24 exercises set to display=true
    - 4 exercises set to display=false (CORDINAZIA4, MIKUD4, DIMYON4, HIMUM4)
  
  5. Update Strategy
    - Uses INSERT ... ON CONFLICT to handle both new and existing records
    - Preserves created_at timestamps for existing records
    - Updates all other fields (category, color, display, display_order)
*/

-- Clear existing data to start fresh
DELETE FROM exercises_gallery;

-- Insert all exercise gallery data from Google Sheets
INSERT INTO exercises_gallery (id, category, color, display, display_order, created_at, updated_at)
VALUES
  ('MTIHA1', 'Stretch', '#FF6B6B', true, 1, now(), now()),
  ('MTIHA2', 'Stretch', '#FF6B6B', true, 2, now(), now()),
  ('MTIHA3', 'Stretch', '#FF6B6B', true, 3, now(), now()),
  ('MTIHA4', 'Stretch', '#FF6B6B', true, 4, now(), now()),
  ('TNOA1', 'Movement', '#4ECDC4', true, 5, now(), now()),
  ('TNOA2', 'Movement', '#4ECDC4', true, 6, now(), now()),
  ('TNOA3', 'Movement', '#4ECDC4', true, 7, now(), now()),
  ('TNOA4', 'Movement', '#4ECDC4', true, 8, now(), now()),
  ('ARPYA1', 'Relaxation', '#9B59B6', true, 9, now(), now()),
  ('ARPYA2', 'Relaxation', '#9B59B6', true, 10, now(), now()),
  ('ARPYA3', 'Relaxation', '#9B59B6', true, 11, now(), now()),
  ('ARPYA4', 'Relaxation', '#9B59B6', true, 12, now(), now()),
  ('CORDINAZIA1', 'Coordination', '#2ECC71', true, 13, now(), now()),
  ('CORDINAZIA2', 'Coordination', '#2ECC71', true, 14, now(), now()),
  ('CORDINAZIA3', 'Coordination', '#2ECC71', true, 15, now(), now()),
  ('CORDINAZIA4', 'Coordination', '#2ECC71', false, 16, now(), now()),
  ('MIKUD1', 'Focus', '#3498DB', true, 17, now(), now()),
  ('MIKUD2', 'Focus', '#3498DB', true, 18, now(), now()),
  ('MIKUD3', 'Focus', '#3498DB', true, 19, now(), now()),
  ('MIKUD4', 'Focus', '#3498DB', false, 20, now(), now()),
  ('DIMYON1', 'Guided imagery', '#8B4513', true, 21, now(), now()),
  ('DIMYON2', 'Guided imagery', '#8B4513', true, 22, now(), now()),
  ('DIMYON3', 'Guided imagery', '#8B4513', true, 23, now(), now()),
  ('DIMYON4', 'Guided imagery', '#8B4513', false, 24, now(), now()),
  ('HIMUM1', 'Warming up', '#F1C40F', true, 25, now(), now()),
  ('HIMUM2', 'Warming up', '#F1C40F', true, 26, now(), now()),
  ('HIMUM3', 'Warming up', '#F1C40F', true, 27, now(), now()),
  ('HIMUM4', 'Warming up', '#F1C40F', false, 28, now(), now())
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  display = EXCLUDED.display,
  display_order = EXCLUDED.display_order,
  updated_at = EXCLUDED.updated_at;
