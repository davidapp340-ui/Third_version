/*
  # Points and Notification System

  1. New Tables
    - `child_points` - Tracks child's point balance and free days
      - `id` (uuid, primary key)
      - `child_id` (uuid, FK to children, unique)
      - `points_balance` (integer, default 0)
      - `total_points_earned` (integer, default 0)
      - `free_days_available` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `child_point_transactions` - Records all point earning/spending
      - `id` (uuid, primary key)
      - `child_id` (uuid, FK to children)
      - `points_amount` (integer) - positive for earning, negative for spending
      - `transaction_type` (text) - 'track_completion', 'gallery_workout', 'free_day_purchased'
      - `related_activity_id` (uuid, nullable)
      - `description` (text)
      - `created_at` (timestamptz)

    - `parent_notifications` - Notifications for parents about child activity
      - `id` (uuid, primary key)
      - `parent_id` (uuid, FK to parents)
      - `child_id` (uuid, FK to children)
      - `notification_type` (text) - 'track_completed', 'milestone_reached'
      - `title` (text)
      - `message` (text)
      - `is_read` (boolean, default false)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

    - `child_notifications` - Notifications for children
      - `id` (uuid, primary key)
      - `child_id` (uuid, FK to children)
      - `notification_type` (text) - 'parent_reaction', 'milestone_reached', 'free_day_available'
      - `title` (text)
      - `message` (text)
      - `is_read` (boolean, default false)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

    - `parent_reactions` - Parent reactions to child's achievements
      - `id` (uuid, primary key)
      - `parent_id` (uuid, FK to parents)
      - `child_id` (uuid, FK to children)
      - `track_day_completion_id` (uuid, FK to track_day_completions)
      - `reaction_type` (text) - 'smiley', 'like', 'well_done'
      - `message` (text, nullable)
      - `created_at` (timestamptz)

    - `free_day_usage` - Tracks when children use free days
      - `id` (uuid, primary key)
      - `child_id` (uuid, FK to children)
      - `track_day_id` (uuid, FK to track_days)
      - `used_date` (date)
      - `points_cost` (integer, default 70)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Children can read own points, transactions, and notifications
    - Parents can read their children's points and create reactions
    - Parents can read notifications for their children
    - Children can read reactions sent to them
*/

-- Child Points Table
CREATE TABLE IF NOT EXISTS child_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL UNIQUE REFERENCES children(id) ON DELETE CASCADE,
  points_balance integer NOT NULL DEFAULT 0,
  total_points_earned integer NOT NULL DEFAULT 0,
  free_days_available integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE child_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Children can read own points"
  ON child_points FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can read children points"
  ON child_points FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON f.id = c.family_id
      WHERE f.parent_id = auth.uid()
    )
  );

-- Child Point Transactions Table
CREATE TABLE IF NOT EXISTS child_point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  points_amount integer NOT NULL,
  transaction_type text NOT NULL,
  related_activity_id uuid,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE child_point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Children can read own transactions"
  ON child_point_transactions FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can read children transactions"
  ON child_point_transactions FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON f.id = c.family_id
      WHERE f.parent_id = auth.uid()
    )
  );

-- Parent Notifications Table
CREATE TABLE IF NOT EXISTS parent_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can read own notifications"
  ON parent_notifications FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can update own notifications"
  ON parent_notifications FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- Child Notifications Table
CREATE TABLE IF NOT EXISTS child_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE child_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Children can read own notifications"
  ON child_notifications FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Children can update own notifications"
  ON child_notifications FOR UPDATE
  TO authenticated
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

-- Parent Reactions Table
CREATE TABLE IF NOT EXISTS parent_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  track_day_completion_id uuid NOT NULL REFERENCES track_day_completions(id) ON DELETE CASCADE,
  reaction_type text NOT NULL,
  message text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(parent_id, track_day_completion_id)
);

ALTER TABLE parent_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can create reactions for their children"
  ON parent_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_id = auth.uid() AND
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON f.id = c.family_id
      WHERE f.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can read own reactions"
  ON parent_reactions FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Children can read reactions sent to them"
  ON parent_reactions FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

-- Free Day Usage Table
CREATE TABLE IF NOT EXISTS free_day_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  track_day_id uuid NOT NULL REFERENCES track_days(id) ON DELETE CASCADE,
  used_date date NOT NULL DEFAULT CURRENT_DATE,
  points_cost integer NOT NULL DEFAULT 70,
  created_at timestamptz DEFAULT now(),
  UNIQUE(child_id, track_day_id)
);

ALTER TABLE free_day_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Children can read own free day usage"
  ON free_day_usage FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can read children free day usage"
  ON free_day_usage FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON f.id = c.family_id
      WHERE f.parent_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_child_points_child_id ON child_points(child_id);
CREATE INDEX IF NOT EXISTS idx_child_point_transactions_child_id ON child_point_transactions(child_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_parent_id ON parent_notifications(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_child_id ON parent_notifications(child_id);
CREATE INDEX IF NOT EXISTS idx_child_notifications_child_id ON child_notifications(child_id);
CREATE INDEX IF NOT EXISTS idx_parent_reactions_child_id ON parent_reactions(child_id);
CREATE INDEX IF NOT EXISTS idx_free_day_usage_child_id ON free_day_usage(child_id);
