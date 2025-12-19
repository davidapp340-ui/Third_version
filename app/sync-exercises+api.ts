/**
 * API Route: Sync Exercises from Google Sheets
 *
 * This endpoint fetches exercise data from the configured Google Sheets
 * and updates both the eye_exercises and exercises_gallery tables.
 *
 * Usage: POST /sync-exercises
 * Headers: Authorization: Bearer <ADMIN_SECRET>
 */

import { createClient } from '@supabase/supabase-js';
import { fetchExercisesData, type ExerciseSheetData } from '@/lib/exercisesDataSource';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    // Verify authorization (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || 'your-secret-key';

    if (authHeader !== `Bearer ${adminSecret}`) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch data from Google Sheets
    console.log('Fetching exercises data from Google Sheets...');
    const exercisesData = await fetchExercisesData();

    if (!exercisesData || exercisesData.length === 0) {
      return Response.json(
        { error: 'No data found in Google Sheets' },
        { status: 400 }
      );
    }

    console.log(`Found ${exercisesData.length} exercises to sync`);

    // Sync to database
    const results = {
      eyeExercises: { inserted: 0, updated: 0, errors: 0 },
      gallery: { inserted: 0, updated: 0, errors: 0 },
    };

    for (const exercise of exercisesData) {
      // 1. Upsert to eye_exercises table
      try {
        const { error: exerciseError } = await supabase
          .from('eye_exercises')
          .upsert({
            id: exercise.id,
            exercise_name: exercise.exercise_name,
            icon: exercise.icon || 'FALSE',
            description: exercise.description || '',
            media_type: exercise.media_type || 'Video',
            video_link: exercise.video_link || 'FALSE',
            audio_link: exercise.audio_link || 'FALSE',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id',
          });

        if (exerciseError) {
          console.error(`Error upserting exercise ${exercise.id}:`, exerciseError);
          results.eyeExercises.errors++;
        } else {
          results.eyeExercises.updated++;
        }
      } catch (err) {
        console.error(`Exception upserting exercise ${exercise.id}:`, err);
        results.eyeExercises.errors++;
      }

      // 2. Upsert to exercises_gallery table (if category and color are provided)
      if (exercise.category && exercise.color) {
        try {
          const { error: galleryError } = await supabase
            .from('exercises_gallery')
            .upsert({
              id: exercise.id,
              category: exercise.category,
              color: exercise.color,
              display: exercise.display !== undefined ? exercise.display : true,
              display_order: exercise.display_order || null,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id',
            });

          if (galleryError) {
            console.error(`Error upserting gallery ${exercise.id}:`, galleryError);
            results.gallery.errors++;
          } else {
            results.gallery.updated++;
          }
        } catch (err) {
          console.error(`Exception upserting gallery ${exercise.id}:`, err);
          results.gallery.errors++;
        }
      }
    }

    return Response.json({
      success: true,
      message: 'Exercises synced successfully',
      results,
      totalProcessed: exercisesData.length,
    });
  } catch (error) {
    console.error('Error syncing exercises:', error);
    return Response.json(
      {
        error: 'Failed to sync exercises',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return Response.json({
    message: 'Exercises Sync API',
    usage: 'POST /sync-exercises with Authorization header',
    dataSource: 'Google Sheets',
    note: 'This endpoint syncs exercise data from Google Sheets to the database',
  });
}
