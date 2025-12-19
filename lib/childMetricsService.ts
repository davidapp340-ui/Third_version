import { supabase } from './supabase';

export interface VisualAcuityLog {
  id: string;
  child_id: string;
  rating: number;
  notes: string;
  logged_at: string;
}

export interface EyeFatigueLog {
  id: string;
  child_id: string;
  fatigue_level: number;
  logged_at: string;
}

export interface ChildGoal {
  id: string;
  child_id: string;
  goal_type: 'daily' | 'weekly';
  target_exercises: number;
  target_minutes: number;
  set_by_parent_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Encouragement {
  id: string;
  child_id: string;
  parent_id: string;
  message: string;
  sent_at: string;
  read_at: string | null;
}

export interface PracticeMetrics {
  totalPracticeDays: number;
  consecutiveDays: number;
  exercisesThisWeek: number;
  totalMinutesThisWeek: number;
  recentCompletions: {
    date: string;
    exercises_completed: number;
    total_duration_seconds: number;
  }[];
}

export async function getChildVisualAcuityLogs(childId: string, days: number = 30): Promise<VisualAcuityLog[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from('child_visual_acuity_logs')
    .select('*')
    .eq('child_id', childId)
    .gte('logged_at', cutoffDate.toISOString())
    .order('logged_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getChildEyeFatigueLogs(childId: string, days: number = 30): Promise<EyeFatigueLog[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from('child_eye_fatigue_logs')
    .select('*')
    .eq('child_id', childId)
    .gte('logged_at', cutoffDate.toISOString())
    .order('logged_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getChildPracticeMetrics(childId: string): Promise<PracticeMetrics> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data: completions, error } = await supabase
    .from('track_day_completions')
    .select('completed_at, exercises_completed, total_duration_seconds')
    .eq('child_id', childId)
    .order('completed_at', { ascending: false });

  if (error) throw error;

  const completionsData = completions || [];

  const uniqueDates = new Set(
    completionsData.map((c) => new Date(c.completed_at).toDateString())
  );
  const totalPracticeDays = uniqueDates.size;

  let consecutiveDays = 0;
  const today = new Date().toDateString();
  const sortedDates = Array.from(uniqueDates).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - i);
    if (sortedDates[i] === expectedDate.toDateString()) {
      consecutiveDays++;
    } else {
      break;
    }
  }

  const weekCompletions = completionsData.filter(
    (c) => new Date(c.completed_at) >= oneWeekAgo
  );

  const exercisesThisWeek = weekCompletions.reduce(
    (sum, c) => sum + c.exercises_completed,
    0
  );
  const totalMinutesThisWeek = Math.floor(
    weekCompletions.reduce((sum, c) => sum + c.total_duration_seconds, 0) / 60
  );

  const recentCompletions = completionsData.slice(0, 10).map((c) => ({
    date: c.completed_at,
    exercises_completed: c.exercises_completed,
    total_duration_seconds: c.total_duration_seconds,
  }));

  return {
    totalPracticeDays,
    consecutiveDays,
    exercisesThisWeek,
    totalMinutesThisWeek,
    recentCompletions,
  };
}

export async function getChildGoals(childId: string): Promise<ChildGoal[]> {
  const { data, error } = await supabase
    .from('child_goals')
    .select('*')
    .eq('child_id', childId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function setChildGoal(
  childId: string,
  parentId: string,
  goalType: 'daily' | 'weekly',
  targetExercises: number,
  targetMinutes: number
): Promise<ChildGoal> {
  await supabase
    .from('child_goals')
    .update({ is_active: false })
    .eq('child_id', childId)
    .eq('goal_type', goalType)
    .eq('is_active', true);

  const { data, error } = await supabase
    .from('child_goals')
    .insert({
      child_id: childId,
      goal_type: goalType,
      target_exercises: targetExercises,
      target_minutes: targetMinutes,
      set_by_parent_id: parentId,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function sendEncouragement(
  childId: string,
  parentId: string,
  message: string
): Promise<Encouragement> {
  const { data, error } = await supabase
    .from('parent_encouragements')
    .insert({
      child_id: childId,
      parent_id: parentId,
      message,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getChildEncouragements(childId: string, limit: number = 5): Promise<Encouragement[]> {
  const { data, error } = await supabase
    .from('parent_encouragements')
    .select('*')
    .eq('child_id', childId)
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
