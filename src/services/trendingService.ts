import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || import.meta.env.REACT_APP_YOUTUBE_API_KEY;

const CATEGORY_QUERIES: Record<string, string> = {
  'Tech': 'latest software engineering tutorials technology news',
  'Productivity': 'productivity tips time management systems life hacks',
  'Startups': 'startup advice entrepreneurship business strategy silicon valley',
  'Self-improvement': 'personal development psychology self-help growth mindset',
  'Public speaking': 'public speaking tips communication skills oratory',
  'Philosophy': 'stoicism modern philosophy ethical living deep thought',
  'Business': 'business analysis market trends finance leadership',
  'Design': 'ui ux design principles product design tutorials',
  'Graphic design': 'graphic design tutorials typography layout design',
  'Economics': 'global economics market analysis economic theory',
  'Politics': 'political analysis global affairs current events',
  'Content creation': 'how to become a creator social media growth youtube strategy',
  'Videography': 'cinematography tutorials video editing tips camera gear',
  'Spirituality': 'mindfulness meditation spiritual growth inner peace'
};

export async function fetchTrendingVideos() {
  if (!YOUTUBE_API_KEY) {
    console.error('YouTube API Key missing');
    return;
  }

  try {
    const results: any[] = [];
    const categoriesToFetch = Object.keys(CATEGORY_QUERIES);
    
    for (const category of categoriesToFetch) {
      const query = CATEGORY_QUERIES[category];
      // Step 1: Search for high-view videos in the category
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          order: 'viewCount', // Better views
          maxResults: 8,
          publishedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days for better quality
          key: YOUTUBE_API_KEY,
          regionCode: 'US',
          videoEmbeddable: 'true'
        }
      });

      const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');
      
      if (!videoIds) continue;

      // Step 2: Get detailed statistics for these videos
      const statsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'statistics,contentDetails,snippet',
          id: videoIds,
          key: YOUTUBE_API_KEY
        }
      });

      for (const video of statsResponse.data.items) {
        const stats = video.statistics;
        const snippet = video.snippet;
        const duration = video.contentDetails.duration;

        const viewCount = parseInt(stats.viewCount) || 0;
        const likeCount = parseInt(stats.likeCount) || 0;
        const commentCount = parseInt(stats.commentCount) || 0;
        
        const engagementRate = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;
        
        const publishedDate = new Date(snippet.publishedAt);
        const daysOld = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
        const daysOldInverse = Math.max(0, (7 - daysOld) / 7);

        // Virality Score calculation
        const viralityScore = 
          (viewCount * 0.0001) + // Scaled down view count impact
          (engagementRate * 100 * 0.3) + 
          (daysOldInverse * 100 * 0.2);

        results.push({
          video_id: video.id,
          title: snippet.title,
          channel_name: snippet.channelTitle,
          thumbnail_url: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
          video_url: `https://www.youtube.com/watch?v=${video.id}`,
          duration: duration,
          view_count: viewCount,
          like_count: likeCount,
          comment_count: commentCount,
          published_at: snippet.publishedAt,
          category: category,
          virality_score: viralityScore,
          engagement_rate: engagementRate
        });
      }
    }

    // Upsert into Supabase
    if (results.length > 0) {
      const { error } = await supabase
        .from('trending_videos')
        .upsert(results, { onConflict: 'video_id' });
      
      if (error) throw error;
    }

    return results;
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    throw error;
  }
}

export async function getTrendingFromDB(category = 'All') {
  let query = supabase.from('trending_videos').select('*');
  if (category !== 'All') {
    query = query.eq('category', category);
  }
  const { data, error } = await query.order('virality_score', { ascending: false });
  return { data, error };
}

export async function logInteraction(userId: string, videoId: string, type: string) {
  return await supabase.from('trending_video_interactions').insert({
    user_id: userId,
    video_id: videoId,
    interaction_type: type
  });
}
