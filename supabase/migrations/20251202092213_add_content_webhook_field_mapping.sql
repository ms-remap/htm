/*
  # Add Content Webhook Field Mapping

  1. Changes
    - Add content_webhook_subject_field to sequences table
    - Add content_webhook_body_field to sequences table
    
  2. Purpose
    - Allow users to specify which fields from webhook response map to subject/body
    - Example: API returns {"subject": "Hello", "body": "World", "other": "data"}
    - User can specify to use response.subject for email subject
    - User can specify to use response.body for email body
    
  3. Notes
    - These are optional - if not set, the webhook data can still be used with placeholders
    - When set, the entire subject/body will be replaced with the webhook response field
*/

ALTER TABLE sequences 
  ADD COLUMN IF NOT EXISTS content_webhook_subject_field text,
  ADD COLUMN IF NOT EXISTS content_webhook_body_field text;

COMMENT ON COLUMN sequences.content_webhook_subject_field IS 'JSON path to extract subject from webhook response (e.g., "subject" or "data.subject")';
COMMENT ON COLUMN sequences.content_webhook_body_field IS 'JSON path to extract body from webhook response (e.g., "body" or "data.content")';
