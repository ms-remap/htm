import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to send SMTP email
async function sendSMTPEmail(to, subject, body, fromName, fromEmail, smtpConfig) {
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.port === 465,
    auth: {
      user: smtpConfig.username,
      pass: smtpConfig.password,
    },
  });

  await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: to,
    subject: subject,
    text: body,
    html: body.replace(/\n/g, '<br>'),
  });
}

// Helper function to replace variables in text
function replaceVariables(text, lead) {
  return text
    .replace(/{{firstName}}/g, lead.first_name || '')
    .replace(/{{lastName}}/g, lead.last_name || '')
    .replace(/{{company}}/g, lead.company || '')
    .replace(/{{email}}/g, lead.email || '')
    .replace(/{{title}}/g, lead.title || '')
    .replace(/{{phone}}/g, lead.phone || '')
    .replace(/{{website}}/g, lead.website || '')
    .replace(/{{linkedin_url}}/g, lead.linkedin_url || '');
}

// POST /api/send-email - Send email (test or batch)
app.post('/api/send-email', async (req, res) => {
  try {
    // Handle test email
    if (req.body.to) {
      await sendSMTPEmail(
        req.body.to,
        req.body.subject,
        req.body.body,
        req.body.from_name,
        req.body.from_email,
        req.body.smtp_config
      );

      return res.json({
        message: 'Test email sent successfully',
        to: req.body.to,
      });
    }

    // Handle batch email processing
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
      .limit(10);

    if (queryError) {
      return res.status(500).json({
        error: 'Database query failed',
        details: queryError,
      });
    }

    if (!campaignLeads || campaignLeads.length === 0) {
      return res.json({ message: 'No emails to send' });
    }

    const results = [];

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

      // Pre-send webhook
      let presendWebhookResponse = null;
      if (sequence.presend_webhook_enabled && sequence.presend_webhook_url) {
        try {
          const leadData = {
            email: campaignLead.lead.email,
            first_name: campaignLead.lead.first_name,
            last_name: campaignLead.lead.last_name,
            company: campaignLead.lead.company,
            title: campaignLead.lead.title,
            phone: campaignLead.lead.phone,
            website: campaignLead.lead.website,
            linkedin_url: campaignLead.lead.linkedin_url,
            custom_fields: campaignLead.lead.custom_fields,
            campaign_id: campaignLead.campaign_id,
            sequence_step: sequence.step_number,
          };

          const presendOptions = {
            method: sequence.presend_webhook_method || 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(sequence.presend_webhook_headers || {}),
            },
          };

          if (sequence.presend_webhook_method === 'POST') {
            presendOptions.body = JSON.stringify(leadData);
          }

          const presendUrl =
            sequence.presend_webhook_method === 'GET'
              ? `${sequence.presend_webhook_url}?${new URLSearchParams(leadData).toString()}`
              : sequence.presend_webhook_url;

          const presendResponse = await fetch(presendUrl, presendOptions);
          if (presendResponse.ok) {
            presendWebhookResponse = await presendResponse.json();
          }
        } catch (error) {
          console.error('Pre-send webhook error:', error);
        }
      }

      // Select variant
      const variantIndex = Math.floor(Math.random() * sequence.subject_variants.length);
      let subject = sequence.subject_variants[variantIndex];
      let body = sequence.body_variants[variantIndex];

      // Content webhook
      let contentWebhookResponse = null;
      if (sequence.content_webhook_enabled && sequence.content_webhook_url) {
        try {
          const leadData = {
            email: campaignLead.lead.email,
            first_name: campaignLead.lead.first_name,
            last_name: campaignLead.lead.last_name,
            company: campaignLead.lead.company,
            title: campaignLead.lead.title,
            phone: campaignLead.lead.phone,
            website: campaignLead.lead.website,
            linkedin_url: campaignLead.lead.linkedin_url,
            custom_fields: campaignLead.lead.custom_fields,
            campaign_id: campaignLead.campaign_id,
            sequence_step: sequence.step_number,
          };

          const contentOptions = {
            method: sequence.content_webhook_method || 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(sequence.content_webhook_headers || {}),
            },
          };

          if (sequence.content_webhook_method === 'POST') {
            contentOptions.body = JSON.stringify(leadData);
          }

          const contentUrl =
            sequence.content_webhook_method === 'GET'
              ? `${sequence.content_webhook_url}?${new URLSearchParams(leadData).toString()}`
              : sequence.content_webhook_url;

          const contentResponse = await fetch(contentUrl, contentOptions);

          if (contentResponse.ok) {
            let webhookData = await contentResponse.json();

            if (Array.isArray(webhookData) && webhookData.length > 0) {
              webhookData = webhookData[0];
            }

            if (webhookData.output) {
              contentWebhookResponse = webhookData.output;
            } else {
              contentWebhookResponse = webhookData;
            }

            const subjectField = sequence.content_webhook_subject_field || 'subject';
            const bodyField = sequence.content_webhook_body_field || 'body';

            if (contentWebhookResponse[subjectField]) {
              subject = contentWebhookResponse[subjectField];
            }
            if (contentWebhookResponse[bodyField]) {
              body = contentWebhookResponse[bodyField];
            }
          }
        } catch (error) {
          console.error('Content webhook error:', error);
        }
      }

      // Replace variables
      subject = replaceVariables(subject, campaignLead.lead);
      body = replaceVariables(body, campaignLead.lead);

      // Send email
      try {
        await sendSMTPEmail(
          campaignLead.lead.email,
          subject,
          body,
          campaignLead.email_account.name,
          campaignLead.email_account.email,
          {
            host: campaignLead.email_account.smtp_host,
            port: campaignLead.email_account.smtp_port,
            username: campaignLead.email_account.smtp_username,
            password: campaignLead.email_account.smtp_password,
          }
        );

        // Log success
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

        // Calculate next followup time
        const totalDelayMs =
          (sequence.delay_days || 0) * 24 * 60 * 60 * 1000 +
          (sequence.delay_hours || 0) * 60 * 60 * 1000 +
          (sequence.delay_minutes || 0) * 60 * 1000;

        // Update campaign lead
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

        results.push({
          lead: campaignLead.lead.email,
          subject,
          status: 'sent',
        });
      } catch (emailError) {
        // Log failure
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
          error_message: emailError.message,
        });

        await supabase
          .from('campaign_leads')
          .update({ status: 'failed' })
          .eq('id', campaignLead.id);

        results.push({
          lead: campaignLead.lead.email,
          subject,
          status: 'failed',
          error: emailError.message,
        });
      }
    }

    return res.json({ message: 'Emails processed', results });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
