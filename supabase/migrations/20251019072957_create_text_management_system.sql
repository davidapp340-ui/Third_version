/*
  # Text Management System for Dynamic Content

  ## Overview
  This migration creates a comprehensive text management system that allows:
  - Dynamic text updates without app redeployment
  - Multi-language support (ready for localization)
  - Organized text structure by screen and context
  - Version control and change tracking
  - Public read access for all users

  ## Tables Created

  ### 1. `languages`
  Stores supported languages in the app
  - `id` (uuid, primary key) - Unique language identifier
  - `code` (text, unique) - Language code (e.g., 'en', 'he', 'es')
  - `name` (text) - Display name (e.g., 'English', 'עברית')
  - `is_default` (boolean) - Whether this is the default language
  - `is_active` (boolean) - Whether this language is currently active
  - `created_at` (timestamptz) - When language was added

  ### 2. `text_keys`
  Defines all text keys used in the app with their context
  - `id` (uuid, primary key) - Unique text key identifier
  - `key` (text, unique) - Dot notation key (e.g., 'splash.app_name')
  - `screen` (text) - Screen name (e.g., 'splash', 'home', 'settings')
  - `context` (text) - Additional context (e.g., 'title', 'button', 'message')
  - `description` (text) - What this text is used for
  - `created_at` (timestamptz) - When key was added
  - `updated_at` (timestamptz) - Last update time

  ### 3. `texts`
  Stores actual text content for each key in each language
  - `id` (uuid, primary key) - Unique text entry identifier
  - `text_key_id` (uuid, foreign key) - References text_keys table
  - `language_id` (uuid, foreign key) - References languages table
  - `value` (text) - The actual text content
  - `updated_at` (timestamptz) - When text was last modified
  - Unique constraint on (text_key_id, language_id)

  ## Security
  - RLS enabled on all tables
  - Public read access for all users (texts need to be readable by everyone)
  - Only authenticated users with special permissions can modify texts
  - This allows instant updates without app redeployment while maintaining security

  ## Usage Pattern
  The app will query texts like this:
  ```sql
  SELECT tk.key, t.value
  FROM text_keys tk
  JOIN texts t ON t.text_key_id = tk.id
  JOIN languages l ON l.id = t.language_id
  WHERE l.code = 'en' AND l.is_active = true;
  ```

  ## Future Enhancements Ready
  - Add new languages by inserting into `languages` table
  - Add text versions/history tracking if needed
  - Add admin interface for text management
  - Add text placeholder support for dynamic values
*/

-- Create languages table
CREATE TABLE IF NOT EXISTS languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create text_keys table
CREATE TABLE IF NOT EXISTS text_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  screen text NOT NULL,
  context text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create texts table
CREATE TABLE IF NOT EXISTS texts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text_key_id uuid NOT NULL REFERENCES text_keys(id) ON DELETE CASCADE,
  language_id uuid NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(text_key_id, language_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_text_keys_screen ON text_keys(screen);
CREATE INDEX IF NOT EXISTS idx_text_keys_key ON text_keys(key);
CREATE INDEX IF NOT EXISTS idx_texts_text_key_id ON texts(text_key_id);
CREATE INDEX IF NOT EXISTS idx_texts_language_id ON texts(language_id);
CREATE INDEX IF NOT EXISTS idx_languages_code ON languages(code);
CREATE INDEX IF NOT EXISTS idx_languages_is_active ON languages(is_active);

-- Enable Row Level Security
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE texts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow everyone to read (texts must be public for all users)
CREATE POLICY "Anyone can read languages"
  ON languages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read text keys"
  ON text_keys FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read texts"
  ON texts FOR SELECT
  TO public
  USING (true);

-- Insert default language (Hebrew as default based on your design)
INSERT INTO languages (code, name, is_default, is_active)
VALUES ('he', 'עברית', true, true)
ON CONFLICT (code) DO NOTHING;

-- Insert initial text keys for splash screen
INSERT INTO text_keys (key, screen, context, description)
VALUES 
  ('splash.app_name', 'splash', 'title', 'Application name displayed on splash screen'),
  ('home.title', 'home', 'title', 'Home screen main title'),
  ('home.description', 'home', 'description', 'Home screen description text'),
  ('gallery.title', 'gallery', 'title', 'Gallery screen main title'),
  ('gallery.description', 'gallery', 'description', 'Gallery screen description text'),
  ('info.title', 'info', 'title', 'Info screen main title'),
  ('info.description', 'info', 'description', 'Info screen description text'),
  ('settings.title', 'settings', 'title', 'Settings screen main title'),
  ('settings.description', 'settings', 'description', 'Settings screen description text'),
  ('navigation.home', 'navigation', 'tab', 'Home tab label'),
  ('navigation.gallery', 'navigation', 'tab', 'Gallery tab label'),
  ('navigation.info', 'navigation', 'tab', 'Info tab label'),
  ('navigation.settings', 'navigation', 'tab', 'Settings tab label')
ON CONFLICT (key) DO NOTHING;

-- Insert initial Hebrew texts
INSERT INTO texts (text_key_id, language_id, value)
SELECT 
  tk.id,
  l.id,
  CASE tk.key
    WHEN 'splash.app_name' THEN 'zoomi'
    WHEN 'home.title' THEN 'מסלולי אימון'
    WHEN 'home.description' THEN 'בחר מסלול אימון להתחיל'
    WHEN 'gallery.title' THEN 'גלריית תרגילים'
    WHEN 'gallery.description' THEN 'כל התרגילים שלך במקום אחד'
    WHEN 'info.title' THEN 'מידע ולמידה'
    WHEN 'info.description' THEN 'דפי מידע חינוכיים'
    WHEN 'settings.title' THEN 'הגדרות'
    WHEN 'settings.description' THEN 'נהל את ההעדפות שלך'
    WHEN 'navigation.home' THEN 'בית'
    WHEN 'navigation.gallery' THEN 'גלריה'
    WHEN 'navigation.info' THEN 'מידע'
    WHEN 'navigation.settings' THEN 'הגדרות'
  END
FROM text_keys tk
CROSS JOIN languages l
WHERE l.code = 'he'
ON CONFLICT (text_key_id, language_id) DO NOTHING;
