# Setup Guide

This project consists of two parts:
1. React Frontend (Vite)
2. Express API Backend (Node.js)

## Prerequisites

- Node.js 18+ installed
- Supabase account with database setup

## Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3001
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Backend API Setup

1. Navigate to API directory:
```bash
cd api
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `api/.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
```

5. Run API server:
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## Running Both Together

For local development, you need to run both servers:

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - API:**
```bash
cd api
npm run dev
```

The frontend will be available at `http://localhost:5173`
The API will be available at `http://localhost:3001`

## Production Deployment

### Frontend
Deploy the `dist/` folder (after running `npm run build`) to:
- Vercel
- Netlify
- Cloudflare Pages
- Any static hosting service

### Backend API
Deploy the `api/` folder to:
- Railway (recommended)
- Render
- Heroku
- DigitalOcean App Platform
- AWS EC2

Make sure to:
1. Set environment variables in your deployment platform
2. Update `VITE_API_URL` in your frontend `.env` to point to your deployed API URL

## Database Migrations

The database should already be set up with the necessary tables. If you need to run migrations:

```bash
# Migrations are in supabase/migrations/
# They should be automatically applied by Supabase
```

## Troubleshooting

**CORS Errors:**
- Make sure the API is running on the correct port
- Check that `VITE_API_URL` matches your API server URL

**Email Not Sending:**
- Verify SMTP credentials in email accounts
- Check API server logs for errors
- Ensure the API has access to Supabase

**Build Errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check that all environment variables are set correctly
