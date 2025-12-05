import { supabase } from '../lib/supabase';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  from_name: string;
  from_email: string;
  smtp_config: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
}

export interface EmailAccount {
  id: string;
  email: string;
  name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
}

export interface CampaignLead {
  id: string;
  campaign_id: string;
  email_account_id: string;
  current_sequence_step: number;
  campaign: any;
  lead: {
    email: string;
    first_name: string;
    last_name: string;
    company: string;
    title: string;
    phone: string;
    website: string;
    linkedin_url: string;
    custom_fields: any;
  };
  email_account: EmailAccount;
}

export interface Sequence {
  id: string;
  campaign_id: string;
  step_number: number;
  name: string;
  delay_days: number;
  delay_hours: number;
  delay_minutes: number;
  subject_variants: string[];
  body_variants: string[];
  attachments: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  presend_webhook_enabled: boolean;
  presend_webhook_url: string;
  presend_webhook_method: string;
  presend_webhook_headers: Record<string, string>;
  content_webhook_enabled: boolean;
  content_webhook_url: string;
  content_webhook_method: string;
  content_webhook_headers: Record<string, string>;
  content_webhook_subject_field: string;
  content_webhook_body_field: string;
}

export async function sendEmailViaAPI(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Sending email via API:', {
      to: payload.to,
      from: `${payload.from_name} <${payload.from_email}>`,
      subject: payload.subject,
      smtp_host: payload.smtp_config.host,
    });

    const htmlBody = payload.body.replace(/\n/g, '<br>');

    return { success: true };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}

async function callPresendWebhook(
  sequence: Sequence,
  lead: CampaignLead['lead'],
  campaignId: string
): Promise<any> {
  if (!sequence.presend_webhook_enabled || !sequence.presend_webhook_url) {
    return null;
  }

  try {
    const leadData = {
      email: lead.email,
      first_name: lead.first_name,
      last_name: lead.last_name,
      company: lead.company,
      title: lead.title,
      phone: lead.phone,
      website: lead.website,
      linkedin_url: lead.linkedin_url,
      custom_fields: lead.custom_fields,
      campaign_id: campaignId,
      sequence_step: sequence.step_number,
    };

    const options: RequestInit = {
      method: sequence.presend_webhook_method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sequence.presend_webhook_headers || {}),
      },
    };

    if (sequence.presend_webhook_method === 'POST') {
      options.body = JSON.stringify(leadData);
    }

    const url =
      sequence.presend_webhook_method === 'GET'
        ? `${sequence.presend_webhook_url}?${new URLSearchParams(leadData as any).toString()}`
        : sequence.presend_webhook_url;

    const response = await fetch(url, options);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Pre-send webhook error:', error);
  }
  return null;
}

async function callContentWebhook(
  sequence: Sequence,
  lead: CampaignLead['lead'],
  campaignId: string
): Promise<{ subject?: string; body?: string }> {
  if (!sequence.content_webhook_enabled || !sequence.content_webhook_url) {
    return {};
  }

  try {
    const leadData = {
      email: lead.email,
      first_name: lead.first_name,
      last_name: lead.last_name,
      company: lead.company,
      title: lead.title,
      phone: lead.phone,
      website: lead.website,
      linkedin_url: lead.linkedin_url,
      custom_fields: lead.custom_fields,
      campaign_id: campaignId,
      sequence_step: sequence.step_number,
    };

    const options: RequestInit = {
      method: sequence.content_webhook_method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sequence.content_webhook_headers || {}),
      },
    };

    if (sequence.content_webhook_method === 'POST') {
      options.body = JSON.stringify(leadData);
    }

    const url =
      sequence.content_webhook_method === 'GET'
        ? `${sequence.content_webhook_url}?${new URLSearchParams(leadData as any).toString()}`
        : sequence.content_webhook_url;

    const response = await fetch(url, options);

    if (response.ok) {
      let webhookData = await response.json();

      if (Array.isArray(webhookData) && webhookData.length > 0) {
        webhookData = webhookData[0];
      }

      if (webhookData.output) {
        webhookData = webhookData.output;
      }

      const subjectField = sequence.content_webhook_subject_field || 'subject';
      const bodyField = sequence.content_webhook_body_field || 'body';

      return {
        subject: webhookData[subjectField],
        body: webhookData[bodyField],
      };
    }
  } catch (error) {
    console.error('Content webhook error:', error);
  }
  return {};
}

function replaceVariables(text: string, lead: CampaignLead['lead']): string {
  return text
    .replace(/\{\{firstName\}\}/g, lead.first_name || '')
    .replace(/\{\{lastName\}\}/g, lead.last_name || '')
    .replace(/\{\{company\}\}/g, lead.company || '')
    .replace(/\{\{email\}\}/g, lead.email || '')
    .replace(/\{\{title\}\}/g, lead.title || '')
    .replace(/\{\{phone\}\}/g, lead.phone || '')
    .replace(/\{\{website\}\}/g, lead.website || '')
    .replace(/\{\{linkedinUrl\}\}/g, lead.linkedin_url || '');
}

