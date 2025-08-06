-- Supabase Cron Job Configuration
-- This sets up the daily percentile calculation to run automatically

-- Note: pg_cron extension is only available in Supabase Pro plan
-- For local development, you can trigger the function manually or use a different scheduler

-- Enable the pg_cron extension (Pro plan only)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily percentile calculation at 2 AM UTC
-- This runs when most users are inactive to minimize impact
-- Uncomment when using Supabase Pro:
/*
SELECT cron.schedule(
  'daily-percentile-calculation',
  '0 2 * * *', -- Every day at 2 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/calculate-percentiles',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}',
    body := '{"scheduled": true}'
  );
  $$
);
*/

-- Alternative for local development: Create a simple trigger function
-- This can be called manually or via a simple scheduler
CREATE OR REPLACE FUNCTION trigger_percentile_calculation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This would typically call the edge function
  -- For now, just log that it was called
  RAISE NOTICE 'Percentile calculation triggered at %', NOW();
END;
$$;

-- Monitor cron job execution (Pro plan only)
-- SELECT * FROM cron.job_run_details WHERE jobname = 'daily-percentile-calculation' ORDER BY start_time DESC LIMIT 10;