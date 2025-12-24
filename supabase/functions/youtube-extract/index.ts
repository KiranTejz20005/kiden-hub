import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Fetch video metadata using YouTube oEmbed API (no API key needed)
async function fetchVideoMetadata(videoId: string) {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  
  try {
    const response = await fetch(oembedUrl);
    if (!response.ok) throw new Error('Video not found');
    return await response.json();
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}

// Fetch captions/transcript from YouTube
async function fetchTranscript(videoId: string): Promise<{ text: string; timestamps: Array<{ time: number; text: string }> } | null> {
  try {
    // Fetch the video page to extract caption track URL
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(videoPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    
    if (!response.ok) {
      console.log('Failed to fetch video page');
      return null;
    }
    
    const html = await response.text();
    
    // Extract captions data from the page
    const captionMatch = html.match(/"captions":\s*(\{[^}]+\})/);
    if (!captionMatch) {
      console.log('No captions found in video');
      return null;
    }
    
    // Try to find caption track URL
    const captionUrlMatch = html.match(/"baseUrl":"(https:\/\/www\.youtube\.com\/api\/timedtext[^"]+)"/);
    if (!captionUrlMatch) {
      console.log('No caption URL found');
      return null;
    }
    
    const captionUrl = captionUrlMatch[1].replace(/\\u0026/g, '&');
    console.log('Fetching captions from:', captionUrl);
    
    const captionResponse = await fetch(captionUrl);
    if (!captionResponse.ok) {
      console.log('Failed to fetch captions');
      return null;
    }
    
    const captionXml = await captionResponse.text();
    
    // Parse XML captions
    const timestamps: Array<{ time: number; text: string }> = [];
    const textMatches = captionXml.matchAll(/<text start="([^"]+)"[^>]*>([^<]*)<\/text>/g);
    
    let fullText = '';
    for (const match of textMatches) {
      const time = parseFloat(match[1]);
      const text = match[2]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\n/g, ' ')
        .trim();
      
      if (text) {
        timestamps.push({ time, text });
        fullText += text + ' ';
      }
    }
    
    if (timestamps.length === 0) {
      return null;
    }
    
    return { text: fullText.trim(), timestamps };
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return null;
  }
}

// Format seconds to MM:SS or HH:MM:SS
function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Generate AI summary using Lovable API
async function generateSummary(transcript: string, title: string): Promise<string> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.error('LOVABLE_API_KEY not configured');
    return 'Summary generation unavailable - API key not configured.';
  }

  try {
    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert content summarizer. Create a comprehensive summary of the YouTube video transcript provided. Structure your response as:

1. **Overview** (2-3 sentences)
2. **Key Points** (bullet points of main ideas)
3. **Timestamped Highlights** (include approximate timestamps for key moments if discernible from context)
4. **Takeaways** (actionable insights or conclusions)

Be concise but thorough.`
          },
          {
            role: 'user',
            content: `Please summarize this YouTube video titled "${title}":\n\n${transcript.slice(0, 15000)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return 'Failed to generate summary.';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No summary generated.';
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Error generating summary.';
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, userId } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'YouTube URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing YouTube URL:', url);

    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Invalid YouTube URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Video ID:', videoId);

    // Fetch video metadata
    const metadata = await fetchVideoMetadata(videoId);
    const title = metadata?.title || 'Unknown Video';
    const author = metadata?.author_name || 'Unknown Author';
    const thumbnailUrl = metadata?.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    console.log('Video title:', title);

    // Fetch transcript
    const transcriptData = await fetchTranscript(videoId);
    
    let content = '';
    let summary = '';
    
    if (transcriptData) {
      content = transcriptData.text;
      
      // Create formatted transcript with timestamps
      const formattedTranscript = transcriptData.timestamps
        .filter((_, i) => i % 5 === 0) // Sample every 5th entry to reduce size
        .map(t => `[${formatTime(t.time)}] ${t.text}`)
        .join('\n');
      
      console.log('Generating AI summary...');
      summary = await generateSummary(formattedTranscript, title);
    } else {
      content = 'Transcript not available for this video. The video may not have captions enabled.';
      summary = 'Unable to generate summary - no transcript available.';
    }

    // Store in database if userId provided
    if (userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: insertError } = await supabase
        .from('media_extractions')
        .insert({
          user_id: userId,
          source_type: 'youtube',
          source_url: url,
          title: title,
          content: content.slice(0, 50000), // Limit content size
          summary: summary,
          metadata: {
            videoId,
            author,
            thumbnailUrl,
            hasTranscript: !!transcriptData,
          }
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        videoId,
        title,
        author,
        thumbnailUrl,
        hasTranscript: !!transcriptData,
        content: content.slice(0, 5000), // Return truncated content
        summary,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in youtube-extract:', error);
    const message = error instanceof Error ? error.message : 'Failed to extract video content';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
