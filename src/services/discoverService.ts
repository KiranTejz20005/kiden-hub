import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

// ── PREMIUM CHANNELS (50+ across 10 categories) ─────────────────────────────
export const PREMIUM_CHANNELS: Record<string, Array<{ name: string; id: string }>> = {
  'Education': [
    { name: 'Kurzgesagt', id: 'UCsXVk37bltHxD1rDPwtNM8Q' },
    { name: 'TED-Ed', id: 'UCsooa4yRKGN_zEE8iknghZA' },
    { name: '3Blue1Brown', id: 'UCYO_jab_esuFRV4b0ie8YAY' },
    { name: 'Veritasium', id: 'UCivA7_KLKWo43tFcCkFvydw' },
    { name: 'Vsauce', id: 'UCHnyfMX8lOD_EWGrG4V2zDQ' },
    { name: 'CrashCourse', id: 'UCX6b17PVsYBQ0ip5gyeme-Q' },
    { name: 'Wendover Productions', id: 'UC9RM-iSzvit8LxrmjcFundA' },
  ],
  'Technology': [
    { name: 'Fireship', id: 'UCsBjURrPoezykLs9EqgamOA' },
    { name: 'Theo - t3.gg', id: 'UCbRP3rAa5TM3AhHJz1mPBHg' },
    { name: 'ByteByteGo', id: 'UCZgt6AkMdfo-YjEVp-oUD_w' },
    { name: 'Hussein Nasser', id: 'UC_ML5xP23TOWKUcc-oAE_Eg' },
    { name: 'Primeagen', id: 'UC8ENHE5xdFSwx71u3fDH5Xw' },
    { name: 'Traversy Media', id: 'UC29ju8bIPH5as8OGnQzwJyA' },
    { name: 'Jack Herrington', id: 'UC6vRUjYqDuoUsYsku86Lrsw' },
  ],
  'Productivity': [
    { name: 'Ali Abdaal', id: 'UCoOae5nYA7VqaXzerajD0lg' },
    { name: 'Thomas Frank', id: 'UCG-KntY7aVnIGXYEBQvmBAQ' },
    { name: 'Matt D\'Avella', id: 'UCJ24N4O0bP7LGLBDvye7oCA' },
    { name: 'Mike and Matty', id: 'UCLBcgzKaEFBkWdWqfPgCXbw' },
    { name: 'Tiago Forte', id: 'UCbGBi9PZ6c6YdQCQqLlE8ZA' },
    { name: 'Keep Productive', id: 'UCYyaQsm2HyneP9CsIOdihBw' },
  ],
  'Self-Improvement': [
    { name: 'Andrew Huberman', id: 'UC2D2CMWXMOVWx7giW1n3LIg' },
    { name: 'Lex Fridman', id: 'UCSHZKyawb77ixDdsGog4iWA' },
    { name: 'Jordan Peterson', id: 'UCL_f53ZEJxp8TtlOkHwMV9Q' },
    { name: 'Mark Manson', id: 'UCcpjOp15f8BM-dUn8mmMtRg' },
    { name: 'Improvement Pill', id: 'UCBcRF18a7Qf58cCRy5xuWwQ' },
    { name: 'Better Ideas', id: 'UCtUId5WEqFektp9sq5Y51CQ' },
  ],
  'Science': [
    { name: 'Mark Rober', id: 'UCY1kMZp36IQSyNx_9h4mpCg' },
    { name: 'Real Engineering', id: 'UCR1IuLEqb6UEA_zQ81kwXfg' },
    { name: 'PBS Space Time', id: 'UC7_gcs09iThXybpVgjHZ_7g' },
    { name: 'SciShow', id: 'UCZYTClx2T1of7BRZ86-8fow' },
  ],
  'Business': [
    { name: 'Y Combinator', id: 'UCcefcZRL2oaA_uBNeo5UNqg' },
    { name: 'Patrick Boyle', id: 'UCVEBbAk6Fo2eF-CxJFiXkPg' },
    { name: 'Plain Bagel', id: 'UCFCEuCsyWP0YkP3CZ3Mr01Q' },
    { name: 'Garry Tan', id: 'UCIBgYfDjtWlbJhg--Z4sOgQ' },
    { name: 'How Money Works', id: 'UC4YHpECrPv6YP8-fJX-FMzA' },
    { name: 'Slidebean', id: 'UCWwqnq8zNKrquJH1JrKSX5w' },
  ],
  'Design': [
    { name: 'Flux Academy', id: 'UCN7dywl5wDxTu1RM3eJ_h9Q' },
    { name: 'Jesse Showalter', id: 'UCvBGFeXbBrq3W9_0oNLJREQ' },
    { name: 'The Futur', id: 'UCB_4blHFJQP7IInr45Pd_8w' },
    { name: 'DesignCourse', id: 'UCVyRiMvfUNMA1UPlDPzG5Ow' },
    { name: 'Figma', id: 'UCQsVmhSa4X-GpFBFmBFnQhA' },
  ],
  'Philosophy': [
    { name: 'Academy of Ideas', id: 'UCiRiQGCAjXa_x3w_hZDtBNg' },
    { name: 'Einzelgänger', id: 'UCJn9SHnSCe_HlDGhFP-EIBA' },
    { name: 'Pursuit of Wonder', id: 'UCDq5v10l4wkV5-ZBIJJFbzQ' },
    { name: 'Like Stories of Old', id: 'UCA1ufHHHH-Ry68Mv2P75fCg' },
    { name: 'Philosophize This!', id: 'UCFpnY5NnBl-8L7SvICQFI2Q' },
  ],
  'Startups': [
    { name: 'Dalton Caldwell', id: 'UCcefcZRL2oaA_uBNeo5UNqg' },
    { name: 'TechCrunch', id: 'UCCjyq_K1Xwfg8Lndy7lKMpA' },
    { name: 'First Round Capital', id: 'UCxB0FP7OwFRMlsOaHlF0hiA' },
    { name: 'a16z', id: 'UC9cn0TuPq4dnbTY-CBadO2Q' },
    { name: 'Sequoia', id: 'UC2GGU6PgpmmfUJnDMedckbA' },
  ],
  'Content creation': [
    { name: 'Sean Cannell', id: 'UCqEqHuax9gcJLb1cla80tsA' },
    { name: 'Colin and Samir', id: 'UCamLstJyCa-t5gfZegxsFMw' },
    { name: 'Roberto Blake', id: 'UCovtFObhY9NypXcyHxAS7-Q' },
    { name: 'Think Media', id: 'UCnUYZLuoy1rq1aVMwx4aTzw' },
    { name: 'Cathrin Manning', id: 'UCpZ5x3GHcFIwUfGDdnXXA0A' },
  ],
  'Coding': [
    { name: 'freeCodeCamp', id: 'UC8butISFwT-Wl7EV0hUK0BQ' },
    { name: 'Programming with Mosh', id: 'UCWv7vMbMWH4-V0ZXdmDpPBA' },
    { name: 'Kevin Powell', id: 'UCjzHeG1KWoonqz7DVPQGn9w' },
    { name: 'Web Dev Simplified', id: 'UCFbNIlppjAuEX4znoulh0Cw' },
    { name: 'Hitesh Choudhary', id: 'UCXgGY0wkgOONij8OcS7LcqA' },
    { name: 'Code with Harry', id: 'UCeVMnSShP_IineV1MqelHPg' },
  ],
};

