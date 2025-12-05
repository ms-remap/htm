/*
  # Fix Webhook Columns and Add Content Webhook

  1. Clean up existing webhook columns
    - Remove old webhook_enabled, webhook_url, webhook_fields
    - Keep presend_webhook columns
    - Add content_webhook columns

  2. Two-webhook workflow
    - Pre-send webhook: Sends lead data before email (for enrichment)
    - Content webhook: Receives processed data to use in email template

  3. Security
    - All webhook settings are protected by existing RLS policies
*/

-- Remove old webhook columns if they still exist
ALTER TABLE sequences DROP COLUMN IF EXISTS webhook_enabled;
ALTER TABLE sequences DROP COLUMN IF EXISTS webhook_url;
ALTER TABLE sequences DROP COLUMN IF EXISTS webhook_fields;

-- Add content webhook columns
ALTER TABLE sequences 
  ADD COLUMN IF NOT EXISTS content_webhook_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS content_webhook_url text,
  ADD COLUMN IF NOT EXISTS content_webhook_method text DEFAULT 'POST',
  ADD COLUMN IF NOT EXISTS content_webhook_headers jsonb;
