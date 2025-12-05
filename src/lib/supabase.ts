import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
        };
      };
      email_accounts: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          name: string;
          smtp_host: string;
          smtp_port: number;
          smtp_username: string;
          smtp_password: string;
          imap_host: string;
          imap_port: number;
          daily_limit: number;
          warmup_enabled: boolean;
          warmup_daily_increase: number;
          status: string;
          health_score: number;
          created_at: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          status: string;
          schedule_timezone: string;
          sending_hours_start: string;
          sending_hours_end: string;
          sending_days: string[];
          delay_between_emails_min: number;
          delay_between_emails_max: number;
          track_opens: boolean;
          track_clicks: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      sequences: {
        Row: {
          id: string;
          campaign_id: string;
          name: string;
          step_number: number;
          delay_days: number;
          subject_variants: string[];
          body_variants: string[];
          webhook_enabled: boolean;
          webhook_url: string | null;
          webhook_fields: Record<string, any>;
          created_at: string;
        };
      };
      leads: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          company: string | null;
          title: string | null;
          phone: string | null;
          website: string | null;
          linkedin_url: string | null;
          custom_fields: Record<string, any>;
          tags: string[];
          status: string;
          created_at: string;
        };
      };
      campaign_leads: {
        Row: {
          id: string;
          campaign_id: string;
          lead_id: string;
          email_account_id: string | null;
          status: string;
          current_sequence_step: number;
          last_contacted_at: string | null;
          next_followup_at: string | null;
          added_at: string;
        };
      };
      email_logs: {
        Row: {
          id: string;
          campaign_lead_id: string;
          sequence_id: string;
          email_account_id: string;
          subject: string;
          body: string;
          variant_used: number;
          webhook_data: Record<string, any> | null;
          sent_at: string;
          opened_at: string | null;
          clicked_at: string | null;
          replied_at: string | null;
          bounced_at: string | null;
          error_message: string | null;
        };
      };
      inbox_messages: {
        Row: {
          id: string;
          user_id: string;
          email_account_id: string;
          lead_id: string | null;
          campaign_id: string | null;
          message_id: string;
          thread_id: string | null;
          from_email: string;
          subject: string | null;
          body: string | null;
          is_read: boolean;
          received_at: string;
        };
      };
      webhooks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          url: string;
          method: string;
          headers: Record<string, any>;
          authentication_type: string;
          authentication_value: string | null;
          field_mappings: Record<string, any>;
          created_at: string;
        };
      };
      analytics_daily: {
        Row: {
          id: string;
          user_id: string;
          campaign_id: string | null;
          date: string;
          emails_sent: number;
          emails_opened: number;
          emails_clicked: number;
          emails_replied: number;
          emails_bounced: number;
        };
      };
    };
  };
};
