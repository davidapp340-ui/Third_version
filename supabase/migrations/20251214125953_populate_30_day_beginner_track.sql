/*
  # Populate 30-Day Beginner Track

  ## Overview
  This migration populates the track_days table with a complete 30-day
  vision training program for the Beginner Track.

  ## Structure
  - Days 1-10: Foundation Phase (basic eye exercises, focus training)
  - Days 11-20: Development Phase (intermediate exercises, coordination)
  - Days 21-30: Advancement Phase (advanced exercises, integration)

  ## Day Structure
  Each day includes:
  - `day_number`: Sequential number (1-30)
  - `title_he`: Hebrew title describing the day's focus
  - `description_he`: Hebrew description of exercises
  - `is_locked`: Day 1 unlocked, others require previous completion

  ## Data Import Compatibility
  - Uses text-based exercise_id_text for flexible future imports
  - Structured to accommodate Google Sheets data integration
  - Scalable design for additional tracks
*/

DO $$
DECLARE
  v_track_id uuid;
BEGIN
  SELECT id INTO v_track_id FROM training_tracks WHERE name = 'Beginner Track' LIMIT 1;

  IF v_track_id IS NULL THEN
    RAISE EXCEPTION 'Beginner Track not found';
  END IF;

  INSERT INTO track_days (track_id, day_number, title, title_he, description, description_he, is_locked)
  VALUES
    (v_track_id, 1, 'Introduction Day', 'יום היכרות', 'Getting started with basic eye exercises', 'התחלת התרגילים הבסיסיים לעיניים', false),
    (v_track_id, 2, 'Focus Basics', 'יסודות המיקוד', 'Learning fundamental focus techniques', 'לימוד טכניקות מיקוד בסיסיות', true),
    (v_track_id, 3, 'Eye Movement', 'תנועות עיניים', 'Basic eye movement exercises', 'תרגילי תנועת עיניים בסיסיים', true),
    (v_track_id, 4, 'Near-Far Training', 'אימון קרוב-רחוק', 'Distance focusing practice', 'תרגול מיקוד למרחקים', true),
    (v_track_id, 5, 'Relaxation Day', 'יום הרפיה', 'Eye relaxation and rest techniques', 'טכניקות הרפיה ומנוחה לעיניים', true),
    (v_track_id, 6, 'Tracking Practice', 'תרגול מעקב', 'Object tracking exercises', 'תרגילי מעקב אחר עצמים', true),
    (v_track_id, 7, 'Peripheral Vision', 'ראייה היקפית', 'Expanding peripheral awareness', 'הרחבת המודעות ההיקפית', true),
    (v_track_id, 8, 'Coordination Day', 'יום קואורדינציה', 'Eye-hand coordination basics', 'יסודות קואורדינציה עין-יד', true),
    (v_track_id, 9, 'Speed Focus', 'מיקוד מהיר', 'Quick focus shifting exercises', 'תרגילי החלפת מיקוד מהירה', true),
    (v_track_id, 10, 'Week 1 Review', 'סיכום שבוע 1', 'Review and consolidation of week 1', 'חזרה וגיבוש של שבוע 1', true),
    (v_track_id, 11, 'Advanced Focus', 'מיקוד מתקדם', 'Deeper focus training', 'אימון מיקוד מעמיק יותר', true),
    (v_track_id, 12, 'Eye Strength', 'חיזוק עיניים', 'Building eye muscle strength', 'בניית חוזק שרירי העין', true),
    (v_track_id, 13, 'Dynamic Vision', 'ראייה דינמית', 'Moving object focus training', 'אימון מיקוד על עצמים נעים', true),
    (v_track_id, 14, 'Depth Perception', 'תפיסת עומק', 'Depth perception exercises', 'תרגילי תפיסת עומק', true),
    (v_track_id, 15, 'Mid-Program Rest', 'מנוחה באמצע', 'Rest and light exercises', 'מנוחה ותרגילים קלים', true),
    (v_track_id, 16, 'Concentration', 'ריכוז', 'Visual concentration training', 'אימון ריכוז חזותי', true),
    (v_track_id, 17, 'Pattern Recognition', 'זיהוי דפוסים', 'Visual pattern exercises', 'תרגילי דפוסים חזותיים', true),
    (v_track_id, 18, 'Multi-Point Focus', 'מיקוד רב-נקודתי', 'Multiple focus point training', 'אימון מיקוד בנקודות מרובות', true),
    (v_track_id, 19, 'Visual Memory', 'זיכרון חזותי', 'Visual memory enhancement', 'שיפור הזיכרון החזותי', true),
    (v_track_id, 20, 'Week 2 Review', 'סיכום שבוע 2', 'Review and consolidation of week 2', 'חזרה וגיבוש של שבוע 2', true),
    (v_track_id, 21, 'Integration Day', 'יום אינטגרציה', 'Combining learned techniques', 'שילוב הטכניקות שנלמדו', true),
    (v_track_id, 22, 'Speed Training', 'אימון מהירות', 'Fast response exercises', 'תרגילי תגובה מהירה', true),
    (v_track_id, 23, 'Precision Focus', 'מיקוד מדויק', 'High precision focus work', 'עבודת מיקוד ברמת דיוק גבוהה', true),
    (v_track_id, 24, 'Extended Range', 'טווח מורחב', 'Extended distance training', 'אימון למרחקים מורחבים', true),
    (v_track_id, 25, 'Challenge Day', 'יום אתגר', 'Combined challenge exercises', 'תרגילי אתגר משולבים', true),
    (v_track_id, 26, 'Endurance', 'סיבולת', 'Visual endurance building', 'בניית סיבולת חזותית', true),
    (v_track_id, 27, 'Fine Tuning', 'כיוונון עדין', 'Fine motor eye control', 'שליטה עדינה בתנועות העין', true),
    (v_track_id, 28, 'Full Integration', 'אינטגרציה מלאה', 'All techniques combined', 'כל הטכניקות משולבות', true),
    (v_track_id, 29, 'Final Practice', 'תרגול אחרון', 'Comprehensive practice session', 'מפגש תרגול מקיף', true),
    (v_track_id, 30, 'Completion Day', 'יום סיום', 'Track completion and celebration', 'סיום המסלול וחגיגה', true)
  ON CONFLICT (track_id, day_number) DO UPDATE SET
    title = EXCLUDED.title,
    title_he = EXCLUDED.title_he,
    description = EXCLUDED.description,
    description_he = EXCLUDED.description_he,
    is_locked = EXCLUDED.is_locked,
    updated_at = now();
END $$;
