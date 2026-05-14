import { supabase } from "@/integrations/supabase/client";

// Add video to library
export async function addVideoToLibrary(userId: string, videoData: any) {
  const { data, error } = await supabase
    .from('user_study_videos')
    .insert({
      user_id: userId,
      video_id: videoData.id,
      title: videoData.title,
      channel_name: videoData.channel,
      thumbnail_url: videoData.thumbnail,
      video_url: videoData.url,
      duration: videoData.duration,
      view_count: videoData.views,
      position: (await getMaxPosition(userId)) + 1
    })
    .select()
    .single();
  return { data, error };
}

// Batch update positions
export async function batchUpdatePositions(updates: { id: string; position: number }[]) {
  const { error } = await supabase.rpc('batch_update_video_positions', {
    updates: updates
  });
  return { error };
}

// Get user's saved videos
export async function getUserVideos(userId: string) {
  const { data, error } = await supabase
    .from('user_study_videos')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true });
  return { data, error };
}

// Update video position (for drag-and-drop)
export async function updateVideoPosition(videoId: string, newPosition: number) {
  const { data, error } = await supabase
    .from('user_study_videos')
    .update({ position: newPosition })
    .eq('id', videoId);
  return { data, error };
}

// Update subject tag
export async function updateVideoTag(videoId: string, tag: string) {
  const { data, error } = await supabase
    .from('user_study_videos')
    .update({ subject_tag: tag })
    .eq('id', videoId);
  return { data, error };
}

// Delete video from library
export async function deleteVideo(videoId: string) {
  const { data, error } = await supabase
    .from('user_study_videos')
    .delete()
    .eq('id', videoId);
  return { data, error };
}

// Check if video already in library
export async function isVideoInLibrary(userId: string, videoId: string) {
  const { data, error } = await supabase
    .from('user_study_videos')
    .select('id')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .maybeSingle();
  return !!data;
}

// Helper: Get max position for new videos
async function getMaxPosition(userId: string) {
  const { data } = await supabase
    .from('user_study_videos')
    .select('position')
    .eq('user_id', userId)
    .order('position', { ascending: false })
    .limit(1);
  return data?.[0]?.position ?? 0;
}

// Toggle favorite status
export async function toggleFavorite(videoId: string, isFavorite: boolean) {
  const { data, error } = await supabase
    .from('user_study_videos')
    .update({ is_favorite: isFavorite })
    .eq('id', videoId);
  return { data, error };
}

// Update personal notes
export async function updateNotes(videoId: string, notes: string) {
  const { data, error } = await supabase
    .from('user_study_videos')
    .update({ personal_notes: notes })
    .eq('id', videoId);
  return { data, error };
}
