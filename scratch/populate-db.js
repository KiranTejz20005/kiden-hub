import axios from 'axios';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Read env file manually
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

if (!key || !supabaseUrl || !supabaseKey) {
  console.error("Missing config!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 3600) +
         (parseInt(match[2] || '0') * 60) +
         parseInt(match[3] || '0');
}

function calculateQualityScore(viewCount, likeCount, commentCount, subscriberCount, publishedAt) {
  const engagementRate = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;
  const daysOld = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24);

  const engagementScore = Math.min(engagementRate * 100 * 0.4, 40);
  const authorityScore  = Math.min((subscriberCount / 1_000_000), 1.0) * 35;
  const recencyScore    = Math.max(0, (30 - daysOld) / 30) * 25;

  return Math.round(engagementScore + authorityScore + recencyScore);
}

function calculateViralityScore(viewCount, likeCount, commentCount, publishedAt) {
  const daysOld = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24));
  const engagementRate = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;

  const viewVelocity     = (viewCount / daysOld / 1000) * 0.4;
  const engagementWeight = engagementRate * 100 * 0.35;
  const recency          = Math.max(0, (30 - daysOld) / 30) * 100 * 0.25;

  return Math.min(Math.round(viewVelocity + engagementWeight + recency), 100);
}

async function upsertCreator(channelData, subscriberCount) {
  const creatorPayload = {
    handle: channelData.id,
    name: channelData.snippet.title,
    profile_image_url: channelData.snippet.thumbnails?.default?.url || null,
    primary_platform: 'youtube',
    authority_score: Math.min(Math.round((subscriberCount / 1_000_000) * 100), 100),
    platform_accounts: { youtube: channelData.id },
    is_premium_creator: subscriberCount > 100_000,
    updated_at: new Date().toISOString(),
  };

  const existing = await supabase
    .from('creators')
    .select('id')
    .eq('handle', channelData.id)
    .eq('primary_platform', 'youtube')
    .maybeSingle();

  if (existing.data?.id) {
    await supabase.from('creators').update(creatorPayload).eq('id', existing.data.id);
    return existing.data.id;
  } else {
    const { data } = await supabase.from('creators').insert(creatorPayload).select('id').single();
    return data?.id || null;
  }
}

async function run() {
  const channelsData = JSON.parse(fs.readFileSync('scratch/channels-resolved.json', 'utf8'));
  console.log("Starting DB Populator...");

  for (const [category, channels] of Object.entries(channelsData)) {
    console.log(`\n========================================`);
    console.log(`Processing Category: ${category}`);
    
    // Process top 2 channels per category to avoid rate-limits and get a diverse set initially
    const channelsToProcess = channels.slice(0, 2);

    for (const channel of channelsToProcess) {
      console.log(`- Scraping ${channel.name} (${channel.id})...`);
      try {
        // 1. Get channel details
        const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: {
            part: 'snippet,statistics',
            id: channel.id,
            key: key
          }
        });
        const channelData = channelRes.data?.items?.[0];
        if (!channelData) {
          console.warn(`Channel ${channel.name} not found!`);
          continue;
        }

        const subscriberCount = parseInt(channelData.statistics?.subscriberCount || '0');
        const creatorId = await upsertCreator(channelData, subscriberCount);
        if (!creatorId) {
          console.error(`Failed to upsert creator for ${channel.name}`);
          continue;
        }

        // 2. Get latest upload videos
        const uploadsPlaylistId = channel.id.replace(/^UC/, 'UU');
        const playlistRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
          params: {
            part: 'snippet',
            playlistId: uploadsPlaylistId,
            maxResults: 6,
            key: key
          }
        });

        const videoIds = playlistRes.data.items?.map(i => i.snippet.resourceId.videoId).join(',');
        if (!videoIds) {
          console.log(`No videos found for channel ${channel.name}`);
          continue;
        }

        // 3. Get video stats
        const detailsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: {
            part: 'statistics,contentDetails,snippet',
            id: videoIds,
            key: key
          }
        });

        const contentToInsert = [];
        for (const video of detailsRes.data.items || []) {
          const videoId = video.id;
          const duration = parseDuration(video.contentDetails.duration);
          const viewCount = parseInt(video.statistics.viewCount || '0');
          const likeCount = parseInt(video.statistics.likeCount || '0');
          const commentCount = parseInt(video.statistics.commentCount || '0');
          const engagement = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;

          // Apply loose quality filters for our test population to ensure we get videos
          if (duration < 180) continue; // min 3 minutes
          if (viewCount < 5000) continue; // min 5k views

          const qualityScore = calculateQualityScore(viewCount, likeCount, commentCount, subscriberCount, video.snippet.publishedAt);
          const viralityScore = calculateViralityScore(viewCount, likeCount, commentCount, video.snippet.publishedAt);

          contentToInsert.push({
            content_type: 'video',
            external_id: videoId,
            source_platform: 'youtube',
            title: video.snippet.title,
            description: video.snippet.description?.slice(0, 500) || null,
            content_url: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnail_url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            preview_content: video.snippet.description?.slice(0, 500) || null,
            creator_id: creatorId,
            category: category,
            tags: video.snippet.tags?.slice(0, 10) || [],
            content_metadata: {
              video_id: videoId,
              duration_seconds: duration,
              view_count: viewCount,
              like_count: likeCount,
              comment_count: commentCount,
              published_at: video.snippet.publishedAt,
              channel_id: channel.id,
              channel_name: video.snippet.channelTitle,
              channel_avatar: channelData.snippet?.thumbnails?.default?.url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${channel.id}`,
              subscriber_count: subscriberCount,
              high_res_thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              video_url: `https://www.youtube.com/watch?v=${videoId}`,
            },
            quality_score: qualityScore,
            virality_score: viralityScore,
            engagement_rate: engagement,
            is_indexed: true,
            cached_at: new Date().toISOString(),
          });
        }

        if (contentToInsert.length > 0) {
          const { error } = await supabase
            .from('content_pieces')
            .upsert(contentToInsert, { onConflict: 'external_id,source_platform' });

          if (error) {
            console.error(`Upsert error for ${channel.name}:`, error.message);
          } else {
            console.log(`✅ Upserted ${contentToInsert.length} videos for ${channel.name}`);
          }
        } else {
          console.log(`No videos passed filters for ${channel.name}`);
        }
      } catch (err) {
        console.error(`❌ Failed scraping ${channel.name}:`, err.response?.data || err.message);
      }

      // throttle
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log("\nFinished populating database!");
}

run();