// ── QUALITY THRESHOLDS ───────────────────────────────────────────────────────
const QUALITY_THRESHOLDS = {
  MIN_DURATION_SECONDS: 600,     // 10 minutes
  MIN_VIEWS: 50_000,             // Reduced to get more content initially
  MIN_ENGAGEMENT_RATE: 0.02,     // 2% (relaxed from 3%)
  FALLBACK_MIN_VIEWS: 5_000,     // Fallback when strict filter yields 0
  FALLBACK_MIN_DURATION: 180,    // 3 minutes fallback
};

// ── QUALITY SCORING (0-100 per spec) ────────────────────────────────────────
export function calculateQualityScore(
  viewCount: number,
  likeCount: number,
  commentCount: number,
  subscriberCount: number,
  publishedAt: string
): number {
  const engagementRate = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;
  const daysOld = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24);

  // Per specification formula
  const engagementScore = Math.min(engagementRate * 100 * 0.4, 40);
  const authorityScore  = Math.min((subscriberCount / 1_000_000), 1.0) * 35;
  const recencyScore    = Math.max(0, (30 - daysOld) / 30) * 25;

  return Math.round(engagementScore + authorityScore + recencyScore);
}

export function calculateViralityScore(
  viewCount: number,
  likeCount: number,
  commentCount: number,
  publishedAt: string
): number {
  const daysOld = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24));
  const engagementRate = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;

  const viewVelocity     = (viewCount / daysOld / 1000) * 0.4;
  const engagementWeight = engagementRate * 100 * 0.35;
  const recency          = Math.max(0, (30 - daysOld) / 30) * 100 * 0.25;

  return Math.min(Math.round(viewVelocity + engagementWeight + recency), 100);
}

