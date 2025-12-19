import { supabase } from './supabase';

export interface ChildPoints {
  id: string;
  child_id: string;
  points_balance: number;
  total_points_earned: number;
  free_days_available: number;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  child_id: string;
  points_amount: number;
  transaction_type: 'track_completion' | 'gallery_workout' | 'free_day_purchased';
  related_activity_id: string | null;
  description: string | null;
  created_at: string;
}

export interface FreeDayUsage {
  id: string;
  child_id: string;
  track_day_id: string;
  used_date: string;
  points_cost: number;
  created_at: string;
}

export async function getChildPoints(childId: string): Promise<ChildPoints> {
  let { data, error } = await supabase
    .from('child_points')
    .select('*')
    .eq('child_id', childId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching child points:', error);
    throw error;
  }

  if (!data) {
    const { data: newPoints, error: insertError } = await supabase
      .from('child_points')
      .insert({
        child_id: childId,
        points_balance: 0,
        total_points_earned: 0,
        free_days_available: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating child points:', insertError);
      throw insertError;
    }

    data = newPoints;
  }

  return data!;
}

export async function getPointTransactions(
  childId: string,
  limit: number = 50
): Promise<PointTransaction[]> {
  const { data, error } = await supabase
    .from('child_point_transactions')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching point transactions:', error);
    throw error;
  }

  return data || [];
}

export async function awardTrackCompletionPoints(
  childId: string,
  trackDayCompletionId: string
): Promise<void> {
  const { error } = await supabase.rpc('award_points_to_child', {
    p_child_id: childId,
    p_points: 10,
    p_transaction_type: 'track_completion',
    p_related_activity_id: trackDayCompletionId,
    p_description: 'השלמת אימון יומי במסלול',
  });

  if (error) {
    console.error('Error awarding track completion points:', error);
    throw error;
  }
}

export async function awardGalleryWorkoutPoint(
  childId: string,
  exerciseId: string
): Promise<void> {
  const { error } = await supabase.rpc('award_points_to_child', {
    p_child_id: childId,
    p_points: 1,
    p_transaction_type: 'gallery_workout',
    p_related_activity_id: exerciseId,
    p_description: 'השלמת תרגיל מהגלריה',
  });

  if (error) {
    console.error('Error awarding gallery workout point:', error);
    throw error;
  }
}

export async function useFreeDay(
  childId: string,
  trackDayId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('use_free_day', {
    p_child_id: childId,
    p_track_day_id: trackDayId,
  });

  if (error) {
    console.error('Error using free day:', error);
    throw error;
  }

  return data || false;
}

export async function checkFreeDayUsage(
  childId: string,
  trackDayId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('free_day_usage')
    .select('id')
    .eq('child_id', childId)
    .eq('track_day_id', trackDayId)
    .maybeSingle();

  if (error) {
    console.error('Error checking free day usage:', error);
    return false;
  }

  return !!data;
}

export async function getFreeDaysHistory(childId: string): Promise<FreeDayUsage[]> {
  const { data, error } = await supabase
    .from('free_day_usage')
    .select('*')
    .eq('child_id', childId)
    .order('used_date', { ascending: false });

  if (error) {
    console.error('Error fetching free days history:', error);
    throw error;
  }

  return data || [];
}
