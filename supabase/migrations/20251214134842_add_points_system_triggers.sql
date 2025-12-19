/*
  # Points System Triggers and Functions

  1. Functions
    - Auto-create child_points record when child is created
    - Update updated_at timestamp on child_points
    - Function to award points to child
    - Function to check if child can use free day

  2. Triggers
    - Trigger to create child_points on child insert
    - Trigger to update updated_at on child_points update
*/

-- Function to auto-create child_points record
CREATE OR REPLACE FUNCTION create_child_points_record()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO child_points (child_id, points_balance, total_points_earned, free_days_available)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (child_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create child_points when child is created
DROP TRIGGER IF EXISTS trigger_create_child_points ON children;
CREATE TRIGGER trigger_create_child_points
  AFTER INSERT ON children
  FOR EACH ROW
  EXECUTE FUNCTION create_child_points_record();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_child_points_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on child_points
DROP TRIGGER IF EXISTS trigger_update_child_points_timestamp ON child_points;
CREATE TRIGGER trigger_update_child_points_timestamp
  BEFORE UPDATE ON child_points
  FOR EACH ROW
  EXECUTE FUNCTION update_child_points_timestamp();

-- Function to award points to child
CREATE OR REPLACE FUNCTION award_points_to_child(
  p_child_id uuid,
  p_points integer,
  p_transaction_type text,
  p_related_activity_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_new_balance integer;
  v_new_free_days integer;
BEGIN
  -- Update child points
  UPDATE child_points
  SET 
    points_balance = points_balance + p_points,
    total_points_earned = total_points_earned + GREATEST(p_points, 0),
    free_days_available = CASE 
      WHEN (points_balance + p_points) >= 70 AND points_balance < 70 THEN free_days_available + 1
      ELSE free_days_available
    END
  WHERE child_id = p_child_id
  RETURNING points_balance, free_days_available INTO v_new_balance, v_new_free_days;

  -- Create transaction record
  INSERT INTO child_point_transactions (
    child_id,
    points_amount,
    transaction_type,
    related_activity_id,
    description
  ) VALUES (
    p_child_id,
    p_points,
    p_transaction_type,
    p_related_activity_id,
    p_description
  );

  -- If child reached 70 points, create notification
  IF v_new_balance >= 70 AND v_new_free_days > 0 THEN
    INSERT INTO child_notifications (
      child_id,
      notification_type,
      title,
      message,
      metadata
    ) VALUES (
      p_child_id,
      'free_day_available',
      'יום חופש זמין!',
      'כל הכבוד! צברת 70 נקודות וזכית ביום חופש',
      jsonb_build_object('points_balance', v_new_balance, 'free_days_available', v_new_free_days)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use free day
CREATE OR REPLACE FUNCTION use_free_day(
  p_child_id uuid,
  p_track_day_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_current_balance integer;
  v_free_days integer;
BEGIN
  -- Check if child has enough points
  SELECT points_balance, free_days_available 
  INTO v_current_balance, v_free_days
  FROM child_points
  WHERE child_id = p_child_id;

  IF v_current_balance < 70 OR v_free_days < 1 THEN
    RETURN false;
  END IF;

  -- Deduct points and free day
  UPDATE child_points
  SET 
    points_balance = points_balance - 70,
    free_days_available = free_days_available - 1
  WHERE child_id = p_child_id;

  -- Record free day usage
  INSERT INTO free_day_usage (child_id, track_day_id, points_cost)
  VALUES (p_child_id, p_track_day_id, 70)
  ON CONFLICT (child_id, track_day_id) DO NOTHING;

  -- Create transaction record
  INSERT INTO child_point_transactions (
    child_id,
    points_amount,
    transaction_type,
    related_activity_id,
    description
  ) VALUES (
    p_child_id,
    -70,
    'free_day_purchased',
    p_track_day_id,
    'רכישת יום חופש'
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill child_points for existing children
INSERT INTO child_points (child_id, points_balance, total_points_earned, free_days_available)
SELECT id, 0, 0, 0
FROM children
WHERE id NOT IN (SELECT child_id FROM child_points)
ON CONFLICT (child_id) DO NOTHING;
