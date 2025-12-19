import { supabase } from './supabase';

export interface TrainingTrack {
  id: string;
  name: string;
  name_he: string;
  description: string;
  description_he: string;
  difficulty_level: number;
  total_days: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TrackDay {
  id: string;
  track_id: string;
  day_number: number;
  title: string;
  title_he: string;
  description: string;
  description_he: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrackDayExerciseAssignment {
  id: string;
  track_day_id: string;
  exercise_id_text: string;
  exercise_order: number;
  duration_override: number | null;
  notes: string;
}

export interface UserTrackProgress {
  id: string;
  child_id: string;
  track_id: string;
  current_day: number;
  days_completed: number[];
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
}

export interface TrackDayCompletion {
  id: string;
  child_id: string;
  track_day_id: string;
  completed_at: string;
  total_duration_seconds: number;
  exercises_completed: number;
}

export interface TrackWithDays extends TrainingTrack {
  track_days: TrackDay[];
}

export interface UserProgressWithTrack extends UserTrackProgress {
  training_track: TrainingTrack;
}

// Get all active training tracks
export async function getActiveTrainingTracks(): Promise<TrainingTrack[]> {
  const { data, error } = await supabase
    .from('training_tracks')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Get a training track with all its days
export async function getTrackWithDays(trackId: string): Promise<TrackWithDays | null> {
  const { data, error } = await supabase
    .from('training_tracks')
    .select(`
      *,
      track_days (*)
    `)
    .eq('id', trackId)
    .single();

  if (error) throw error;
  return data;
}

// Get user's progress for a specific track
export async function getUserTrackProgress(
  childId: string,
  trackId: string
): Promise<UserTrackProgress | null> {
  const { data, error } = await supabase
    .from('user_track_progress')
    .select('*')
    .eq('child_id', childId)
    .eq('track_id', trackId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Get user's current active track progress
export async function getUserActiveTrackProgress(
  childId: string
): Promise<UserProgressWithTrack | null> {
  const { data, error } = await supabase
    .from('user_track_progress')
    .select(`
      *,
      training_track:training_tracks (*)
    `)
    .eq('child_id', childId)
    .is('completed_at', null)
    .order('last_activity_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Start a new track for user
export async function startTrack(
  childId: string,
  trackId: string
): Promise<UserTrackProgress> {
  const { data, error } = await supabase
    .from('user_track_progress')
    .insert({
      child_id: childId,
      track_id: trackId,
      current_day: 1,
      days_completed: [],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Complete a track day
export async function completeTrackDay(
  childId: string,
  trackDayId: string,
  totalDurationSeconds: number,
  exercisesCompleted: number
): Promise<{ success: boolean; completionId?: string }> {
  try {
    // Get track day info
    const { data: trackDay, error: trackDayError } = await supabase
      .from('track_days')
      .select('track_id, day_number, title_he')
      .eq('id', trackDayId)
      .single();

    if (trackDayError) throw trackDayError;

    // Record completion
    const { data: completion, error: completionError } = await supabase
      .from('track_day_completions')
      .insert({
        child_id: childId,
        track_day_id: trackDayId,
        total_duration_seconds: totalDurationSeconds,
        exercises_completed: exercisesCompleted,
      })
      .select()
      .single();

    if (completionError) throw completionError;

    // Update user progress
    const { data: progress, error: progressError } = await supabase
      .from('user_track_progress')
      .select('*')
      .eq('child_id', childId)
      .eq('track_id', trackDay.track_id)
      .single();

    if (progressError) throw progressError;

    const updatedDaysCompleted = [...(progress.days_completed || []), trackDay.day_number];
    const isTrackComplete = updatedDaysCompleted.length >= 30;

    const { error: updateError } = await supabase
      .from('user_track_progress')
      .update({
        current_day: trackDay.day_number + 1,
        days_completed: updatedDaysCompleted,
        last_activity_at: new Date().toISOString(),
        completed_at: isTrackComplete ? new Date().toISOString() : null,
      })
      .eq('id', progress.id);

    if (updateError) throw updateError;

    // Award 10 points for track completion
    try {
      const { awardTrackCompletionPoints } = await import('./pointsService');
      await awardTrackCompletionPoints(childId, completion.id);
    } catch (pointsError) {
      console.error('Error awarding points:', pointsError);
    }

    // Send notification to parent if child has parent
    try {
      const { data: child } = await supabase
        .from('children')
        .select('family_id, name, is_independent')
        .eq('id', childId)
        .single();

      if (child && !child.is_independent && child.family_id) {
        const { data: family } = await supabase
          .from('families')
          .select('parent_id')
          .eq('id', child.family_id)
          .single();

        if (family) {
          const { createParentNotification } = await import('./notificationService');
          await createParentNotification(
            family.parent_id,
            childId,
            'track_completed',
            'אימון הושלם!',
            `${child.name} השלים את יום ${trackDay.day_number} - ${trackDay.title_he}`,
            {
              day_number: trackDay.day_number,
              completion_id: completion.id,
              points_earned: 10,
            }
          );
        }
      }
    } catch (notifError) {
      console.error('Error sending parent notification:', notifError);
    }

    return { success: true, completionId: completion.id };
  } catch (error) {
    console.error('Error completing track day:', error);
    return { success: false };
  }
}

// Check if user can access a specific day
export async function canAccessTrackDay(
  childId: string,
  trackDayId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_access_track_day', {
    p_child_id: childId,
    p_track_day_id: trackDayId,
  });

  if (error) {
    console.error('Error checking track day access:', error);
    return false;
  }

  return data || false;
}

// Get exercises for a specific track day
export async function getTrackDayExercises(
  trackDayId: string
): Promise<TrackDayExerciseAssignment[]> {
  const { data, error } = await supabase
    .from('track_day_exercise_assignments')
    .select('*')
    .eq('track_day_id', trackDayId)
    .order('exercise_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

