# OutreachPro API

Express.js API for email sending functionality.

## Setup

1. Install dependencies:
```bash
cd api
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your Supabase credentials:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
```

## Running

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Endpoints

### POST /api/send-email

Send a test email or process batch emails.

**Test Email Request:**
```json
{
  "to": "test@example.com",
  "subject": "Test Subject",
  "body": "Test Body",
  "from_name": "Your Name",
  "from_email": "you@example.com",
  "smtp_config": {
    "host": "smtp.example.com",
    "port": 587,
    "username": "your_username",
    "password": "your_password"
  }
}
```

**Batch Processing Request:**
```json
{}
```
Empty body triggers batch processing of queued emails.

### GET /health

Health check endpoint.

## Deployment

You can deploy this API to:
- Railway
- Render
- Heroku
- DigitalOcean App Platform
- AWS EC2
- Any Node.js hosting service

Make sure to set the environment variables in your deployment platform.

## Update React App

Update your React app's `.env` file:
```
VITE_API_URL=http://localhost:3001
```

For production, change to your deployed API URL.
