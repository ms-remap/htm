/*
  # Instantly.ai Clone Database Schema

  ## Overview
  Complete database schema for email outreach platform with campaign management,
  lead tracking, sequence automation, email account management, and webhook integration.

  ## New Tables

  ### 1. `profiles`
  User profile data extending Supabase auth.users
  - `id` (uuid, FK to auth.users)
  - `email` (text)
  - `full_name` (text)
  - `company_name` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `email_accounts`
  Connected email accounts for sending campaigns
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `email` (text, unique)
  - `name` (text)
  - `smtp_host` (text)
  - `smtp_port` (int)
  - `smtp_username` (text)
  - `smtp_password` (text, encrypted)
  - `imap_host` (text)
  - `imap_port` (int)
  - `daily_limit` (int)
  - `warmup_enabled` (boolean)
  - `warmup_daily_increase` (int)
  - `status` (text: active, paused, error)
  - `health_score` (int)
  - `created_at` (timestamptz)

  ### 3. `campaigns`
  Email campaign configurations
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `name` (text)
  - `status` (text: draft, active, paused, completed, archived)
  - `schedule_timezone` (text)
  - `sending_hours_start` (time)
  - `sending_hours_end` (time)
  - `sending_days` (jsonb array)
  - `delay_between_emails_min` (int, seconds)
  - `delay_between_emails_max` (int, seconds)
  - `track_opens` (boolean)
  - `track_clicks` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `sequences`
  Email sequence templates within campaigns
  - `id` (uuid, PK)
  - `campaign_id` (uuid, FK to campaigns)
  - `name` (text)
  - `step_number` (int)
  - `delay_days` (int)
  - `subject_variants` (jsonb array)
  - `body_variants` (jsonb array)
  - `webhook_enabled` (boolean)
  - `webhook_url` (text)
  - `webhook_fields` (jsonb)
  - `created_at` (timestamptz)

  ### 5. `leads`
  Contact database for campaigns
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `email` (text)
  - `first_name` (text)
  - `last_name` (text)
  - `company` (text)
  - `title` (text)
  - `phone` (text)
  - `website` (text)
  - `linkedin_url` (text)
  - `custom_fields` (jsonb)
  - `tags` (text array)
  - `status` (text: active, unsubscribed, bounced, replied)
  - `created_at` (timestamptz)

  ### 6. `campaign_leads`
  Junction table linking leads to campaigns
  - `id` (uuid, PK)
  - `campaign_id` (uuid, FK to campaigns)
  - `lead_id` (uuid, FK to leads)
  - `email_account_id` (uuid, FK to email_accounts)
  - `status` (text: queued, sending, sent, opened, clicked, replied, bounced, failed)
  - `current_sequence_step` (int)
  - `last_contacted_at` (timestamptz)
  - `next_followup_at` (timestamptz)
  - `added_at` (timestamptz)

  ### 7. `email_logs`
  Detailed log of every email sent
  - `id` (uuid, PK)
  - `campaign_lead_id` (uuid, FK to campaign_leads)
  - `sequence_id` (uuid, FK to sequences)
  - `email_account_id` (uuid, FK to email_accounts)
  - `subject` (text)
  - `body` (text)
  - `variant_used` (int)
  - `webhook_data` (jsonb)
  - `sent_at` (timestamptz)
  - `opened_at` (timestamptz)
  - `clicked_at` (timestamptz)
  - `replied_at` (timestamptz)
  - `bounced_at` (timestamptz)
  - `error_message` (text)

  ### 8. `inbox_messages`
  Unified inbox for email replies
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `email_account_id` (uuid, FK to email_accounts)
  - `lead_id` (uuid, FK to leads)
  - `campaign_id` (uuid, FK to campaigns)
  - `message_id` (text, unique)
  - `thread_id` (text)
  - `from_email` (text)
  - `subject` (text)
  - `body` (text)
  - `is_read` (boolean)
  - `received_at` (timestamptz)

  ### 9. `webhooks`
  Webhook configurations for dynamic content
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `name` (text)
  - `url` (text)
  - `method` (text: GET, POST)
  - `headers` (jsonb)
  - `authentication_type` (text: none, bearer, api_key)
  - `authentication_value` (text)
  - `field_mappings` (jsonb)
  - `created_at` (timestamptz)

  ### 10. `analytics_daily`
  Aggregated daily analytics
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `campaign_id` (uuid, FK to campaigns)
  - `date` (date)
  - `emails_sent` (int)
  - `emails_opened` (int)
  - `emails_clicked` (int)
  - `emails_replied` (int)
  - `emails_bounced` (int)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Policies enforce user_id or auth.uid() checks
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  company_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create email_accounts table
CREATE TABLE IF NOT EXISTS email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  smtp_host text NOT NULL,
  smtp_port int NOT NULL DEFAULT 587,
  smtp_username text NOT NULL,
  smtp_password text NOT NULL,
  imap_host text NOT NULL,
  imap_port int NOT NULL DEFAULT 993,
  daily_limit int DEFAULT 50,
  warmup_enabled boolean DEFAULT false,
  warmup_daily_increase int DEFAULT 5,
  status text DEFAULT 'active',
  health_score int DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email accounts"
  ON email_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email accounts"
  ON email_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email accounts"
  ON email_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email accounts"
  ON email_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text DEFAULT 'draft',
  schedule_timezone text DEFAULT 'UTC',
  sending_hours_start time DEFAULT '09:00:00',
  sending_hours_end time DEFAULT '17:00:00',
  sending_days jsonb DEFAULT '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]'::jsonb,
  delay_between_emails_min int DEFAULT 60,
  delay_between_emails_max int DEFAULT 180,
  track_opens boolean DEFAULT true,
  track_clicks boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create sequences table
CREATE TABLE IF NOT EXISTS sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  step_number int NOT NULL,
  delay_days int DEFAULT 0,
  subject_variants jsonb DEFAULT '[]'::jsonb,
  body_variants jsonb DEFAULT '[]'::jsonb,
  webhook_enabled boolean DEFAULT false,
  webhook_url text,
  webhook_fields jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sequences for own campaigns"
  ON sequences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = sequences.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sequences for own campaigns"
  ON sequences FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = sequences.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sequences for own campaigns"
  ON sequences FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = sequences.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = sequences.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sequences for own campaigns"
  ON sequences FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = sequences.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  company text,
  title text,
  phone text,
  website text,
  linkedin_url text,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email)
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads"
  ON leads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create campaign_leads table
CREATE TABLE IF NOT EXISTS campaign_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  email_account_id uuid REFERENCES email_accounts(id) ON DELETE SET NULL,
  status text DEFAULT 'queued',
  current_sequence_step int DEFAULT 0,
  last_contacted_at timestamptz,
  next_followup_at timestamptz,
  added_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, lead_id)
);

ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaign leads for own campaigns"
  ON campaign_leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_leads.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert campaign leads for own campaigns"
  ON campaign_leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_leads.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update campaign leads for own campaigns"
  ON campaign_leads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_leads.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_leads.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete campaign leads for own campaigns"
  ON campaign_leads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_leads.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_lead_id uuid NOT NULL REFERENCES campaign_leads(id) ON DELETE CASCADE,
  sequence_id uuid NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  email_account_id uuid NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL,
  variant_used int DEFAULT 0,
  webhook_data jsonb,
  sent_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  bounced_at timestamptz,
  error_message text
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email logs for own campaigns"
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaign_leads
      JOIN campaigns ON campaigns.id = campaign_leads.campaign_id
      WHERE campaign_leads.id = email_logs.campaign_lead_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert email logs for own campaigns"
  ON email_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaign_leads
      JOIN campaigns ON campaigns.id = campaign_leads.campaign_id
      WHERE campaign_leads.id = email_logs.campaign_lead_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Create inbox_messages table
CREATE TABLE IF NOT EXISTS inbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_account_id uuid NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  message_id text UNIQUE NOT NULL,
  thread_id text,
  from_email text NOT NULL,
  subject text,
  body text,
  is_read boolean DEFAULT false,
  received_at timestamptz DEFAULT now()
);

ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inbox messages"
  ON inbox_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inbox messages"
  ON inbox_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inbox messages"
  ON inbox_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inbox messages"
  ON inbox_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  method text DEFAULT 'POST',
  headers jsonb DEFAULT '{}'::jsonb,
  authentication_type text DEFAULT 'none',
  authentication_value text,
  field_mappings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhooks"
  ON webhooks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own webhooks"
  ON webhooks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhooks"
  ON webhooks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhooks"
  ON webhooks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create analytics_daily table
CREATE TABLE IF NOT EXISTS analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  date date NOT NULL,
  emails_sent int DEFAULT 0,
  emails_opened int DEFAULT 0,
  emails_clicked int DEFAULT 0,
  emails_replied int DEFAULT 0,
  emails_bounced int DEFAULT 0,
  UNIQUE(user_id, campaign_id, date)
);

ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics"
  ON analytics_daily FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
  ON analytics_daily FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
  ON analytics_daily FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_sequences_campaign_id ON sequences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign_id ON campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_lead_id ON campaign_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_status ON campaign_leads(status);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_next_followup ON campaign_leads(next_followup_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_lead_id ON email_logs(campaign_lead_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_inbox_messages_user_id ON inbox_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_messages_thread_id ON inbox_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_user_campaign_date ON analytics_daily(user_id, campaign_id, date);