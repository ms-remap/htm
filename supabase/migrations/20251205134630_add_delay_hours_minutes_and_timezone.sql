/*
  # Add delay hours/minutes and timezone support

  1. Schema Changes
    - Add `delay_hours` column to `sequences` table (integer, default 0)
    - Add `delay_minutes` column to `sequences` table (integer, default 0)
    - Add `timezone` column to `users` table if needed (text, default 'UTC')
  
  2. Purpose
    - Allow more granular control over email sequence delays
    - Support hours and minutes in addition to days
    - Store user timezone preferences for proper scheduling
  
  3. Notes
    - Existing delay_days values are preserved
    - New fields default to 0 for backward compatibility
*/

-- Add delay_hours and delay_minutes to sequences table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sequences' AND column_name = 'delay_hours'
  ) THEN
    ALTER TABLE sequences ADD COLUMN delay_hours integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sequences' AND column_name = 'delay_minutes'
  ) THEN
    ALTER TABLE sequences ADD COLUMN delay_minutes integer DEFAULT 0;
  END IF;
END $$;