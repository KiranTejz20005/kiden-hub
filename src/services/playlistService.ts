import { supabase } from "@/integrations/supabase/client";

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  video_id: string;
  position: number;
  added_at: string;
}

export async function getPlaylists(userId: string) {
  return await supabase
    .from('user_playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export async function createPlaylist(userId: string, name: string, description?: string) {
  return await supabase
    .from('user_playlists')
    .insert({ user_id: userId, name, description })
    .select()
    .single();
}

export async function updatePlaylist(id: string, updates: Partial<Playlist>) {
  return await supabase
    .from('user_playlists')
    .update(updates)
    .eq('id', id);
}

export async function deletePlaylist(id: string) {
  return await supabase
    .from('user_playlists')
    .delete()
    .eq('id', id);
}

export async function addVideoToPlaylist(playlistId: string, videoId: string) {
  // Get current max position
  const { data: items } = await supabase
    .from('playlist_items')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1);
  
  const nextPos = (items?.[0]?.position ?? -1) + 1;

  return await supabase
    .from('playlist_items')
    .insert({
      playlist_id: playlistId,
      video_id: videoId,
      position: nextPos
    });
}

export async function removeVideoFromPlaylist(playlistId: string, videoId: string) {
  return await supabase
    .from('playlist_items')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('video_id', videoId);
}

export async function getPlaylistVideos(playlistId: string) {
  return await supabase
    .from('playlist_items')
    .select(`
      id,
      position,
      user_study_videos (*)
    `)
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });
}
