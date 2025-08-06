# Supabase Setup Guide

This guide will help you set up the Supabase percentile calculation system.

## Prerequisites

1. **Docker Desktop** - Required for local Supabase development
   - Download from: https://docs.docker.com/desktop/
   - Make sure it's running before proceeding

2. **Supabase CLI** - Already installed ✅

## Local Development Setup

### 1. Start Supabase locally
```bash
supabase start
```

This will:
- Start all Supabase services in Docker containers
- Run the database migrations automatically
- Seed the database with test data
- Give you local URLs and keys

### 2. Get your local credentials
After `supabase start` completes, you'll see output like:
```
API URL: http://127.0.0.1:54321
GraphQL URL: http://127.0.0.1:54321/graphql/v1
S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
Inbucket URL: http://127.0.0.1:54324
JWT secret: your-jwt-secret
anon key: your-anon-key
service_role key: your-service-role-key
```

### 3. Create your environment file
```bash
cp .env.example .env.local
```

Then edit `.env.local` with your local credentials:
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
```

### 4. Deploy the Edge Function
```bash
supabase functions deploy calculate-percentiles
```

### 5. Test the percentile calculation
```bash
# Trigger the percentile calculation manually
supabase functions invoke calculate-percentiles --method POST
```

## Production Setup

### 1. Create a Supabase project
1. Go to https://supabase.com/dashboard
2. Create a new project
3. Wait for it to be ready

### 2. Link your local project
```bash
supabase link --project-ref your-project-ref
```

### 3. Push your schema to production
```bash
supabase db push
```

### 4. Deploy Edge Functions
```bash
supabase functions deploy calculate-percentiles
```

### 5. Set up the cron job (Pro plan only)
In your Supabase dashboard:
1. Go to Database → Cron Jobs
2. Create a new cron job:
   - Name: `daily-percentile-calculation`
   - Schedule: `0 2 * * *` (daily at 2 AM UTC)
   - Command: `SELECT net.http_post('https://your-project-ref.supabase.co/functions/v1/calculate-percentiles', '{"Content-Type": "application/json"}', '{"scheduled": true}');`

### 6. Update your production environment
Update your `.env.local` or deployment environment with production values:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

## Useful Commands

### Database Management
```bash
# Reset local database (careful!)
supabase db reset

# Create a new migration
supabase migration new migration-name

# Generate types for TypeScript
supabase gen types typescript --local > src/types/supabase.ts
```

### Edge Functions
```bash
# Create a new function
supabase functions new function-name

# Serve functions locally for development
supabase functions serve

# View function logs
supabase functions logs calculate-percentiles
```

### Monitoring
```bash
# View database logs
supabase logs db

# View all logs
supabase logs
```

## Testing the System

### 1. Check if data was seeded
Visit http://127.0.0.1:54323 (Supabase Studio) and check:
- `user_performances` table should have sample data
- `percentile_segments` table should have demographic segments

### 2. Test the percentile calculation
```bash
# Manually trigger calculation
supabase functions invoke calculate-percentiles --method POST

# Check the results in Studio:
# - user_percentiles table should have calculated percentiles
# - exercise_statistics table should have aggregated stats
```

### 3. Test the client-side integration
In your React app, the `SupabasePercentileService` should now work with real data.

## Troubleshooting

### Docker Issues
- Make sure Docker Desktop is running
- Try `docker system prune` if you have space issues
- Restart Docker Desktop if containers won't start

### Migration Issues
- Check migration files for syntax errors
- Use `supabase db reset` to start fresh (loses data!)
- Check logs with `supabase logs db`

### Function Issues
- Check function logs: `supabase functions logs calculate-percentiles`
- Test locally: `supabase functions serve`
- Verify environment variables are set

### Permission Issues
- Check RLS policies in the migration file
- Verify user authentication in your app
- Use service role key for admin operations

## Cost Optimization

The system is designed to be cost-effective:
- Percentiles calculated once daily (not real-time)
- Results cached in database tables
- Minimal Edge Function usage
- Efficient database queries with proper indexes

For 100k users, expect costs around $25-40/month on Supabase Pro plan.