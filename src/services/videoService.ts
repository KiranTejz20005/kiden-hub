import { supabase } from "@/integrations/supabase/client";

// Add video to library
export async function addVideoToLibrary(userId: string, videoData: any) {
  // Map fields robustly to support both snake_case, camelCase, and various component/API formats
  const videoId = videoData.video_id || videoData.videoId || videoData.id || videoData.external_id;
  const title = videoData.title;
  const channelName = videoData.channel_name || videoData.channelName || videoData.channelTitle || videoData.channel_title || 'Unknown Channel';
  const channelAvatar = videoData.channel_avatar || videoData.channelAvatar || videoData.channel_profile_img || '';
  const thumbnailUrl = videoData.thumbnail_url || videoData.thumbnailUrl || videoData.high_res_thumbnail || '';
  const videoUrl = videoData.video_url || videoData.videoUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '');
  const publishedAt = videoData.published_at || videoData.publishedAt || videoData.publishedTime || new Date().toISOString();
  const duration = Number(videoData.duration_seconds || videoData.durationSeconds || videoData.duration || 0);
  const viewCount = Number(videoData.view_count || videoData.viewCount || videoData.views || 0);

  const { data, error } = await supabase
    .from('user_study_videos')
    .insert({
      user_id: userId,
      video_id: videoId,
      title: title,
      channel_name: channelName,
      channel_avatar: channelAvatar,
      thumbnail_url: thumbnailUrl,
      video_url: videoUrl,
      published_at: publishedAt,
      duration: duration,
      view_count: viewCount,
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
