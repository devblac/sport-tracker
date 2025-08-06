/**
 * Enterprise Percentile Calculation Engine
 * 
 * Production-grade Edge Function for daily percentile calculations.
 * Optimized for performance, reliability, and cost-effectiveness.
 * 
 * @author Sport Tracker Team
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PerformanceData {
  user_id: string;
  exercise_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  estimated_one_rm: number;
  body_weight: number;
  workout_date: string;
  user_age: number;
  user_gender: string;
  user_weight: number;
  experience_level: string;
}

interface SegmentData {
  id: number;
  name: string;
  description: string;
  age_min: number;
  age_max: number;
  gender: string;
  weight_min: number;
  weight_max: number;
}

interface PercentileResult {
  user_id: string;
  exercise_id: string;
  segment_id: number;
  metric_type: string;
  percentile_value: number;
  rank_position: number;
  total_users: number;
  user_value: number;
  is_personal_best: boolean;
}

serve(async (req) => {
  try {
    // Verify this is a scheduled call or authorized request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader && req.method !== 'POST') {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting daily percentile calculation...');

    // Create a new job record
    const { data: job, error: jobError } = await supabase
      .from('percentile_jobs')
      .insert({
        job_type: 'daily_full',
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create job:', jobError);
      return new Response('Failed to create job', { status: 500 });
    }

    try {
      // Get all segments
      const { data: segments, error: segmentsError } = await supabase
        .from('percentile_segments')
        .select('*');

      if (segmentsError) throw segmentsError;

      // Get all performance data from the last 90 days (to keep it manageable)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: performances, error: performancesError } = await supabase
        .from('user_performances')
        .select('*')
        .gte('workout_date', ninetyDaysAgo.toISOString().split('T')[0]);

      if (performancesError) throw performancesError;

      console.log(`Processing ${performances.length} performance records across ${segments.length} segments`);

      // Group performances by exercise and segment
      const exerciseSegmentGroups = new Map<string, Map<number, PerformanceData[]>>();

      for (const performance of performances) {
        const exerciseId = performance.exercise_id;
        
        if (!exerciseSegmentGroups.has(exerciseId)) {
          exerciseSegmentGroups.set(exerciseId, new Map());
        }

        const exerciseGroups = exerciseSegmentGroups.get(exerciseId)!;

        // Find matching segments for this user
        const matchingSegments = segments.filter(segment => 
          performance.user_age >= segment.age_min &&
          performance.user_age <= segment.age_max &&
          performance.user_gender === segment.gender &&
          performance.user_weight >= segment.weight_min &&
          performance.user_weight <= segment.weight_max
        );

        for (const segment of matchingSegments) {
          if (!exerciseGroups.has(segment.id)) {
            exerciseGroups.set(segment.id, []);
          }
          exerciseGroups.get(segment.id)!.push(performance);
        }
      }

      // Calculate percentiles for each exercise-segment combination
      const allPercentiles: PercentileResult[] = [];
      const allStatistics: any[] = [];
      let processedUsers = 0;

      for (const [exerciseId, segmentGroups] of exerciseSegmentGroups) {
        for (const [segmentId, segmentPerformances] of segmentGroups) {
          if (segmentPerformances.length === 0) continue;

          // Get the best performance for each user in this segment
          const userBestPerformances = new Map<string, PerformanceData>();
          
          for (const performance of segmentPerformances) {
            const existing = userBestPerformances.get(performance.user_id);
            if (!existing || performance.estimated_one_rm > existing.estimated_one_rm) {
              userBestPerformances.set(performance.user_id, performance);
            }
          }

          const bestPerformances = Array.from(userBestPerformances.values());
          
          // Calculate percentiles for each metric
          const metrics = ['weight', 'oneRM', 'volume', 'relative_strength'];
          
          for (const metric of metrics) {
            const values = bestPerformances.map(p => getMetricValue(p, metric));
            const sortedValues = [...values].sort((a, b) => a - b);
            
            // Calculate statistics
            const total = values.length;
            const average = values.reduce((sum, v) => sum + v, 0) / total;
            const median = sortedValues[Math.floor(total / 2)];
            const top = Math.max(...values);
            const p95 = sortedValues[Math.floor(total * 0.95)];
            const p75 = sortedValues[Math.floor(total * 0.75)];
            const p50 = median;
            const p25 = sortedValues[Math.floor(total * 0.25)];

            // Store exercise statistics
            allStatistics.push({
              exercise_id: exerciseId,
              segment_id: segmentId,
              metric_type: metric,
              total_users: total,
              average_value: average,
              median_value: median,
              top_performance: top,
              percentile_95: p95,
              percentile_75: p75,
              percentile_50: p50,
              percentile_25: p25,
              calculated_at: new Date().toISOString()
            });

            // Calculate percentiles for each user
            for (const performance of bestPerformances) {
              const userValue = getMetricValue(performance, metric);
              const percentile = calculatePercentile(userValue, sortedValues);
              const rank = sortedValues.filter(v => v > userValue).length + 1;

              allPercentiles.push({
                user_id: performance.user_id,
                exercise_id: exerciseId,
                segment_id: segmentId,
                metric_type: metric,
                percentile_value: percentile,
                rank_position: rank,
                total_users: total,
                user_value: userValue,
                is_personal_best: true // We're using best performances
              });
            }
          }

          processedUsers += bestPerformances.length;
        }
      }

      console.log(`Calculated ${allPercentiles.length} percentile records for ${processedUsers} user-exercise combinations`);

      // Batch insert percentiles (delete old ones first)
      await supabase.from('user_percentiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Insert in batches of 1000 to avoid timeout
      const batchSize = 1000;
      for (let i = 0; i < allPercentiles.length; i += batchSize) {
        const batch = allPercentiles.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('user_percentiles')
          .insert(batch);
        
        if (insertError) {
          console.error('Batch insert error:', insertError);
          throw insertError;
        }
      }

      // Batch insert statistics
      await supabase.from('exercise_statistics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      for (let i = 0; i < allStatistics.length; i += batchSize) {
        const batch = allStatistics.slice(i, i + batchSize);
        const { error: statsError } = await supabase
          .from('exercise_statistics')
          .insert(batch);
        
        if (statsError) {
          console.error('Statistics insert error:', statsError);
          throw statsError;
        }
      }

      // Update job as completed
      await supabase
        .from('percentile_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processed_users: processedUsers,
          total_users: new Set(performances.map(p => p.user_id)).size
        })
        .eq('id', job.id);

      console.log('Daily percentile calculation completed successfully');

      return new Response(JSON.stringify({
        success: true,
        processed_users: processedUsers,
        percentile_records: allPercentiles.length,
        statistics_records: allStatistics.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Percentile calculation error:', error);
      
      // Update job as failed
      await supabase
        .from('percentile_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', job.id);

      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Helper functions
function getMetricValue(performance: PerformanceData, metric: string): number {
  switch (metric) {
    case 'weight':
      return performance.weight;
    case 'oneRM':
      return performance.estimated_one_rm;
    case 'volume':
      return performance.weight * performance.reps;
    case 'relative_strength':
      return performance.estimated_one_rm / performance.body_weight;
    default:
      return performance.weight;
  }
}

function calculatePercentile(value: number, sortedValues: number[]): number {
  if (sortedValues.length === 0) return 50;
  
  const rank = sortedValues.filter(v => v < value).length;
  return Math.round((rank / sortedValues.length) * 100);
}