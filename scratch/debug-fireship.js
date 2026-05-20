import axios from 'axios';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const key = env.VITE_YOUTUBE_API_KEY;
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 3600) +
         (parseInt(match[2] || '0') * 60) +
         parseInt(match[3] || '0');
}

async function run() {
  const channel = { name: 'Fireship', id: 'UCsBjURrPoezykLs9EqgamOA' };
  try {
    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet,statistics', id: channel.id, key }
    });
    const channelData = channelRes.data.items[0];
    const subscriberCount = parseInt(channelData.statistics.subscriberCount);

    const creatorPayload = {
      handle: channel.id,
      name: channelData.snippet.title,
      profile_image_url: channelData.snippet.thumbnails?.default?.url || null,
      primary_platform: 'youtube',
      authority_score: Math.min(Math.round((subscriberCount / 1_000_000) * 100), 100),
      platform_accounts: { youtube: channel.id },
      is_premium_creator: subscriberCount > 100_000,
      updated_at: new Date().toISOString(),
    };

    const creatorRes = await supabase.from('creators').upsert(creatorPayload, { onConflict: 'handle,primary_platform' }).select('id').single();
    const creatorId = creatorRes.data.id;
    console.log("Creator ID:", creatorId);

    const playlistRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
      params: { part: 'snippet', playlistId: 'UUsBjURrPoezykLs9EqgamOA', maxResults: 5, key }
    });

    const videoIds = playlistRes.data.items.map(i => i.snippet.resourceId.videoId).join(',');
    const detailsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: { part: 'statistics,contentDetails,snippet', id: videoIds, key }
    });

    const safeSlice = (str, len) => {
      if (!str) return null;
      return Array.from(str).slice(0, len).join('');
    };

    for (const video of detailsRes.data.items) {
      console.log(`\nTesting video: ${video.snippet.title} (${video.id})`);
      const videoId = video.id;
      const duration = parseDuration(video.contentDetails.duration);
      
      const payload = {
        content_type: 'video',
        external_id: videoId,
        source_platform: 'youtube',
        title: video.snippet.title,
        description: safeSlice(video.snippet.description, 500),
        content_url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail_url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        preview_content: safeSlice(video.snippet.description, 500),
        creator_id: creatorId,
        category: 'Technology',
        tags: video.snippet.tags?.slice(0, 10) || [],
        content_metadata: {
          video_id: videoId,
          duration_seconds: duration,
          view_count: parseInt(video.statistics.viewCount || '0'),
          like_count: parseInt(video.statistics.likeCount || '0'),
          comment_count: parseInt(video.statistics.commentCount || '0'),
          published_at: video.snippet.publishedAt,
          channel_id: channel.id,
          channel_name: video.snippet.channelTitle,
          channel_avatar: channelData.snippet?.thumbnails?.default?.url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${channel.id}`,
          subscriber_count: subscriberCount,
          high_res_thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          video_url: `https://www.youtube.com/watch?v=${videoId}`,
        },
        quality_score: 90,
        virality_score: 85,
        engagement_rate: 0.05,
        is_indexed: true,
        cached_at: new Date().toISOString(),
      };

      console.log("Upserting full payload...");
      const { error } = await supabase.from('content_pieces').upsert(payload, { onConflict: 'external_id,source_platform' });
      if (error) {
        console.error("Full payload error:", error.message);
      } else {
        console.log("Full payload OK");
      }
    }
  } catch (err) {
    console.error("Top-level error:", err.message);
  }
}

run();