// ── PARSE ISO 8601 DURATION ──────────────────────────────────────────────────
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 3600) +
         (parseInt(match[2] || '0') * 60) +
         parseInt(match[3] || '0');
}

// ── UPSERT CREATOR ───────────────────────────────────────────────────────────
async function upsertCreator(channelData: any, subscriberCount: number): Promise<string | null> {
  const existing = await supabase
    .from('creators')
    .select('id')
    .eq('handle', channelData.id)
    .eq('primary_platform', 'youtube')
    .maybeSingle();

  const authorityScore = Math.min((subscriberCount / 1_000_000) * 100, 100);

  const creatorPayload = {
    name: channelData.snippet?.title || channelData.id,
    handle: channelData.id,
    profile_image_url: channelData.snippet?.thumbnails?.default?.url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${channelData.id}`,
    bio: channelData.snippet?.description?.slice(0, 300) || null,
    primary_platform: 'youtube',
    platform_accounts: {
      youtube: {
        channel_id: channelData.id,
        subscriber_count: subscriberCount,
        total_views: parseInt(channelData.statistics?.viewCount || '0'),
      },
    },
    authority_score: authorityScore,
    is_premium_creator: subscriberCount > 100_000,
    updated_at: new Date().toISOString(),
  };

  if (existing.data?.id) {
    await supabase.from('creators').update(creatorPayload).eq('id', existing.data.id);
    return existing.data.id;
  } else {
    const { data } = await supabase.from('creators').insert(creatorPayload).select('id').single();
    return data?.id || null;
  }
}

// ── SCRAPE A SINGLE CHANNEL ──────────────────────────────────────────────────
async function scrapeChannel(
  channel: { name: string; id: string },
  category: string,
  seenVideoIds: Set<string>,
  useStrictFilters: boolean = true,
  preFetchedChannelData?: any
): Promise<number> {
  try {
    // 1. Get channel info (use pre-fetched if available to save quota)
    let channelData = preFetchedChannelData;
    if (!channelData) {
      const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: { part: 'snippet,statistics', id: channel.id, key: YOUTUBE_API_KEY },
      });
      channelData = channelRes.data.items?.[0];
    }
    
    if (!channelData) return 0;

    const subscriberCount = parseInt(channelData.statistics?.subscriberCount || '0');

    // 2. Get latest videos using playlistItems (1 unit) instead of search (100 units)
    // The uploads playlist ID is typically the channel ID with 'UU' instead of 'UC'
    const uploadsPlaylistId = channel.id.replace(/^UC/, 'UU');
    
    let videoIds = '';
    try {
      const playlistRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
        params: {
          part: 'snippet',
          playlistId: uploadsPlaylistId,
          maxResults: 15,
          key: YOUTUBE_API_KEY,
        },
      });

      videoIds = playlistRes.data.items
        ?.map((i: any) => i.snippet.resourceId.videoId)
        .filter((id: string) => id && !seenVideoIds.has(id))
        .join(',');
    } catch (err: any) {
      if (err.response?.status === 403) {
        throw new Error('YouTube API Quota Exceeded. Please try again tomorrow.');
      }
      // Fallback to search if playlistItems fails (some channels don't follow the UU pattern)
      const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          channelId: channel.id,
          type: 'video',
          order: 'date',
          maxResults: 10,
          key: YOUTUBE_API_KEY,
        },
      });
      videoIds = searchRes.data.items?.map((i: any) => i.id.videoId).filter((id: string) => id && !seenVideoIds.has(id)).join(',');
    }

    if (!videoIds) return 0;

    // 3. Get video details
    const detailsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: { part: 'statistics,contentDetails,snippet', id: videoIds, key: YOUTUBE_API_KEY },
    });

    const contentToInsert: any[] = [];
    let creatorId: string | null = null;

    for (const video of detailsRes.data.items || []) {
      const videoId     = video.id;
      const duration    = parseDuration(video.contentDetails.duration);
      const viewCount   = parseInt(video.statistics.viewCount || '0');
      const likeCount   = parseInt(video.statistics.likeCount || '0');
      const commentCount = parseInt(video.statistics.commentCount || '0');
      const engagement  = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;

      if (seenVideoIds.has(videoId)) continue;

      // Apply quality filters (with fallback)
      const minDuration = useStrictFilters ? QUALITY_THRESHOLDS.MIN_DURATION_SECONDS : QUALITY_THRESHOLDS.FALLBACK_MIN_DURATION;
      const minViews    = useStrictFilters ? QUALITY_THRESHOLDS.MIN_VIEWS : QUALITY_THRESHOLDS.FALLBACK_MIN_VIEWS;
      const minEngage   = useStrictFilters ? QUALITY_THRESHOLDS.MIN_ENGAGEMENT_RATE : 0.005;

      if (duration < minDuration) continue;
      if (viewCount < minViews) continue;
      if (engagement < minEngage) continue;

      const qualityScore  = calculateQualityScore(viewCount, likeCount, commentCount, subscriberCount, video.snippet.publishedAt);
      const viralityScore = calculateViralityScore(viewCount, likeCount, commentCount, video.snippet.publishedAt);

      if (!creatorId) creatorId = await upsertCreator(channelData, subscriberCount);

      seenVideoIds.add(videoId);
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
        tags: JSON.stringify(video.snippet.tags?.slice(0, 10) || []),
        content_metadata: JSON.stringify({
          video_id: videoId,
          duration_seconds: duration,
          view_count: viewCount,
          like_count: likeCount,
          comment_count: commentCount,
          published_at: video.snippet.publishedAt,
          channel_id: channel.id,
          channel_name: video.snippet.channelTitle,
          channel_avatar: channelData.snippet?.thumbnails?.default?.url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${channel.id}`,
          subscriber_count: subscriberCount,
          // Keep backward compatibility
          high_res_thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          video_url: `https://www.youtube.com/watch?v=${videoId}`,
        }),
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

      if (error) console.error(`Upsert error for ${channel.name}:`, error.message);
    }

    return contentToInsert.length;
  } catch (err: any) {
    console.error(`Failed to scrape channel ${channel.name}:`, err.message);
    return 0;
  }
}

