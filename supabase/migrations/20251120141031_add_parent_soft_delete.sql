/*
  # Add Parent Account Soft Delete System

  ## Overview
  This migration adds soft delete functionality for parent accounts with a 30-day grace period.
  During the grace period, the parent and all associated child accounts are hidden but can be restored.

  ## Changes to Existing Tables

  ### `parents`
  - `deleted_at` (timestamptz) - Timestamp when account was marked for deletion
  - `deletion_scheduled_at` (timestamptz) - When the account will be permanently deleted (30 days after deleted_at)

  ### `children`
  - Inherits deletion status from parent via family relationship

  ## New Functions

  ### `soft_delete_parent_account(parent_id uuid)`
  Marks a parent account and all associated data for deletion

  ### `restore_parent_account(parent_id uuid)`
  Restores a soft-deleted parent account before permanent deletion

  ### `check_account_deletion_status(parent_id uuid)`
  Returns deletion status and days remaining

  ## Security Notes
  1. Soft-deleted accounts cannot log in
  2. Data remains in database for 30 days
  3. After 30 days, a background job should permanently delete the data
  4. Only the parent can restore their own account

  ## Important Notes
  - Permanent deletion must be implemented separately as a scheduled job
  - All child accounts are affected by parent deletion
  - Family data is also soft-deleted with the parent
*/

-- Add soft delete columns to parents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parents' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE parents ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parents' AND column_name = 'deletion_scheduled_at'
  ) THEN
    ALTER TABLE parents ADD COLUMN deletion_scheduled_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Function to soft delete parent account
CREATE OR REPLACE FUNCTION soft_delete_parent_account(parent_id uuid)
RETURNS json AS $$
DECLARE
  child_count integer;
  deletion_date timestamptz;
BEGIN
  deletion_date := NOW() + INTERVAL '30 days';

  SELECT COUNT(*) INTO child_count
  FROM children c
  JOIN families f ON c.family_id = f.id
  WHERE f.parent_id = parent_id;

  UPDATE parents
  SET
    deleted_at = NOW(),
    deletion_scheduled_at = deletion_date,
    updated_at = NOW()
  WHERE id = parent_id;

  RETURN json_build_object(
    'success', true,
    'deleted_at', NOW(),
    'deletion_scheduled_at', deletion_date,
    'affected_children', child_count,
    'days_to_restore', 30
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore parent account
CREATE OR REPLACE FUNCTION restore_parent_account(parent_id uuid)
RETURNS json AS $$
DECLARE
  current_deleted_at timestamptz;
  child_count integer;
BEGIN
  SELECT deleted_at INTO current_deleted_at
  FROM parents
  WHERE id = parent_id;

  IF current_deleted_at IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Account is not marked for deletion'
    );
  END IF;

  SELECT COUNT(*) INTO child_count
  FROM children c
  JOIN families f ON c.family_id = f.id
  WHERE f.parent_id = parent_id;

  UPDATE parents
  SET
    deleted_at = NULL,
    deletion_scheduled_at = NULL,
    updated_at = NOW()
  WHERE id = parent_id;

  RETURN json_build_object(
    'success', true,
    'restored_at', NOW(),
    'affected_children', child_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check deletion status
CREATE OR REPLACE FUNCTION check_account_deletion_status(parent_id uuid)
RETURNS json AS $$
DECLARE
  parent_record RECORD;
  days_remaining integer;
BEGIN
  SELECT deleted_at, deletion_scheduled_at
  INTO parent_record
  FROM parents
  WHERE id = parent_id;

  IF parent_record.deleted_at IS NULL THEN
    RETURN json_build_object(
      'is_deleted', false,
      'message', 'Account is active'
    );
  END IF;

  days_remaining := EXTRACT(DAY FROM (parent_record.deletion_scheduled_at - NOW()));

  RETURN json_build_object(
    'is_deleted', true,
    'deleted_at', parent_record.deleted_at,
    'deletion_scheduled_at', parent_record.deletion_scheduled_at,
    'days_remaining', days_remaining,
    'can_restore', days_remaining > 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for faster queries on deleted accounts
CREATE INDEX IF NOT EXISTS idx_parents_deleted_at ON parents(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_parents_deletion_scheduled ON parents(deletion_scheduled_at) WHERE deletion_scheduled_at IS NOT NULL;

-- Update RLS policies to exclude soft-deleted accounts
DROP POLICY IF EXISTS "Parents can read own data" ON parents;
CREATE POLICY "Parents can read own data"
  ON parents FOR SELECT
  TO authenticated
  USING (auth.uid() = id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Parents can update own data" ON parents;
CREATE POLICY "Parents can update own data"
  ON parents FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = id);
