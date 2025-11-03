# Refresh Leaderboard Edge Function

This Edge Function refreshes the `weekly_leaderboard` materialized view to keep leaderboard data up-to-date.

## Deployment

Deploy this function to Supabase:

```bash
supabase functions deploy refresh-leaderboard
```

## Scheduling

Set up a cron job to call this function hourly. You can use:

1. **Supabase Cron (recommended)**: Use pg_cron extension in Supabase
2. **External cron service**: Use services like cron-job.org or EasyCron
3. **GitHub Actions**: Set up a scheduled workflow

### Example: Supabase pg_cron

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule hourly refresh
SELECT cron.schedule(
  'refresh-leaderboard-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/refresh-leaderboard',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

### Example: GitHub Actions

Create `.github/workflows/refresh-leaderboard.yml`:

```yaml
name: Refresh Leaderboard
on:
  schedule:
    - cron: '0 * * * *' # Every hour
  workflow_dispatch: # Allow manual trigger

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            https://your-project.supabase.co/functions/v1/refresh-leaderboard \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

## Manual Refresh

You can manually trigger a refresh:

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/refresh-leaderboard \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Environment Variables

The function requires these environment variables (automatically available in Supabase):
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (set automatically)

## Response

Success response:
```json
{
  "success": true,
  "message": "Leaderboard refreshed successfully",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```
