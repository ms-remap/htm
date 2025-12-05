import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function sendSMTPEmail(
  to: string,
  subject: string,
  body: string,
  fromName: string,
  fromEmail: string,
  smtpConfig: {
    host: string;
    port: number;
    username: string;
    password: string;
  }
) {
  const client = new SMTPClient({
    connection: {
      hostname: smtpConfig.host,
      port: smtpConfig.port,
      tls: smtpConfig.port === 465,
      auth: {
        username: smtpConfig.username,
        password: smtpConfig.password,
      },
    },
  });

  await client.send({
    from: `${fromName} <${fromEmail}>`,
    to: to,
    subject: subject,
    content: body,
    html: body.replace(/\n/g, "<br>"),
  });

  await client.close();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestBody = await req.json().catch(() => null);

    if (requestBody && requestBody.to) {
      try {
        await sendSMTPEmail(
          requestBody.to,
          requestBody.subject,
          requestBody.body,
          requestBody.from_name,
          requestBody.from_email,
          requestBody.smtp_config
        );

        return new Response(
          JSON.stringify({
            message: "Test email sent successfully",
            to: requestBody.to,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (smtpError: any) {
        return new Response(
          JSON.stringify({
            error: `SMTP error: ${smtpError.message}`,
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    const { data: campaignLeads, error: queryError } = await supabase
      .from("campaign_leads")
      .select(`
        *,
        campaign:campaigns(*),
        lead:leads(*),
        email_account:email_accounts(*)
      `)
      .eq("status", "queued")
      .not("next_followup_at", "is", null)
      .lte("next_followup_at", new Date().toISOString())
      .limit(10);

    if (queryError) {
      return new Response(
        JSON.stringify({ error: "Database query failed", details: queryError }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!campaignLeads || campaignLeads.length === 0) {
      return new Response(
        JSON.stringify({ message: "No emails to send" }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const results = [];

    for (const campaignLead of campaignLeads) {
      const { data: sequence, error: seqError } = await supabase
        .from("sequences")
        .select("*")
        .eq("campaign_id", campaignLead.campaign_id)
        .eq("step_number", campaignLead.current_sequence_step + 1)
        .maybeSingle();

      if (seqError || !sequence) {
        if (!sequence) {
          await supabase
            .from("campaign_leads")
            .update({ status: "completed" })
            .eq("id", campaignLead.id);
        }
        continue;
      }

      let presendWebhookResponse: any = null;
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

          const presendOptions: RequestInit = {
            method: sequence.presend_webhook_method || "POST",
            headers: {
              "Content-Type": "application/json",
              ...(sequence.presend_webhook_headers || {}),
            },
          };

          if (sequence.presend_webhook_method === "POST") {
            presendOptions.body = JSON.stringify(leadData);
          }

          const presendUrl =
            sequence.presend_webhook_method === "GET"
              ? `${sequence.presend_webhook_url}?${new URLSearchParams(leadData as any).toString()}`
              : sequence.presend_webhook_url;

          const presendResponse = await fetch(presendUrl, presendOptions);
          if (presendResponse.ok) {
            presendWebhookResponse = await presendResponse.json();
          }
        } catch (error) {
          console.error("Pre-send webhook error:", error);
        }
      }

      const variantIndex = Math.floor(
        Math.random() * sequence.subject_variants.length
      );
      let subject = sequence.subject_variants[variantIndex];
      let body = sequence.body_variants[variantIndex];

      let contentWebhookResponse: any = null;
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

          const contentOptions: RequestInit = {
            method: sequence.content_webhook_method || "POST",
            headers: {
              "Content-Type": "application/json",
              ...(sequence.content_webhook_headers || {}),
            },
          };

          if (sequence.content_webhook_method === "POST") {
            contentOptions.body = JSON.stringify(leadData);
          }

          const contentUrl =
            sequence.content_webhook_method === "GET"
              ? `${sequence.content_webhook_url}?${new URLSearchParams(leadData as any).toString()}`
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

            const subjectField =
              sequence.content_webhook_subject_field || "subject";
            const bodyField = sequence.content_webhook_body_field || "body";

            if (contentWebhookResponse[subjectField]) {
              subject = contentWebhookResponse[subjectField];
            }
            if (contentWebhookResponse[bodyField]) {
              body = contentWebhookResponse[bodyField];
            }
          }
        } catch (error) {
          console.error("Content webhook error:", error);
        }
      }

      subject = subject
        .replace(/{{firstName}}/g, campaignLead.lead.first_name || "")
        .replace(/{{lastName}}/g, campaignLead.lead.last_name || "")
        .replace(/{{company}}/g, campaignLead.lead.company || "");

      body = body
        .replace(/{{firstName}}/g, campaignLead.lead.first_name || "")
        .replace(/{{lastName}}/g, campaignLead.lead.last_name || "")
        .replace(/{{company}}/g, campaignLead.lead.company || "");

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

        await supabase.from("email_logs").insert({
          campaign_lead_id: campaignLead.id,
          sequence_id: sequence.id,
          email_account_id: campaignLead.email_account_id,
          subject,
          body,
          variant_used: variantIndex,
          webhook_data: contentWebhookResponse,
          presend_webhook_response: presendWebhookResponse,
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        const delayDays = sequence.delay_days || 0;
        const delayHours = sequence.delay_hours || 0;
        const delayMinutes = sequence.delay_minutes || 0;
        const totalDelayMs =
          (delayDays * 24 * 60 * 60 * 1000) +
          (delayHours * 60 * 60 * 1000) +
          (delayMinutes * 60 * 1000);

        await supabase
          .from("campaign_leads")
          .update({
            status: "sent",
            current_sequence_step: sequence.step_number,
            last_contacted_at: new Date().toISOString(),
            next_followup_at:
              totalDelayMs > 0
                ? new Date(Date.now() + totalDelayMs).toISOString()
                : null,
          })
          .eq("id", campaignLead.id);

        results.push({
          lead: campaignLead.lead.email,
          subject,
          status: "sent",
        });
      } catch (emailError: any) {
        await supabase.from("email_logs").insert({
          campaign_lead_id: campaignLead.id,
          sequence_id: sequence.id,
          email_account_id: campaignLead.email_account_id,
          subject,
          body,
          variant_used: variantIndex,
          webhook_data: contentWebhookResponse,
          presend_webhook_response: presendWebhookResponse,
          status: "failed",
          error_message: emailError.message,
        });

        await supabase
          .from("campaign_leads")
          .update({ status: "failed" })
          .eq("id", campaignLead.id);

        results.push({
          lead: campaignLead.lead.email,
          subject,
          status: "failed",
          error: emailError.message,
        });
      }
    }

    return new Response(JSON.stringify({ message: "Emails processed", results }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});