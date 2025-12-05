import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { leadEmail, webhookId } = await req.json();

    if (!leadEmail || !webhookId) {
      return new Response(
        JSON.stringify({ error: 'Missing leadEmail or webhookId' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: webhook } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .single();

    if (!webhook) {
      return new Response(
        JSON.stringify({ error: 'Webhook not found' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('email', leadEmail)
      .single();

    if (!lead) {
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    let webhookUrl = webhook.url
      .replace('{{email}}', encodeURIComponent(lead.email))
      .replace('{{firstName}}', encodeURIComponent(lead.first_name || ''))
      .replace('{{lastName}}', encodeURIComponent(lead.last_name || ''))
      .replace('{{company}}', encodeURIComponent(lead.company || ''));

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...webhook.headers,
    };

    if (webhook.authentication_type === 'bearer' && webhook.authentication_value) {
      headers['Authorization'] = `Bearer ${webhook.authentication_value}`;
    } else if (webhook.authentication_type === 'api_key' && webhook.authentication_value) {
      headers['X-API-Key'] = webhook.authentication_value;
    }

    const webhookResponse = await fetch(webhookUrl, {
      method: webhook.method,
      headers,
      body: webhook.method === 'POST' ? JSON.stringify(lead) : undefined,
    });

    if (!webhookResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Webhook call failed', status: webhookResponse.status }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const data = await webhookResponse.json();

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});