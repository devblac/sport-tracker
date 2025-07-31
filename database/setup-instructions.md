# Supabase Database Setup Instructions

## Prerequisites

1. **Supabase Account**: Make sure you have access to the Supabase project:
   - Project URL: `https://kaifdxfseeusxsgmqftr.supabase.co`
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaWZkeGZzZWV1c3hzZ21xZnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDAxNDUsImV4cCI6MjA2OTM3NjE0NX0.X0S9uLjv3dbYyp2szQoNFc92dRyMLrlstqsr21vBK7g`

2. **Database Access**: You'll need access to the SQL Editor in the Supabase dashboard.

## Setup Steps

### 1. Run the Schema Migration

1. Open the Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `kaifdxfseeusxsgmqftr`
3. Go to **SQL Editor** in the left sidebar
4. Create a new query
5. Copy and paste the entire contents of `supabase-schema.sql`
6. Click **Run** to execute the migration

### 2. Verify the Setup

After running the migration, verify that all tables were created:

```sql
-- Check that all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- `achievements`
- `challenge_participants`
- `challenges`
- `comment_likes`
- `comments`
- `equipment_types`
- `exercise_categories`
- `exercise_performances`
- `exercises`
- `friendships`
- `muscle_groups`
- `notifications`
- `post_likes`
- `social_posts`
- `streak_history`
- `user_achievements`
- `user_analytics`
- `user_profiles`
- `user_settings`
- `user_streaks`
- `workout_sessions`
- `workout_templates`
- `xp_transactions`

### 3. Set Up Storage Buckets (Optional)

If you plan to store user avatars, workout images, or other media:

1. Go to **Storage** in the Supabase dashboard
2. Create the following buckets:
   - `avatars` (for user profile pictures)
   - `workout-images` (for workout photos)
   - `exercise-media` (for exercise GIFs and images)

3. Set up storage policies for each bucket:

```sql
-- Avatar bucket policies
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Workout images bucket policies
INSERT INTO storage.buckets (id, name, public) VALUES ('workout-images', 'workout-images', true);

CREATE POLICY "Workout images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'workout-images');

CREATE POLICY "Users can upload workout images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'workout-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 4. Configure Authentication

1. Go to **Authentication** > **Settings** in the Supabase dashboard
2. Configure the following settings:
   - **Site URL**: Your app's URL (e.g., `http://localhost:5173` for development)
   - **Redirect URLs**: Add your app's URLs for auth redirects
   - **Email Templates**: Customize signup/reset password emails if needed

### 5. Set Up Real-time (Optional)

If you want real-time updates for comments, likes, etc.:

1. Go to **Database** > **Replication** in the Supabase dashboard
2. Enable replication for the following tables:
   - `comments`
   - `comment_likes`
   - `post_likes`
   - `social_posts`
   - `notifications`

### 6. Test the Connection

Create a simple test to verify the connection works:

```sql
-- Test query to verify setup
SELECT 
  'Database setup successful!' as message,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
```

## Security Features Implemented

### Row Level Security (RLS)
- ✅ All user data tables have RLS enabled
- ✅ Users can only access their own data
- ✅ Friend-based visibility for social features
- ✅ Public/private content visibility controls

### Data Validation
- ✅ Check constraints on critical fields
- ✅ Foreign key relationships maintained
- ✅ Proper data types and limits

### Indexes for Performance
- ✅ Optimized queries for common operations
- ✅ Composite indexes for complex queries
- ✅ Full-text search capabilities

### Triggers and Functions
- ✅ Automatic timestamp updates
- ✅ Engagement count maintenance
- ✅ Data consistency enforcement

## Environment Variables

Make sure to set up the following environment variables in your app:

```env
VITE_SUPABASE_URL=https://kaifdxfseeusxsgmqftr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaWZkeGZzZWV1c3hzZ21xZnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDAxNDUsImV4cCI6MjA2OTM3NjE0NX0.X0S9uLjv3dbYyp2szQoNFc92dRyMLrlstqsr21vBK7g
```

## Next Steps

After setting up the database:

1. **Install Supabase Client**: `npm install @supabase/supabase-js`
2. **Update Services**: Replace local services with Supabase-backed services
3. **Test Authentication**: Implement user signup/login flows
4. **Test Data Operations**: Verify CRUD operations work correctly
5. **Set Up Offline Sync**: Implement offline-first functionality with sync

## Troubleshooting

### Common Issues

1. **RLS Policies**: If you get permission errors, check that RLS policies are correctly set up
2. **Foreign Key Constraints**: Make sure referenced records exist before inserting
3. **Data Types**: Ensure your app data matches the database schema types
4. **Indexes**: If queries are slow, check that proper indexes are in place

### Useful Queries

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public';

-- Monitor active connections
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

## Support

If you encounter any issues during setup:

1. Check the Supabase documentation: https://supabase.com/docs
2. Review the SQL error messages carefully
3. Test individual table creations if the full migration fails
4. Verify your Supabase project permissions

The database schema is designed to be production-ready with proper security, performance optimizations, and scalability considerations.