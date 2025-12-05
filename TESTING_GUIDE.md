# Testing Guide for OutreachPro

Your Instantly.ai clone is now fully functional and ready to test! Here's how to get started:

## Quick Start

1. **Sign Up / Login**
   - Open the application
   - Create a new account or sign in
   - You'll be automatically redirected to the dashboard

## Testing Workflow

### 1. Add Leads
Navigate to **Leads** page:
- Click "Add Lead" to manually add contacts
- OR click "Import CSV" to bulk upload leads

**CSV Import Features:**
- ✅ Supports both **comma-delimited** (`,`) and **tab-delimited** (`\t`) formats
- ✅ Automatically detects delimiter
- ✅ Handles "name" column (automatically splits into first_name and last_name)
- ✅ Stores all additional columns in `custom_fields` (keywords, industry, technologies, employees, etc.)

**Core fields recognized:**
- `name` (or `first_name`, `last_name`)
- `email` (required)
- `company`
- `title` (or `job_title`)
- `phone`
- `website`
- `linkedin_url` (or `linkedin`)

**Example CSV (comma-delimited):**
```
email,first_name,last_name,company,title
john@example.com,John,Doe,Acme Inc,CEO
jane@example.com,Jane,Smith,TechCorp,CTO
```

**Example CSV (tab-delimited with extended fields):**
```
name	email	title	company	linkedin_url	website	country	industry
John Doe	john@example.com	CEO	Acme Inc	linkedin.com/in/johndoe	acme.com	United States	Technology
Jane Smith	jane@example.com	CTO	TechCorp	linkedin.com/in/janesmith	techcorp.com	Canada	Software
```

All extra fields (country, industry, keywords, etc.) are automatically stored in `custom_fields` and displayed in the leads table!

### 2. Create a Campaign
Navigate to **Campaigns** page:
- Click "New Campaign"
- Enter campaign name (e.g., "Q1 Outreach")
- Add email sequences:
  - **Initial Email** (Step 1, 0 days delay)
  - **Follow-up** (Step 2, 3 days delay)
  - **Final Follow-up** (Step 3, 7 days delay)

For each sequence:
- Add subject line variants for A/B testing
- Add email body variants
- Use personalization: `{{firstName}}`, `{{lastName}}`, `{{company}}`
- **NEW: Configure Pre-Send Webhook** (sends lead data to your endpoint before each email)
- Optionally enable webhook for dynamic content injection

**Two Types of Webhooks:**

1. **Pre-Send Webhook** (Send Lead Data First)
   - ✅ Sends full lead data to your endpoint BEFORE sending email
   - ✅ Receives: email, first_name, last_name, company, title, phone, website, linkedin_url, custom_fields, campaign_id, sequence_step
   - ✅ Choose POST or GET method
   - ✅ Add custom headers (Authorization, API keys, etc.)
   - ✅ Response is logged in `email_logs.presend_webhook_response`
   - Use case: Track leads in your CRM, trigger notifications, log activity

2. **Content Webhook** (Inject Dynamic Content)
   - ✅ Fetches dynamic content to inject into email subject/body
   - ✅ Use `{{webhookData.fieldName}}` in templates
   - Use case: Personalized content, real-time data

Example email body:
```
Hi {{firstName}},

I noticed {{company}} is doing great work in the industry.

Would you be interested in learning how we can help?

Best regards
```

**Pre-Send Webhook Example:**
Your endpoint will receive (POST):
```json
{
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "company": "Acme Inc",
  "title": "CEO",
  "custom_fields": {
    "country": "United States",
    "industry": "Technology",
    "keywords": "ai, saas, b2b"
  },
  "campaign_id": "uuid",
  "sequence_step": 1
}
```

### 3. Add Leads to Campaign
From the **Campaigns** page:
- Click the "person with plus icon" button on your campaign
- Select leads from the modal
- Click "Add X Leads"

### 4. Start the Campaign
- Click the "Play" button on your campaign to activate it
- The status will change from "draft" to "active"

