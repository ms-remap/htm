/*
  # Fix Security and Performance Issues

  1. Add Missing Indexes on Foreign Keys
    - analytics_daily.campaign_id
    - campaign_leads.email_account_id
    - email_logs.email_account_id
    - email_logs.sequence_id
    - inbox_messages.campaign_id
    - inbox_messages.email_account_id
    - inbox_messages.lead_id

  2. Optimize RLS Policies
    - Replace auth.uid() with (select auth.uid()) in all policies
    - This prevents re-evaluation for each row, improving performance

  3. Security Notes
    - All foreign keys will be indexed for optimal query performance
    - All RLS policies optimized for scale
*/

-- ==========================================
-- 1. ADD MISSING INDEXES ON FOREIGN KEYS
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_analytics_daily_campaign_id 
  ON analytics_daily(campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_leads_email_account_id 
  ON campaign_leads(email_account_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_email_account_id 
  ON email_logs(email_account_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_sequence_id 
  ON email_logs(sequence_id);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_campaign_id 
  ON inbox_messages(campaign_id);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_email_account_id 
  ON inbox_messages(email_account_id);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_lead_id 
  ON inbox_messages(lead_id);

-- ==========================================
-- 2. OPTIMIZE RLS POLICIES - PROFILES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- ==========================================
-- 3. OPTIMIZE RLS POLICIES - EMAIL_ACCOUNTS
-- ==========================================

DROP POLICY IF EXISTS "Users can view own email accounts" ON email_accounts;
CREATE POLICY "Users can view own email accounts"
  ON email_accounts FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own email accounts" ON email_accounts;
CREATE POLICY "Users can insert own email accounts"
  ON email_accounts FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own email accounts" ON email_accounts;
CREATE POLICY "Users can update own email accounts"
  ON email_accounts FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own email accounts" ON email_accounts;
CREATE POLICY "Users can delete own email accounts"
  ON email_accounts FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ==========================================
-- 4. OPTIMIZE RLS POLICIES - CAMPAIGNS
-- ==========================================

DROP POLICY IF EXISTS "Users can view own campaigns" ON campaigns;
CREATE POLICY "Users can view own campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own campaigns" ON campaigns;
CREATE POLICY "Users can insert own campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own campaigns" ON campaigns;
CREATE POLICY "Users can update own campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own campaigns" ON campaigns;
CREATE POLICY "Users can delete own campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ==========================================
-- 5. OPTIMIZE RLS POLICIES - LEADS
-- ==========================================

DROP POLICY IF EXISTS "Users can view own leads" ON leads;
CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
CREATE POLICY "Users can insert own leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own leads" ON leads;
CREATE POLICY "Users can update own leads"
  ON leads FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own leads" ON leads;
CREATE POLICY "Users can delete own leads"
  ON leads FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ==========================================
-- 6. OPTIMIZE RLS POLICIES - SEQUENCES
-- ==========================================

DROP POLICY IF EXISTS "Users can view sequences for own campaigns" ON sequences;
CREATE POLICY "Users can view sequences for own campaigns"
  ON sequences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = sequences.campaign_id
      AND campaigns.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert sequences for own campaigns" ON sequences;
CREATE POLICY "Users can insert sequences for own campaigns"
  ON sequences FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = sequences.campaign_id
      AND campaigns.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update sequences for own campaigns" ON sequences;
CREATE POLICY "Users can update sequences for own campaigns"
  ON sequences FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = sequences.campaign_id
      AND campaigns.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = sequences.campaign_id
      AND campaigns.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete sequences for own campaigns" ON sequences;
CREATE POLICY "Users can delete sequences for own campaigns"
  ON sequences FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = sequences.campaign_id
      AND campaigns.user_id = (select auth.uid())
    )
  );

-- ==========================================
-- 7. OPTIMIZE RLS POLICIES - CAMPAIGN_LEADS
-- ==========================================

DROP POLICY IF EXISTS "Users can view campaign leads for own campaigns" ON campaign_leads;
CREATE POLICY "Users can view campaign leads for own campaigns"
  ON campaign_leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_leads.campaign_id
      AND campaigns.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert campaign leads for own campaigns" ON campaign_leads;
CREATE POLICY "Users can insert campaign leads for own campaigns"
  ON campaign_leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_leads.campaign_id
      AND campaigns.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update campaign leads for own campaigns" ON campaign_leads;
CREATE POLICY "Users can update campaign leads for own campaigns"
  ON campaign_leads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_leads.campaign_id
      AND campaigns.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_leads.campaign_id
      AND campaigns.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete campaign leads for own campaigns" ON campaign_leads;
CREATE POLICY "Users can delete campaign leads for own campaigns"
  ON campaign_leads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_leads.campaign_id
      AND campaigns.user_id = (select auth.uid())
    )
  );

-- ==========================================
-- 8. OPTIMIZE RLS POLICIES - EMAIL_LOGS
-- ==========================================

DROP POLICY IF EXISTS "Users can view email logs for own campaigns" ON email_logs;
CREATE POLICY "Users can view email logs for own campaigns"
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaign_leads
      JOIN campaigns ON campaigns.id = campaign_leads.campaign_id
      WHERE campaign_leads.id = email_logs.campaign_lead_id
      AND campaigns.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert email logs for own campaigns" ON email_logs;
CREATE POLICY "Users can insert email logs for own campaigns"
  ON email_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaign_leads
      JOIN campaigns ON campaigns.id = campaign_leads.campaign_id
      WHERE campaign_leads.id = email_logs.campaign_lead_id
      AND campaigns.user_id = (select auth.uid())
    )
  );

-- ==========================================
-- 9. OPTIMIZE RLS POLICIES - INBOX_MESSAGES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own inbox messages" ON inbox_messages;
CREATE POLICY "Users can view own inbox messages"
  ON inbox_messages FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own inbox messages" ON inbox_messages;
CREATE POLICY "Users can insert own inbox messages"
  ON inbox_messages FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own inbox messages" ON inbox_messages;
CREATE POLICY "Users can update own inbox messages"
  ON inbox_messages FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own inbox messages" ON inbox_messages;
CREATE POLICY "Users can delete own inbox messages"
  ON inbox_messages FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ==========================================
-- 10. OPTIMIZE RLS POLICIES - WEBHOOKS
-- ==========================================

DROP POLICY IF EXISTS "Users can view own webhooks" ON webhooks;
CREATE POLICY "Users can view own webhooks"
  ON webhooks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own webhooks" ON webhooks;
CREATE POLICY "Users can insert own webhooks"
  ON webhooks FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own webhooks" ON webhooks;
CREATE POLICY "Users can update own webhooks"
  ON webhooks FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own webhooks" ON webhooks;
CREATE POLICY "Users can delete own webhooks"
  ON webhooks FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ==========================================
-- 11. OPTIMIZE RLS POLICIES - ANALYTICS_DAILY
-- ==========================================

DROP POLICY IF EXISTS "Users can view own analytics" ON analytics_daily;
CREATE POLICY "Users can view own analytics"
  ON analytics_daily FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own analytics" ON analytics_daily;
CREATE POLICY "Users can insert own analytics"
  ON analytics_daily FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own analytics" ON analytics_daily;
CREATE POLICY "Users can update own analytics"
  ON analytics_daily FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
