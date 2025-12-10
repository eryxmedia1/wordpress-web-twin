import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function parseISO8601Duration(duration: string): { formatted: string; seconds: number } {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { formatted: '0:00', seconds: 0 };

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  let formatted: string;
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`;
  } else {
    formatted = `${seconds}s`;
  }

  return { formatted, seconds: totalSeconds };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const videoId = extractYouTubeVideoId(url);
    
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Could not extract YouTube video ID from URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) {
      console.error('YOUTUBE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'YouTube API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`;
    
    console.log('Fetching YouTube metadata for video:', videoId);
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('YouTube API error:', data);
      return new Response(
        JSON.stringify({ error: data.error?.message || 'YouTube API error' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.items || data.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Video not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;

    const { formatted: duration, seconds: durationSeconds } = parseISO8601Duration(contentDetails.duration);

    // Get best available thumbnail
    const thumbnails = snippet.thumbnails;
    const thumbnailUrl = thumbnails.maxres?.url || 
                         thumbnails.standard?.url || 
                         thumbnails.high?.url || 
                         thumbnails.medium?.url || 
                         thumbnails.default?.url;

    const metadata = {
      title: snippet.title,
      thumbnail_url: thumbnailUrl,
      thumbnail_large: thumbnails.maxres?.url || thumbnails.high?.url,
      duration: duration,
      duration_seconds: durationSeconds,
      description: snippet.description,
      author_name: snippet.channelTitle,
      author_url: `https://www.youtube.com/channel/${snippet.channelId}`,
      video_id: videoId,
      video_url: url,
      embed_url: `https://www.youtube.com/embed/${videoId}`,
      provider: 'youtube',
      width: null,
      height: null,
    };

    console.log('Successfully fetched YouTube metadata:', metadata.title);

    return new Response(
      JSON.stringify(metadata),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in youtube-metadata function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
