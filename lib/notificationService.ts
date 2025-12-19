import { supabase } from './supabase';

export interface ParentNotification {
  id: string;
  parent_id: string;
  child_id: string;
  notification_type: 'track_completed' | 'milestone_reached';
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ChildNotification {
  id: string;
  child_id: string;
  notification_type: 'parent_reaction' | 'milestone_reached' | 'free_day_available';
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export async function getParentNotifications(
  parentId: string,
  unreadOnly: boolean = false
): Promise<ParentNotification[]> {
  let query = supabase
    .from('parent_notifications')
    .select('*')
    .eq('parent_id', parentId);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching parent notifications:', error);
    throw error;
  }

  return data || [];
}

export async function getChildNotifications(
  childId: string,
  unreadOnly: boolean = false
): Promise<ChildNotification[]> {
  let query = supabase
    .from('child_notifications')
    .select('*')
    .eq('child_id', childId);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching child notifications:', error);
    throw error;
  }

  return data || [];
}

export async function createParentNotification(
  parentId: string,
  childId: string,
  notificationType: 'track_completed' | 'milestone_reached',
  title: string,
  message: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  const { error } = await supabase.from('parent_notifications').insert({
    parent_id: parentId,
    child_id: childId,
    notification_type: notificationType,
    title,
    message,
    metadata,
  });

  if (error) {
    console.error('Error creating parent notification:', error);
    throw error;
  }
}

export async function createChildNotification(
  childId: string,
  notificationType: 'parent_reaction' | 'milestone_reached' | 'free_day_available',
  title: string,
  message: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  const { error } = await supabase.from('child_notifications').insert({
    child_id: childId,
    notification_type: notificationType,
    title,
    message,
    metadata,
  });

  if (error) {
    console.error('Error creating child notification:', error);
    throw error;
  }
}

export async function markParentNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('parent_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking parent notification as read:', error);
    throw error;
  }
}

export async function markChildNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('child_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking child notification as read:', error);
    throw error;
  }
}

export async function markAllParentNotificationsAsRead(parentId: string): Promise<void> {
  const { error } = await supabase
    .from('parent_notifications')
    .update({ is_read: true })
    .eq('parent_id', parentId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all parent notifications as read:', error);
    throw error;
  }
}

export async function markAllChildNotificationsAsRead(childId: string): Promise<void> {
  const { error } = await supabase
    .from('child_notifications')
    .update({ is_read: true })
    .eq('child_id', childId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all child notifications as read:', error);
    throw error;
  }
}

export async function getUnreadParentNotificationCount(parentId: string): Promise<number> {
  const { count, error } = await supabase
    .from('parent_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', parentId)
    .eq('is_read', false);

  if (error) {
    console.error('Error getting unread parent notification count:', error);
    return 0;
  }

  return count || 0;
}

export async function getUnreadChildNotificationCount(childId: string): Promise<number> {
  const { count, error } = await supabase
    .from('child_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('child_id', childId)
    .eq('is_read', false);

  if (error) {
    console.error('Error getting unread child notification count:', error);
    return 0;
  }

  return count || 0;
}
