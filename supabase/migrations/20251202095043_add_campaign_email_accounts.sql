/*
  # Add Email Account Rotation to Campaigns

  1. Changes
    - Add email_account_ids column to campaigns table to store selected email accounts for rotation
    - This allows round-robin rotation across multiple email accounts per campaign
    
  2. Purpose
    - Enable cold email best practice: rotate between multiple email accounts
    - Each lead gets assigned one email account, and all follow-ups use the same account
    - Distributes sending load across multiple accounts to avoid spam flags
    
  3. Security
    - No RLS changes needed as campaigns table already has proper policies
*/

ALTER TABLE campaigns 
  ADD COLUMN IF NOT EXISTS email_account_ids jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN campaigns.email_account_ids IS 'Array of email account IDs to rotate through for this campaign';
