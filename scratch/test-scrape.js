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
const supabase = createClient(supabaseUrl, supabaseKey);

async function ytRequest(action, params) {
  const url = `https://www.googleapis.com/youtube/v3/${action}`;
  return await axios.get(url, { params: { ...params, key } });
}

function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 3600) +
         (parseInt(match[2] || '0') * 60) +
         parseInt(match[3] || '0');
}

const QUALITY_THRESHOLDS = {
  MIN_DURATION_SECONDS: 600,     // 10 minutes
  MIN_VIEWS: 50_000,
  MIN_ENGAGEMENT_RATE: 0.02,
};

async function testScrapeChannel(channel, category) {
  console.log(`\n----------------------------------------`);
  console.log(`Scraping channel: ${channel.name} (${channel.id})`);
  try {
    // 1. Get channel
    const channelRes = await ytRequest('channels', { 
      part: 'snippet,statistics', 
      id: channel.id 
    });
    const channelData = channelRes?.data?.items?.[0];
    if (!channelData) {
      console.log(`❌ Channel not found: ${channel.name}`);
      return;
    }
    const subscriberCount = parseInt(channelData.statistics?.subscriberCount || '0');
    console.log(`Subscribers: ${subscriberCount}`);

    // 2. Get playlistItems
    const uploadsPlaylistId = channel.id.replace(/^UC/, 'UU');
    const playlistRes = await ytRequest('playlistItems', {
      part: 'snippet',
      playlistId: uploadsPlaylistId,
      maxResults: 10,
    });

    const videoIds = playlistRes.data.items?.map(i => i.snippet.resourceId.videoId).join(',');
    if (!videoIds) {
      console.log(`❌ No videos found in playlist for: ${channel.name}`);
      return;
    }

    // 3. Get video details
    const detailsRes = await ytRequest('videos', { 
      part: 'statistics,contentDetails,snippet', 
      id: videoIds 
    });

    console.log(`Found ${detailsRes.data.items?.length || 0} videos to inspect:`);
    for (const video of detailsRes.data.items || []) {
      const videoId     = video.id;
      const duration    = parseDuration(video.contentDetails.duration);
      const viewCount   = parseInt(video.statistics.viewCount || '0');
      const likeCount   = parseInt(video.statistics.likeCount || '0');
      const commentCount = parseInt(video.statistics.commentCount || '0');
      const engagement  = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;
      const title = video.snippet.title;

      const durationPass = duration >= QUALITY_THRESHOLDS.MIN_DURATION_SECONDS;
      const viewsPass = viewCount >= QUALITY_THRESHOLDS.MIN_VIEWS;
      const engagementPass = engagement >= QUALITY_THRESHOLDS.MIN_ENGAGEMENT_RATE;

      console.log(`  - Video: "${title.slice(0, 40)}..."`);
      console.log(`    Duration: ${duration}s (${durationPass ? 'PASS' : 'FAIL - min 600s'})`);
      console.log(`    Views: ${viewCount} (${viewsPass ? 'PASS' : 'FAIL - min 50k'})`);
      console.log(`    Engagement: ${(engagement*100).toFixed(2)}% (${engagementPass ? 'PASS' : 'FAIL - min 2%'})`);
    }
  } catch (err) {
    console.error(`❌ Error scraping ${channel.name}:`, err.response?.data || err.message);
  }
}

async function run() {
  // Test a few channels that succeeded and some that didn't
  await testScrapeChannel({ name: 'Kurzgesagt', id: 'UCsXVk37bltHxD1rDPwtNM8Q' }, 'Education');
  await testScrapeChannel({ name: '3Blue1Brown', id: 'UCYO_jab_esuFRV4b0ie8YAY' }, 'Education');
  await testScrapeChannel({ name: 'Theo - t3.gg', id: 'UCbRP3rAa5TM3AhHJz1mPBHg' }, 'Technology');
  await testScrapeChannel({ name: 'Primeagen', id: 'UC8ENHE5xdFSwx71u3fDH5Xw' }, 'Technology');
}

run();