// ── MAIN SCRAPER FUNCTION ────────────────────────────────────────────────────
export async function scrapeAllPremiumChannels(
  onProgress?: (msg: string) => void
): Promise<{ totalAdded: number; byCategory: Record<string, number> }> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('VITE_YOUTUBE_API_KEY not configured');
  }

  const seenVideoIds = new Set<string>();
  const byCategory: Record<string, number> = {};
  let totalAdded = 0;

  for (const [category, channels] of Object.entries(PREMIUM_CHANNELS)) {
    byCategory[category] = 0;
    onProgress?.(`🔍 Analyzing ${category}...`);
    let categoryCount = 0;

    try {
      // BATCH CHANNEL LOOKUP: Fetch all channels in this category at once to save quota
      const channelIds = channels.map(c => c.id).join(',');
      const channelsRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: { part: 'snippet,statistics', id: channelIds, key: YOUTUBE_API_KEY },
      });
      
      const channelMap = new Map();
      channelsRes.data.items?.forEach((item: any) => channelMap.set(item.id, item));

      // RANDOMIZE CHANNEL ORDER to ensure diversity during the scraping process
      const shuffledChannels = [...channels].sort(() => Math.random() - 0.5);

      for (const channel of shuffledChannels) {
        const preFetched = channelMap.get(channel.id);
        if (!preFetched) continue;

        onProgress?.(`🛰️ ${category} > ${channel.name}...`);
        const count = await scrapeChannel(channel, category, seenVideoIds, true, preFetched);
        categoryCount += count;

        // Small delay to prevent burst limits
        await new Promise(r => setTimeout(r, 200));
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        onProgress?.(`⚠️ Quota exceeded or Access Forbidden. Please check API Key.`);
        console.error('YouTube API 403:', err.message);
        break; // Stop scraping further to avoid repeated failures
      }
      console.error(`Category ${category} scrape failed:`, err.message);
    }

    byCategory[category] = categoryCount;
    totalAdded += categoryCount;
    onProgress?.(`✅ ${category}: +${categoryCount} videos`);
  }

  return { totalAdded, byCategory };
}

