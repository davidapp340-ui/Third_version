/*
  # Consent and Legal Policy System

  ## Overview
  This migration creates a system for managing consent policies and tracking parent consent
  for data collection and legal terms.

  ## New Tables

  ### `consent_policies`
  Stores legal policies and consent documents
  - `id` (uuid, primary key) - Unique policy identifier
  - `policy_type` (text) - Type of policy: 'data_collection' or 'terms_of_use'
  - `title_key` (text) - Key for policy title in text management system
  - `content_key` (text) - Key for full policy content
  - `version` (integer) - Version number of the policy
  - `is_active` (boolean) - Whether this version is currently active
  - `created_at` (timestamptz) - Policy creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `parent_consents`
  Tracks which consents parents have agreed to for each child
  - `id` (uuid, primary key) - Unique consent record identifier
  - `parent_id` (uuid) - References parents.id
  - `child_id` (uuid) - References children.id
  - `policy_id` (uuid) - References consent_policies.id
  - `policy_version` (integer) - Version of policy agreed to
  - `agreed_at` (timestamptz) - When consent was given
  - `ip_address` (text, nullable) - IP address for audit trail

  ## Security

  ### Row Level Security (RLS)
  All tables have RLS enabled with the following policies:

  #### Consent Policies Table
  - All authenticated users can read active policies
  - Only system/admin can create or modify policies

  #### Parent Consents Table
  - Parents can read their own consent records
  - Parents can insert their own consent records
  - No updates or deletes allowed (audit trail)

  ## Important Notes
  1. Policies are versioned for legal compliance
  2. Parent consent is permanently recorded (no deletion)
  3. Each child requires separate consent from parent
  4. Consent includes timestamp for legal audit trail
  5. Policy content is stored in text management system for multi-language support
*/

-- Create consent policies table
CREATE TABLE IF NOT EXISTS consent_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type text NOT NULL CHECK (policy_type IN ('data_collection', 'terms_of_use')),
  title_key text NOT NULL,
  content_key text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (policy_type, version)
);

-- Create parent consents table
CREATE TABLE IF NOT EXISTS parent_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  policy_id uuid NOT NULL REFERENCES consent_policies(id) ON DELETE RESTRICT,
  policy_version integer NOT NULL,
  agreed_at timestamptz DEFAULT now(),
  ip_address text,
  UNIQUE (parent_id, child_id, policy_id)
);

-- Enable RLS on all tables
ALTER TABLE consent_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_consents ENABLE ROW LEVEL SECURITY;

-- Consent policies table policies
CREATE POLICY "All authenticated users can read active consent policies"
  ON consent_policies
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Parent consents table policies
CREATE POLICY "Parents can read own consent records"
  ON parent_consents
  FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can insert own consent records"
  ON parent_consents
  FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_consent_policies_policy_type ON consent_policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_consent_policies_is_active ON consent_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_parent_consents_parent_id ON parent_consents(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_consents_child_id ON parent_consents(child_id);

-- Trigger for updated_at
CREATE TRIGGER update_consent_policies_updated_at
  BEFORE UPDATE ON consent_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default consent policies (placeholders)
INSERT INTO consent_policies (policy_type, title_key, content_key, version, is_active)
VALUES
  ('data_collection', 'consent.data_collection.title', 'consent.data_collection.content', 1, true),
  ('terms_of_use', 'consent.terms_of_use.title', 'consent.terms_of_use.content', 1, true)
ON CONFLICT (policy_type, version) DO NOTHING;