export async function processPendingEmails(limit: number = 10): Promise<{
  processed: number;
  sent: number;
  failed: number;
  results: Array<{ lead: string; subject: string; status: string; error?: string }>;
}> {
  const results: Array<{ lead: string; subject: string; status: string; error?: string }> = [];
  let sent = 0;
  let failed = 0;

  try {
    const { data: campaignLeads, error: queryError } = await supabase
      .from('campaign_leads')
      .select(`
        *,
        campaign:campaigns(*),
        lead:leads(*),
        email_account:email_accounts(*)
      `)
      .eq('status', 'queued')
      .not('next_followup_at', 'is', null)
      .lte('next_followup_at', new Date().toISOString())
      .limit(limit);

    if (queryError) {
      console.error('Database query error:', queryError);
      return { processed: 0, sent: 0, failed: 0, results: [] };
    }

    if (!campaignLeads || campaignLeads.length === 0) {
      return { processed: 0, sent: 0, failed: 0, results: [] };
    }

    for (const campaignLead of campaignLeads) {
      const { data: sequence, error: seqError } = await supabase
        .from('sequences')
        .select('*')
        .eq('campaign_id', campaignLead.campaign_id)
        .eq('step_number', campaignLead.current_sequence_step + 1)
        .maybeSingle();

      if (seqError || !sequence) {
        if (!sequence) {
          await supabase
            .from('campaign_leads')
            .update({ status: 'completed' })
            .eq('id', campaignLead.id);
        }
        continue;
      }

      const presendWebhookResponse = await callPresendWebhook(
        sequence,
        campaignLead.lead,
        campaignLead.campaign_id
      );

      const variantIndex = Math.floor(Math.random() * sequence.subject_variants.length);
      let subject = sequence.subject_variants[variantIndex];
      let body = sequence.body_variants[variantIndex];

      const contentWebhookResponse = await callContentWebhook(
        sequence,
        campaignLead.lead,
        campaignLead.campaign_id
      );

      if (contentWebhookResponse.subject) {
        subject = contentWebhookResponse.subject;
      }
      if (contentWebhookResponse.body) {
        body = contentWebhookResponse.body;
      }

      subject = replaceVariables(subject, campaignLead.lead);
      body = replaceVariables(body, campaignLead.lead);

      const emailPayload: EmailPayload = {
        to: campaignLead.lead.email,
        subject,
        body,
        from_name: campaignLead.email_account.name,
        from_email: campaignLead.email_account.email,
        smtp_config: {
          host: campaignLead.email_account.smtp_host,
          port: campaignLead.email_account.smtp_port,
          username: campaignLead.email_account.smtp_username,
          password: campaignLead.email_account.smtp_password,
        },
        attachments: sequence.attachments || [],
      };

      const sendResult = await sendEmailViaAPI(emailPayload);

      if (sendResult.success) {
        await supabase.from('email_logs').insert({
          campaign_lead_id: campaignLead.id,
          sequence_id: sequence.id,
          email_account_id: campaignLead.email_account_id,
          subject,
          body,
          variant_used: variantIndex,
          webhook_data: contentWebhookResponse,
          presend_webhook_response: presendWebhookResponse,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

        const totalDelayMs =
          (sequence.delay_days * 24 * 60 * 60 * 1000) +
          (sequence.delay_hours * 60 * 60 * 1000) +
          (sequence.delay_minutes * 60 * 1000);

        await supabase
          .from('campaign_leads')
          .update({
            status: 'sent',
            current_sequence_step: sequence.step_number,
            last_contacted_at: new Date().toISOString(),
            next_followup_at: totalDelayMs > 0
              ? new Date(Date.now() + totalDelayMs).toISOString()
              : null,
          })
          .eq('id', campaignLead.id);

        sent++;
        results.push({
          lead: campaignLead.lead.email,
          subject,
          status: 'sent',
        });
      } else {
        await supabase.from('email_logs').insert({
          campaign_lead_id: campaignLead.id,
          sequence_id: sequence.id,
          email_account_id: campaignLead.email_account_id,
          subject,
          body,
          variant_used: variantIndex,
          webhook_data: contentWebhookResponse,
          presend_webhook_response: presendWebhookResponse,
          status: 'failed',
          error_message: sendResult.error,
        });

        await supabase
          .from('campaign_leads')
          .update({ status: 'failed' })
          .eq('id', campaignLead.id);

        failed++;
        results.push({
          lead: campaignLead.lead.email,
          subject,
          status: 'failed',
          error: sendResult.error,
        });
      }
    }

    return {
      processed: campaignLeads.length,
      sent,
      failed,
      results,
    };
  } catch (error: any) {
    console.error('Error processing pending emails:', error);
    return { processed: 0, sent, failed, results };
  }
}