// ── FETCH CONTENT FROM SUPABASE ──────────────────────────────────────────────

export interface ContentPiece {
  id: string;
  content_type: string;
  external_id: string;
  source_platform: string;
  title: string;
  description: string | null;
  content_url: string;
  thumbnail_url: string | null;
  creator_id: string | null;
  category: string;
  tags: any;
  content_metadata: any;
  quality_score: number;
  virality_score: number;
  engagement_rate: number;
  created_at: string;
  // Joined creator data
  creator?: Creator;
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  profile_image_url: string | null;
  authority_score: number;
  platform_accounts: any;
}

// Normalized view of a video (backward compat with existing VideoPlayerModal)
export function normalizeContentPiece(cp: any): any {
  // If it's already normalized or from user_study_videos
  if (cp.video_id && !cp.external_id) return cp;

  const meta = typeof cp.content_metadata === 'string'
    ? JSON.parse(cp.content_metadata)
    : cp.content_metadata || {};

  return {
    // New schema fields
    id: cp.id,
    content_type: cp.content_type || 'video',
    category: cp.category || 'All',
    quality_score: cp.quality_score || 0,
    virality_score: cp.virality_score || 0,
    engagement_rate: cp.engagement_rate || 0,
    // Backward compat with premium_trending_videos schema
    video_id: cp.external_id || cp.video_id,
    title: cp.title,
    description: cp.description,
    video_url: meta.video_url || cp.video_url || `https://www.youtube.com/watch?v=${cp.external_id || cp.video_id}`,
    thumbnail_url: cp.thumbnail_url,
    high_res_thumbnail: meta.high_res_thumbnail || cp.thumbnail_url,
    channel_name: meta.channel_name || cp.channel_name || cp.creator?.name || 'Unknown',
    channel_id: meta.channel_id || cp.channel_id || '',
    channel_avatar: meta.channel_avatar || cp.channel_avatar || cp.creator?.profile_image_url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${meta.channel_id || cp.creator_id || 'unknown'}`,
    duration_seconds: meta.duration_seconds || cp.duration || 0,
    view_count: meta.view_count || cp.view_count || 0,
    like_count: meta.like_count || 0,
    comment_count: meta.comment_count || 0,
    published_at: meta.published_at || cp.created_at,
    subscriber_count: meta.subscriber_count || 0,
  };
}

// Category → DB mapping
const CAT_MAP: Record<string, string> = {
  'Tech': 'Technology',
  'Self-improvement': 'Self-Improvement',
  'Content creation': 'Content creation',
  'Public speaking': 'Public speaking',
  'Health & Fitness': 'Health & Fitness',
};

export function normalizeCategoryForDB(uiCategory: string): string {
  return CAT_MAP[uiCategory] || uiCategory;
}

/**
 * FETCH CONTENT WITH CURSOR PAGINATION (High Performance)
 */
export async function fetchContentByCategory(
  category: string,
  limit = 24,
  cursor?: { lastValue: any; lastId: string },
  sortBy: 'trending' | 'recent' | 'popular' = 'trending'
): Promise<{ items: ContentPiece[]; nextCursor?: { lastValue: any; lastId: string } }> {
  let query = supabase
    .from('content_pieces')
    .select('*')
    .gte('quality_score', 15); // Slightly more relaxed for more variety

  if (category !== 'All') {
    query = query.eq('category', normalizeCategoryForDB(category));
  }

  // Determine sort column
  const sortCol = sortBy === 'trending' ? 'virality_score' : 
                  sortBy === 'recent' ? 'created_at' : 'quality_score';

  // Apply Cursor Filter
  if (cursor) {
    const operator = 'lt'; 
    query = query.or(`${sortCol}.${operator}.${cursor.lastValue},and(${sortCol}.eq.${cursor.lastValue},id.lt.${cursor.lastId})`);
  }

  // Apply Ordering
  query = query.order(sortCol, { ascending: false }).order('id', { ascending: false });

  const { data, error } = await query.limit(limit);
  
  if (error) {
    console.error('fetchContentByCategory error:', error);
    return { items: [] };
  }

  const items = (data || []) as ContentPiece[];
  
  // DIVERSITY RE-RANKING: Prevent one creator from dominating the top of the feed (Only for first page)
  let processedItems = items;
  if (!cursor && items.length > 0) {
    const grouped: Record<string, ContentPiece[]> = {};
    items.forEach(item => {
      const meta = typeof item.content_metadata === 'string' ? JSON.parse(item.content_metadata) : item.content_metadata;
      const creatorKey = item.creator_id || meta?.channel_id || 'unknown';
      if (!grouped[creatorKey]) grouped[creatorKey] = [];
      grouped[creatorKey].push(item);
    });

    const result: ContentPiece[] = [];
    const creatorKeys = Object.keys(grouped);
    let hasMoreInGroups = true;
    let round = 0;

    while (hasMoreInGroups && result.length < limit) {
      hasMoreInGroups = false;
      for (const key of creatorKeys) {
        if (grouped[key][round]) {
          result.push(grouped[key][round]);
          hasMoreInGroups = true;
        }
      }
      round++;
    }
    processedItems = result;
  }

  // Prepare next cursor
  let nextCursor;
  if (items.length === limit) {
    const lastItem = items[items.length - 1];
    nextCursor = {
      lastValue: lastItem[sortCol as keyof ContentPiece],
      lastId: lastItem.id
    };
  }

  return { items: processedItems, nextCursor };
}

/**
 * HYBRID SEMANTIC SEARCH (Keyword + Vector)
 */
export async function searchContent(
  searchQuery: string,
  category?: string,
  limit = 30,
  embedding?: number[]
): Promise<ContentPiece[]> {
  // If embedding is provided, use Hybrid Search via RPC
  if (embedding) {
    const { data, error } = await supabase.rpc('hybrid_search', {
      query_text: searchQuery,
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: limit,
      category_filter: category && category !== 'All' ? normalizeCategoryForDB(category) : null
    });

    if (error) {
      console.error('Hybrid search error:', error);
      // Fallback to keyword search handled below
    } else {
      return (data || []) as ContentPiece[];
    }
  }

  // Fallback: Keyword-only search
  let query = supabase
    .from('content_pieces')
    .select('*')
    .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    .order('quality_score', { ascending: false })
    .limit(limit);

  if (category && category !== 'All') {
    query = query.eq('category', normalizeCategoryForDB(category));
  }

  const { data, error } = await query;
  if (error) { console.error('searchContent error:', error); return []; }
  
  const results = (data || []) as ContentPiece[];
  
  // LIVE FALLBACK: If no results found in DB, fetch directly from YouTube
  if (results.length === 0 && searchQuery.length > 2) {
    try {
      const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: searchQuery,
          type: 'video',
          maxResults: 15,
          key: YOUTUBE_API_KEY,
        },
      });

      const ytResults = searchRes.data.items?.map((i: any) => ({
        id: i.id.videoId,
        external_id: i.id.videoId,
        title: i.snippet.title,
        description: i.snippet.description,
        thumbnail_url: i.snippet.thumbnails?.high?.url || i.snippet.thumbnails?.default?.url,
        category: category || 'Coding',
        quality_score: 80, // Default for live search
        virality_score: 50,
        content_metadata: JSON.stringify({
          channel_name: i.snippet.channelTitle,
          channel_id: i.snippet.channelId,
          published_at: i.snippet.publishedAt,
        })
      })) || [];
      
      return ytResults;
    } catch (err) {
      console.error('YouTube live search failed:', err);
    }
  }

  return results;
}

export async function recordInteraction(
  userId: string,
  contentId: string,
  interactionType: 'view' | 'save' | 'share' | 'like',
  metadata: { watchDuration?: number; watchedPercentage?: number } = {}
): Promise<void> {
  await supabase.from('user_content_interactions').insert({
    user_id: userId,
    content_id: contentId,
    interaction_type: interactionType,
    watch_duration: metadata.watchDuration || 0,
    watched_percentage: metadata.watchedPercentage || 0,
  });
}

export async function getCategoryStats(): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('content_pieces')
    .select('category');

  if (!data) return {};

  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.category] = (counts[row.category] || 0) + 1;
  }
  return counts;
}

