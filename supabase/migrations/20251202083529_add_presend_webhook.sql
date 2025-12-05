/*
  # Add Pre-Send Webhook Feature

  1. Changes
    - Add `presend_webhook_enabled` (boolean) to sequences table
    - Add `presend_webhook_url` (text) to sequences table
    - Add `presend_webhook_method` (text) to sequences table (GET or POST)
    - Add `presend_webhook_headers` (jsonb) to sequences table for auth headers
    - Add `presend_webhook_response` (jsonb) to email_logs table to store webhook response

  2. Purpose
    - Send lead data to external endpoint before sending each email
    - Store webhook response for debugging and logging
    - Separate from content webhook (which injects dynamic content)
    - Pre-send webhook sends lead data, receives confirmation/tracking data
*/

-- Add pre-send webhook fields to sequences table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sequences' AND column_name = 'presend_webhook_enabled'
  ) THEN
    ALTER TABLE sequences ADD COLUMN presend_webhook_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sequences' AND column_name = 'presend_webhook_url'
  ) THEN
    ALTER TABLE sequences ADD COLUMN presend_webhook_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sequences' AND column_name = 'presend_webhook_method'
  ) THEN
    ALTER TABLE sequences ADD COLUMN presend_webhook_method text DEFAULT 'POST';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sequences' AND column_name = 'presend_webhook_headers'
  ) THEN
    ALTER TABLE sequences ADD COLUMN presend_webhook_headers jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add pre-send webhook response field to email_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_logs' AND column_name = 'presend_webhook_response'
  ) THEN
    ALTER TABLE email_logs ADD COLUMN presend_webhook_response jsonb;
  END IF;
END $$;
