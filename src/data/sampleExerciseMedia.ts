import type { ExerciseCreate } from '@/schemas/exercise';

/**
 * Sample exercises with media URLs for testing the media system
 * In production, these would come from your backend/CDN
 */
export const sampleExercisesWithMedia: ExerciseCreate[] = [
  {
    name: 'Barbell Bench Press',
    type: 'barbell',
    category: 'strength',
    body_parts: ['chest', 'shoulders', 'arms'],
    muscle_groups: ['pectorals', 'deltoids', 'triceps_brachii'],
    equipment: 'barbell',
    difficulty_level: 3,
    instructions: [
      {
        step_number: 1,
        instruction: 'Lie flat on the bench with your eyes under the barbell'
      },
      {
        step_number: 2,
        instruction: 'Grip the bar with hands slightly wider than shoulder-width'
      },
      {
        step_number: 3,
        instruction: 'Lower the bar to your chest with control'
      },
      {
        step_number: 4,
        instruction: 'Press the bar back up to starting position'
      }
    ],
    tips: [
      {
        category: 'form',
        tip: 'Keep your shoulder blades retracted throughout the movement'
      },
      {
        category: 'breathing',
        tip: 'Inhale on the way down, exhale on the way up'
      },
      {
        category: 'safety',
        tip: 'Always use a spotter when lifting heavy weights'
      }
    ],
    // Sample media URLs (replace with actual URLs in production)
    gif_url: 'https://cdn.jefit.com/assets/img/exercises/gifs/1.gif',
    muscle_diagram_url: 'https://cdn.jefit.com/assets/img/exercises/bodymap/1.png',
    thumbnail_url: 'https://cdn.jefit.com/assets/img/exercises/thumbnails/1.jpg',
    video_url: 'https://cdn.jefit.com/assets/video/exercises/1.mp4',
    default_sets: 3,
    default_reps: 8,
    default_rest_time: 120,
    tags: ['compound', 'upper_body', 'strength'],
    aliases: ['Bench Press', 'Flat Bench Press'],
    created_at: new Date(),
  },
  {
    name: 'Barbell Squat',
    type: 'barbell',
    category: 'strength',
    body_parts: ['legs', 'glutes', 'core'],
    muscle_groups: ['quadriceps_femoris', 'gluteus_maximus', 'hamstrings'],
    equipment: 'barbell',
    difficulty_level: 4,
    instructions: [
      {
        step_number: 1,
        instruction: 'Position the barbell on your upper back'
      },
      {
        step_number: 2,
        instruction: 'Stand with feet shoulder-width apart'
      },
      {
        step_number: 3,
        instruction: 'Lower your body by bending at hips and knees'
      },
      {
        step_number: 4,
        instruction: 'Drive through your heels to return to starting position'
      }
    ],
    tips: [
      {
        category: 'form',
        tip: 'Keep your chest up and knees tracking over your toes'
      },
      {
        category: 'breathing',
        tip: 'Take a deep breath at the top, hold during descent and ascent'
      },
      {
        category: 'safety',
        tip: 'Use safety bars set just below your lowest squat position'
      }
    ],
    gif_url: 'https://cdn.jefit.com/assets/img/exercises/gifs/2.gif',
    muscle_diagram_url: 'https://cdn.jefit.com/assets/img/exercises/bodymap/2.png',
    thumbnail_url: 'https://cdn.jefit.com/assets/img/exercises/thumbnails/2.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_time: 180,
    tags: ['compound', 'lower_body', 'strength'],
    aliases: ['Back Squat', 'High Bar Squat'],
    created_at: new Date(),
  },
  {
    name: 'Dumbbell Bicep Curl',
    type: 'dumbbell',
    category: 'strength',
    body_parts: ['arms', 'biceps'],
    muscle_groups: ['biceps_brachii', 'brachialis'],
    equipment: 'dumbbell',
    difficulty_level: 2,
    instructions: [
      {
        step_number: 1,
        instruction: 'Stand with dumbbells at your sides, palms facing forward'
      },
      {
        step_number: 2,
        instruction: 'Keep your elbows close to your torso'
      },
      {
        step_number: 3,
        instruction: 'Curl the weights up by contracting your biceps'
      },
      {
        step_number: 4,
        instruction: 'Lower the weights back to starting position with control'
      }
    ],
    tips: [
      {
        category: 'form',
        tip: 'Avoid swinging or using momentum'
      },
      {
        category: 'breathing',
        tip: 'Exhale on the curl up, inhale on the way down'
      }
    ],
    gif_url: 'https://cdn.jefit.com/assets/img/exercises/gifs/3.gif',
    muscle_diagram_url: 'https://cdn.jefit.com/assets/img/exercises/bodymap/3.png',
    thumbnail_url: 'https://cdn.jefit.com/assets/img/exercises/thumbnails/3.jpg',
    default_sets: 3,
    default_reps: 12,
    default_rest_time: 60,
    tags: ['isolation', 'upper_body', 'biceps'],
    aliases: ['Bicep Curl', 'DB Curl'],
    created_at: new Date(),
  },
  {
    name: 'Push-ups',
    type: 'bodyweight',
    category: 'strength',
    body_parts: ['chest', 'shoulders', 'arms', 'core'],
    muscle_groups: ['pectorals', 'deltoids', 'triceps_brachii', 'rectus_abdominis'],
    equipment: 'none',
    difficulty_level: 2,
    instructions: [
      {
        step_number: 1,
        instruction: 'Start in a plank position with hands under shoulders'
      },
      {
        step_number: 2,
        instruction: 'Keep your body in a straight line from head to heels'
      },
      {
        step_number: 3,
        instruction: 'Lower your chest toward the ground'
      },
      {
        step_number: 4,
        instruction: 'Push back up to starting position'
      }
    ],
    tips: [
      {
        category: 'form',
        tip: 'Maintain a straight line from head to heels throughout'
      },
      {
        category: 'progression',
        tip: 'Start with knee push-ups if regular push-ups are too difficult'
      }
    ],
    variations: [
      {
        name: 'Knee Push-ups',
        description: 'Perform push-ups from your knees for reduced difficulty',
        difficulty_modifier: -1
      },
      {
        name: 'Diamond Push-ups',
        description: 'Place hands in diamond shape for increased tricep activation',
        difficulty_modifier: 1
      }
    ],
    gif_url: 'https://cdn.jefit.com/assets/img/exercises/gifs/4.gif',
    muscle_diagram_url: 'https://cdn.jefit.com/assets/img/exercises/bodymap/4.png',
    thumbnail_url: 'https://cdn.jefit.com/assets/img/exercises/thumbnails/4.jpg',
    default_sets: 3,
    default_reps: 15,
    default_rest_time: 60,
    tags: ['bodyweight', 'compound', 'upper_body'],
    aliases: ['Push Up', 'Press Up'],
    created_at: new Date(),
  },
  {
    name: 'Deadlift',
    type: 'barbell',
    category: 'strength',
    body_parts: ['back', 'legs', 'glutes', 'core'],
    muscle_groups: ['erector_spinae', 'gluteus_maximus', 'hamstrings', 'latissimus_dorsi'],
    equipment: 'barbell',
    difficulty_level: 5,
    instructions: [
      {
        step_number: 1,
        instruction: 'Stand with feet hip-width apart, bar over mid-foot'
      },
      {
        step_number: 2,
        instruction: 'Bend at hips and knees to grip the bar'
      },
      {
        step_number: 3,
        instruction: 'Keep chest up and back straight'
      },
      {
        step_number: 4,
        instruction: 'Drive through heels to lift the bar, extending hips and knees'
      },
      {
        step_number: 5,
        instruction: 'Stand tall with shoulders back'
      },
      {
        step_number: 6,
        instruction: 'Lower the bar by pushing hips back and bending knees'
      }
    ],
    tips: [
      {
        category: 'form',
        tip: 'Keep the bar close to your body throughout the movement'
      },
      {
        category: 'breathing',
        tip: 'Take a deep breath before lifting, hold until lockout'
      },
      {
        category: 'safety',
        tip: 'Start with light weight to master the form'
      }
    ],
    safety_notes: [
      'Always warm up thoroughly before deadlifting',
      'Use proper lifting technique to avoid back injury',
      'Consider using lifting straps for heavy weights'
    ],
    contraindications: [
      'Lower back injury or pain',
      'Recent spinal surgery',
      'Severe disc problems'
    ],
    gif_url: 'https://cdn.jefit.com/assets/img/exercises/gifs/5.gif',
    muscle_diagram_url: 'https://cdn.jefit.com/assets/img/exercises/bodymap/5.png',
    thumbnail_url: 'https://cdn.jefit.com/assets/img/exercises/thumbnails/5.jpg',
    default_sets: 3,
    default_reps: 5,
    default_rest_time: 180,
    tags: ['compound', 'full_body', 'strength', 'powerlifting'],
    aliases: ['Conventional Deadlift', 'DL'],
    created_at: new Date(),
  }
];

/**
 * Fallback/placeholder media URLs for testing
 */
export const placeholderMedia = {
  gif: 'https://via.placeholder.com/400x300/333333/ffffff?text=Exercise+GIF',
  muscleDiagram: 'https://via.placeholder.com/300x400/444444/ffffff?text=Muscle+Diagram',
  thumbnail: 'https://via.placeholder.com/200x150/555555/ffffff?text=Thumbnail',
  video: 'https://via.placeholder.com/400x300/666666/ffffff?text=Video+Not+Available'
};

/**
 * Generate media URLs for exercises that don't have them
 */
export const generatePlaceholderMediaUrls = (exerciseId: string) => ({
  gif_url: `${placeholderMedia.gif}&id=${exerciseId}`,
  muscle_diagram_url: `${placeholderMedia.muscleDiagram}&id=${exerciseId}`,
  thumbnail_url: `${placeholderMedia.thumbnail}&id=${exerciseId}`,
  video_url: `${placeholderMedia.video}&id=${exerciseId}`
});