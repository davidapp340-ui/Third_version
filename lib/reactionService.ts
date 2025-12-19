import { supabase } from './supabase';
import { createChildNotification } from './notificationService';

export interface ParentReaction {
  id: string;
  parent_id: string;
  child_id: string;
  track_day_completion_id: string;
  reaction_type: 'smiley' | 'like' | 'well_done';
  message: string | null;
  created_at: string;
}

export async function createParentReaction(
  parentId: string,
  childId: string,
  trackDayCompletionId: string,
  reactionType: 'smiley' | 'like' | 'well_done',
  message?: string
): Promise<ParentReaction> {
  const { data, error } = await supabase
    .from('parent_reactions')
    .insert({
      parent_id: parentId,
      child_id: childId,
      track_day_completion_id: trackDayCompletionId,
      reaction_type: reactionType,
      message,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating parent reaction:', error);
    throw error;
  }

  const reactionMessages = {
    smiley: '😊 ההורה שלך שלח לך חיוך!',
    like: '👍 ההורה שלך נתן לייק!',
    well_done: '🌟 ההורה שלך אומר כל הכבוד!',
  };

  const title = reactionMessages[reactionType];
  const fullMessage = message
    ? `${reactionMessages[reactionType]}\nהודעה: ${message}`
    : reactionMessages[reactionType];

  await createChildNotification(
    childId,
    'parent_reaction',
    title,
    fullMessage,
    { reaction_type: reactionType, reaction_id: data.id }
  );

  return data;
}

export async function getReactionsForCompletion(
  trackDayCompletionId: string
): Promise<ParentReaction[]> {
  const { data, error } = await supabase
    .from('parent_reactions')
    .select('*')
    .eq('track_day_completion_id', trackDayCompletionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reactions for completion:', error);
    throw error;
  }

  return data || [];
}

export async function getReactionsForChild(
  childId: string,
  limit: number = 50
): Promise<ParentReaction[]> {
  const { data, error } = await supabase
    .from('parent_reactions')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching reactions for child:', error);
    throw error;
  }

  return data || [];
}

export async function checkIfParentReacted(
  parentId: string,
  trackDayCompletionId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('parent_reactions')
    .select('id')
    .eq('parent_id', parentId)
    .eq('track_day_completion_id', trackDayCompletionId)
    .maybeSingle();

  if (error) {
    console.error('Error checking parent reaction:', error);
    return false;
  }

  return !!data;
}
