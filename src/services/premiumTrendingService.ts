import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || import.meta.env.REACT_APP_YOUTUBE_API_KEY;

const QUALITY_THRESHOLDS = {
  MIN_DURATION: 180, // Minimum 3 minutes for "worthy" content
  MIN_VIEWS: 5000, 
  MIN_ENGAGEMENT_RATE: 0.015, // 1.5%
};

const CATEGORY_KEYWORDS: Record<string, string> = {
  'Education': 'high quality educational documentary essay explained deep dive',
  'Self-Improvement': 'personal growth psychology life advice productivity habits mindset',
  'Technology': 'software engineering future tech coding tutorials innovation silicon valley',
  'Science': 'physics biology space science veritasium kurzgesagt style research',
  'Productivity': 'deep work focus systems time management flow state second brain',
  'Health & Fitness': 'human biology health optimization longevity science nutrition biohacking',
  'Business': 'entrepreneurship startup case study business strategy venture capital',
  'Design': 'graphic design ui ux architecture industrial design creative process',
  'Philosophy': 'stoicism modern philosophy existentialism ethics wisdom',
  'Economics': 'global economy finance macroeconomics market analysis documentary',
  'Politics': 'political science geopolitics international relations documentary',
  'Content creation': 'storytelling videography filmmaking youtube growth strategy',
  'Startups': 'founder stories y combinator startup growth saas venture capital',
  'Public speaking': 'communication skills charisma storytelling rhetoric presentation',
  'Spirituality': 'mindfulness meditation consciousness spiritual growth wisdom',
  'Videography': 'cinematography filmmaking camera gear lighting tutorial editing'
};

export async function fetchPremiumTrendingVideos() {
  if (!YOUTUBE_API_KEY) return;

  try {
    const allVideos: any[] = [];
    const seenVideoIds = new Set<string>();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      // Dual search strategy: Relevance + ViewCount to ensure we get "the best" and "the most relevant"
      const searchOrders = ['relevance', 'viewCount'];
      const categoryVideos: any[] = [];

      for (const order of searchOrders) {
        const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            q: keywords,
            type: 'video',
            order: order,
            maxResults: 20, 
            publishedAfter: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
            key: YOUTUBE_API_KEY,
            relevanceLanguage: 'en',
            videoDuration: 'medium' 
          }
        });

        const videoIds = searchResponse.data?.items
          ?.map((i: any) => i.id.videoId)
          .filter((id: string) => id && !seenVideoIds.has(id))
          .join(',');

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

          // Initial strict quality filters
          const passStrict = duration >= QUALITY_THRESHOLDS.MIN_DURATION && 
                           viewCount >= QUALITY_THRESHOLDS.MIN_VIEWS && 
                           (viewCount > 0 ? (likeCount + commentCount) / viewCount : 0) >= QUALITY_THRESHOLDS.MIN_ENGAGEMENT_RATE;

          // Always keep if it passes strict, or if we have very few videos for this category, keep it as fallback
          if (!passStrict && categoryVideos.length >= 10) continue; 
          // Even as fallback, we need some minimums
          if (duration < 60 || viewCount < 1000) continue;

          const engagementRate = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;
          
          // Quality Score calculation
          const engagementScore = Math.min(engagementRate * 50, 1);
          const recencyScore = getRecencyScore(videoDetails.snippet.publishedAt);
          const viewScore = Math.min(viewCount / 1000000, 1);
          const qualityScore = (engagementScore * 0.45) + (recencyScore * 0.35) + (viewScore * 0.2);

          seenVideoIds.add(videoId);
          categoryVideos.push({
            video_id: videoId,
            title: videoDetails.snippet.title,
            description: videoDetails.snippet.description,
            channel_id: videoDetails.snippet.channelId,
            channel_name: videoDetails.snippet.channelTitle,
            channel_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${videoDetails.snippet.channelTitle.replace(/ /g, '_')}`,
            channel_subscriber_count: 50000,
            thumbnail_url: videoDetails.snippet.thumbnails.high.url,
            high_res_thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            video_url: `https://www.youtube.com/watch?v=${videoId}`,
            duration_seconds: duration,
            view_count: viewCount,
            like_count: likeCount,
            comment_count: commentCount,
            published_at: videoDetails.snippet.publishedAt,
            category: category,
            virality_score: (qualityScore * 8) + (Math.random() * 2),
            quality_score: qualityScore,
            engagement_rate: engagementRate,
            is_verified_channel: true,
            channel_authority_score: 0.5
          });
        }
      }
      allVideos.push(...categoryVideos);
    }

    // Upsert into Supabase
    if (allVideos.length > 0) {
      const chunkSize = 50;
      for (let i = 0; i < allVideos.length; i += chunkSize) {
        const chunk = allVideos.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('premium_trending_videos')
          .upsert(chunk, { onConflict: 'video_id' });
        if (error) console.error('Supabase upsert error:', error);
      }
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
  return Math.max(0, (180 - daysOld) / 180); 
}


