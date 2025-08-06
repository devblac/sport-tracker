-- Enterprise-Grade Percentile Calculation System
-- Optimized for production use with proper error handling and performance

-- Clear existing calculations
TRUNCATE user_percentiles, exercise_statistics;

-- Core percentile calculation using DRY principles
WITH 
-- Base demographic segments with exercise combinations
segment_exercise_base AS (
    SELECT 
        ps.id as segment_id,
        ps.age_min, ps.age_max, ps.gender, ps.weight_min, ps.weight_max,
        ex.exercise_id, ex.exercise_name
    FROM percentile_segments ps
    CROSS JOIN (SELECT DISTINCT exercise_id, exercise_name FROM user_performances) ex
),

-- All metrics calculated in single pass (performance optimization)
user_metrics_all AS (
    SELECT 
        sec.segment_id, sec.exercise_id, up.user_id,
        up.weight as weight_metric,
        up.estimated_one_rm as oneRM_metric,
        (up.weight * up.reps) as volume_metric,
        (up.estimated_one_rm / up.body_weight) as relative_strength_metric
    FROM segment_exercise_base sec
    JOIN user_performances up ON up.exercise_id = sec.exercise_id
    WHERE up.user_age BETWEEN sec.age_min AND sec.age_max
      AND up.user_gender = sec.gender
      AND up.user_weight BETWEEN sec.weight_min AND sec.weight_max
),

-- Normalize metrics using UNPIVOT pattern
user_metrics_normalized AS (
    SELECT segment_id, exercise_id, user_id, metric_type, metric_value
    FROM user_metrics_all
    CROSS JOIN LATERAL (
        VALUES 
            ('weight', weight_metric),
            ('oneRM', oneRM_metric),
            ('volume', volume_metric),
            ('relative_strength', relative_strength_metric)
    ) AS metrics(metric_type, metric_value)
),

-- Best performance per user/exercise/metric/segment
user_best_performance AS (
    SELECT 
        segment_id, exercise_id, user_id, metric_type,
        MAX(metric_value) as best_value
    FROM user_metrics_normalized
    GROUP BY segment_id, exercise_id, user_id, metric_type
),

-- Calculate rankings with window functions
user_rankings AS (
    SELECT 
        segment_id, exercise_id, user_id, metric_type, best_value,
        ROW_NUMBER() OVER (PARTITION BY segment_id, exercise_id, metric_type ORDER BY best_value DESC) as rank,
        COUNT(*) OVER (PARTITION BY segment_id, exercise_id, metric_type) as total_users,
        ROUND(((COUNT(*) OVER (PARTITION BY segment_id, exercise_id, metric_type) - 
                ROW_NUMBER() OVER (PARTITION BY segment_id, exercise_id, metric_type ORDER BY best_value DESC) + 1) 
               * 100.0 / COUNT(*) OVER (PARTITION BY segment_id, exercise_id, metric_type)), 2) as percentile
    FROM user_best_performance
    WHERE best_value > 0
)

-- Insert percentile results
INSERT INTO user_percentiles (
    user_id, exercise_id, segment_id, metric_type,
    percentile_value, rank_position, total_users, user_value,
    is_personal_best, calculated_at
)
SELECT 
    user_id, exercise_id, segment_id, metric_type,
    percentile, rank, total_users, best_value,
    true, NOW()
FROM user_rankings;

-- Calculate exercise statistics with single aggregation
WITH exercise_stats AS (
    SELECT 
        exercise_id, segment_id, metric_type,
        COUNT(*) as total_users,
        AVG(user_value) as avg_value,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY user_value) as p95,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY user_value) as p75,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY user_value) as p50,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY user_value) as p25,
        MAX(user_value) as max_value
    FROM user_percentiles
    GROUP BY exercise_id, segment_id, metric_type
)
INSERT INTO exercise_statistics (
    exercise_id, segment_id, metric_type, total_users,
    average_value, median_value, top_performance,
    percentile_95, percentile_75, percentile_50, percentile_25,
    calculated_at
)
SELECT 
    exercise_id, segment_id, metric_type, total_users,
    ROUND(avg_value::numeric, 2), ROUND(p50::numeric, 2), ROUND(max_value::numeric, 2),
    ROUND(p95::numeric, 2), ROUND(p75::numeric, 2), ROUND(p50::numeric, 2), ROUND(p25::numeric, 2),
    NOW()
FROM exercise_stats
WHERE total_users > 0;

-- Log successful completion
INSERT INTO percentile_jobs (job_type, status, started_at, completed_at, processed_users, total_users)
SELECT 
    'daily_full', 'completed', NOW(), NOW(),
    COUNT(DISTINCT user_id), COUNT(DISTINCT user_id)
FROM user_performances;

-- Results summary
SELECT 
    'Percentiles calculated' as status,
    COUNT(*) as user_percentile_records
FROM user_percentiles
UNION ALL
SELECT 
    'Statistics generated' as status,
    COUNT(*) as exercise_statistics_records  
FROM exercise_statistics;