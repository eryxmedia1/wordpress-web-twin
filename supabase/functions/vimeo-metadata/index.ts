import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      console.error("No URL provided");
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Processing Vimeo URL:", url);

    // Extract Vimeo video ID from various URL formats
    let videoId = null;
    
    // Format: https://vimeo.com/123456789
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      videoId = vimeoMatch[1];
    }
    
    // Format: https://player.vimeo.com/video/123456789
    const playerMatch = url.match(/player\.vimeo\.com\/video\/(\d+)/);
    if (playerMatch) {
      videoId = playerMatch[1];
    }

    // Format: https://player.vimeo.com/progressive_redirect/playback/123456789/...
    const progressiveMatch = url.match(/progressive_redirect\/playback\/(\d+)/);
    if (progressiveMatch) {
      videoId = progressiveMatch[1];
    }

    console.log("Extracted video ID:", videoId);

    if (!videoId) {
      // If we can't extract the ID but it looks like a direct video URL, return basic info
      if (url.includes('vimeo') && (url.includes('.mp4') || url.includes('progressive'))) {
        console.log("Direct video URL detected, returning basic metadata");
        return new Response(
          JSON.stringify({
            title: "Vimeo Video",
            thumbnail_url: null,
            duration: null,
            description: null,
            video_url: url,
            provider: "vimeo",
            is_direct_url: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Could not extract Vimeo video ID from URL" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Vimeo oEmbed API to fetch metadata with higher resolution thumbnails
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}&width=1920&height=1080`;
    console.log("Fetching oEmbed data from:", oembedUrl);
    
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      console.error("Vimeo API error:", response.status, await response.text());
      
      // Return basic info if oEmbed fails
      return new Response(
        JSON.stringify({
          title: `Vimeo Video ${videoId}`,
          thumbnail_url: `https://i.vimeocdn.com/video/${videoId}_640x360.jpg`,
          duration: null,
          description: null,
          video_url: url,
          video_id: videoId,
          provider: "vimeo"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const data = await response.json();
    console.log("Vimeo oEmbed response:", JSON.stringify(data));
    
    // Calculate duration from duration_seconds if available
    let durationFormatted = null;
    if (data.duration) {
      const hours = Math.floor(data.duration / 3600);
      const minutes = Math.floor((data.duration % 3600) / 60);
      const seconds = data.duration % 60;
      
      if (hours > 0) {
        durationFormatted = `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        durationFormatted = `${minutes}m ${seconds}s`;
      } else {
        durationFormatted = `${seconds}s`;
      }
    }

    // Get the highest quality thumbnail available
    let thumbnailUrl = data.thumbnail_url || null;
    if (thumbnailUrl) {
      // Replace small dimensions with larger ones for better quality
      thumbnailUrl = thumbnailUrl
        .replace(/_\d+x\d+/, '_1920x1080')
        .replace(/d_\d+x\d+/, 'd_1920x1080');
    }

    const metadata = {
      title: data.title || null,
      thumbnail_url: thumbnailUrl,
      thumbnail_large: thumbnailUrl,
      duration: durationFormatted,
      duration_seconds: data.duration || null,
      description: data.description || null,
      author_name: data.author_name || null,
      author_url: data.author_url || null,
      video_id: videoId,
      video_url: url,
      embed_url: `https://player.vimeo.com/video/${videoId}`,
      provider: "vimeo",
      width: data.width || null,
      height: data.height || null
    };

    console.log("Returning metadata:", JSON.stringify(metadata));

    return new Response(
      JSON.stringify(metadata),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error processing Vimeo URL:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
