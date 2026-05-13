import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || import.meta.env.REACT_APP_YOUTUBE_API_KEY;

const QUALITY_THRESHOLDS = {
  MIN_DURATION: 60, // Reduced to 1 minute
  MIN_VIEWS: 20000, // Reduced to 20K for broader discovery
  MIN_ENGAGEMENT_RATE: 0.02, // 2%
  MIN_CHANNEL_SUBSCRIBERS: 50000,
};

const CATEGORY_KEYWORDS: Record<string, string> = {
  'Education': 'high quality educational documentary explained',
  'Self-Improvement': 'personal growth psychology life advice productivity',
  'Technology': 'software engineering future tech coding tutorials',
  'Science': 'physics biology space science veritasium style',
  'Productivity': 'deep work focus systems time management',
  'Health & Fitness': 'human biology health optimization longevity science'
};

export async function fetchPremiumTrendingVideos() {
  if (!YOUTUBE_API_KEY) return;

  try {
    const allVideos: any[] = [];

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      // Search for high-quality videos in this category
      const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: keywords,
          type: 'video',
          order: 'viewCount',
          maxResults: 15,
          publishedAfter: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          key: YOUTUBE_API_KEY,
          relevanceLanguage: 'en',
          videoDuration: 'medium' // 4-20 minutes
        }
      });

      const videoIds = searchResponse.data?.items?.map((i: any) => i.id.videoId).filter(Boolean).join(',');
      if (!videoIds) continue;

      // Get detailed stats
      const detailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: { part: 'statistics,contentDetails,snippet', id: videoIds, key: YOUTUBE_API_KEY }
      });

      for (const videoDetails of detailsResponse.data.items) {
        const videoId = videoDetails.id;
        const stats = videoDetails.statistics;
        const duration = parseDuration(videoDetails.contentDetails.duration);
        const viewCount = parseInt(stats.viewCount || '0');
        const likeCount = parseInt(stats.likeCount || '0');
        const commentCount = parseInt(stats.commentCount || '0');

        // Relaxed filters for guaranteed content
        if (duration < 60) continue; 
        if (viewCount < 5000) continue;

        const engagementRate = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;
        
        // Quality Score calculation
        const engagementScore = Math.min(engagementRate * 100, 1);
        const recencyScore = getRecencyScore(videoDetails.snippet.publishedAt);
        const qualityScore = (engagementScore * 0.6) + (recencyScore * 0.4);

        allVideos.push({
          video_id: videoId,
          title: videoDetails.snippet.title,
          description: videoDetails.snippet.description,
          channel_id: videoDetails.snippet.channelId,
          channel_name: videoDetails.snippet.channelTitle,
          channel_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${videoDetails.snippet.channelTitle}`,
          channel_subscriber_count: 50000, // Placeholder
          thumbnail_url: videoDetails.snippet.thumbnails.high.url,
          high_res_thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          video_url: `https://www.youtube.com/watch?v=${videoId}`,
          duration_seconds: duration,
          view_count: viewCount,
          like_count: likeCount,
          comment_count: commentCount,
          published_at: videoDetails.snippet.publishedAt,
          category: category,
          virality_score: qualityScore * 10,
          quality_score: qualityScore,
          engagement_rate: engagementRate,
          is_verified_channel: true,
          channel_authority_score: 0.5
        });
      }
    }

    // Upsert into Supabase
    if (allVideos.length > 0) {
      const { error } = await supabase
        .from('premium_trending_videos')
        .upsert(allVideos, { onConflict: 'video_id' });
      if (error) throw error;
    }

    return allVideos;
  } catch (error) {
    console.error('Error fetching premium videos:', error);
    throw error;
  }
}

function parseDuration(duration: string) {
  const regex = /PT(\d+H)?(\d+M)?(\d+S)?/;
  const matches = duration.match(regex);
  if (!matches) return 0;
  const hours = parseInt(matches[1]?.replace('H', '') || '0');
  const minutes = parseInt(matches[2]?.replace('M', '') || '0');
  const seconds = parseInt(matches[3]?.replace('S', '') || '0');
  return hours * 3600 + minutes * 60 + seconds;
}

function getRecencyScore(publishedDate: string) {
  const daysOld = (Date.now() - new Date(publishedDate).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, (30 - daysOld) / 30);
}