### 5. Email Sending
The system manages email sending through the campaign workflow:
- When campaigns are active, emails will be queued for sending
- The system will:
  - Find leads ready to be contacted
  - **Call pre-send webhook** (if enabled) - sends lead data to your endpoint
  - **Call content webhook** (if enabled) - fetches dynamic content
  - Apply the next sequence step
  - Create email logs (with both webhook responses stored)
  - Schedule next follow-ups

### 6. Monitor Analytics
Navigate to **Analytics** page:
- View sent, opened, clicked, replied stats
- Track open rates, click rates, reply rates
- Monitor campaign health

### 7. Optional: Add Email Accounts
Navigate to **Email Accounts** page:
- Add SMTP/IMAP credentials
- Configure daily sending limits
- Enable email warmup for gradual sending
- Note: These are stored for future SMTP integration

### 8. Optional: Configure Webhooks
Navigate to **Webhooks** page:
- Create webhook configurations
- Use in campaign sequences for dynamic content
- Example webhook URL: `https://api.example.com/content?email={{email}}`
- The webhook will be called before each email send
- Use `{{webhookData.fieldName}}` in email templates

## Key Features to Test

### 1. Lead Management
- ✅ Add leads manually
- ✅ Import CSV
- ✅ Search and filter
- ✅ View lead details

### 2. Campaign Creation
- ✅ Multi-step sequences
- ✅ Customizable delays between steps
- ✅ A/B testing (multiple variants)
- ✅ Personalization variables
- ✅ Webhook integration per sequence

### 3. Campaign Management
- ✅ Add leads to campaigns
- ✅ Start/pause campaigns
- ✅ Archive campaigns
- ✅ Delete campaigns
- ✅ Edit campaign sequences

### 4. Email Processing
- ✅ Queue management
- ✅ Automatic scheduling
- ✅ Webhook calls for dynamic content
- ✅ Email log creation
- ✅ Follow-up scheduling

### 5. Webhooks (Unique Feature!)
- ✅ Configure external APIs
- ✅ Authentication (Bearer, API Key)
- ✅ Custom headers
- ✅ Dynamic content injection
- ✅ Variable replacement in URLs

### 6. Analytics
- ✅ Real-time stats
- ✅ Campaign performance
- ✅ Engagement metrics
- ✅ Health indicators

## Database Structure

All data is stored in Supabase with full RLS security:
- `profiles` - User accounts
- `leads` - Contact database
- `campaigns` - Campaign configurations
- `sequences` - Email sequence steps
- `campaign_leads` - Lead assignments to campaigns
- `email_logs` - Detailed email tracking
- `email_accounts` - SMTP/IMAP configs
- `webhooks` - Dynamic content API configs
- `inbox_messages` - Unified inbox
- `analytics_daily` - Aggregated metrics

## Edge Functions

One Supabase Edge Function is deployed:

1. **process-webhook** - Handles webhook calls
   - Fetches dynamic content
   - Authenticates with external APIs
   - Returns data for email injection

## Color Scheme

The app uses a clean black, white, and orange theme:
- **Black** - Main backgrounds
- **Neutral grays** - Cards and containers
- **Orange** - Primary actions and highlights
- **White** - Text
- **Gray** - Secondary text

## Testing Tips

1. **Start Small**: Create 1-2 test leads and a simple campaign
2. **Test Sequences**: Use short delays (0, 1, 2 days) for quick testing
3. **Monitor Logs**: Check the email_logs table in Supabase to see processed emails
4. **Test Webhooks**: Use webhook.site to test webhook functionality
5. **Analytics**: After processing emails, check the Analytics page

## Current State

The application is **fully functional** for testing:
- ✅ Authentication working
- ✅ Database fully configured
- ✅ All CRUD operations functional
- ✅ Edge functions deployed
- ✅ Campaign workflow complete
- ✅ Webhook system operational
- ✅ Color scheme updated (black/white/orange)

Ready to test! 🚀
