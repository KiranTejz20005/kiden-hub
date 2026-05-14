import { supabase } from '@/integrations/supabase/client';

export type ActivityAction = 
  | 'upload' 
  | 'update_profile' 
  | 'update_settings'
  | 'add_to_library' 
  | 'follow_creator' 
  | 'create_note' 
  | 'delete_file'
  | 'summarize_file'
  | 'sync_storage';

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: ActivityAction;
  target_name: string;
  target_type: string;
  metadata: any;
  created_at: string;
}

export async function logActivity(
  userId: string, 
  action: ActivityAction, 
  targetName: string, 
  targetType: string,
  metadata: any = {}
) {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action_type: action,
        target_name: targetName,
        target_type: targetType,
        metadata
      });

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

export async function fetchRecentActivities(userId: string, limit = 10): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }

  return data || [];
}
