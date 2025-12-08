import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Segment {
  type: 'show' | 'ad';
  videoUrl: string;
  videoId?: string;
  title: string;
  thumbnail?: string;
  duration: number;
  startOffset?: number;
}

interface ScheduleResult {
  type: 'show' | 'ad' | 'idle';
  videoUrl: string;
  offsetSeconds: number;
  nowPlaying: {
    title: string;
    thumbnail: string | null;
    duration: number;
    type: string;
  };
  upNext: Array<{
    title: string;
    thumbnail: string | null;
    startsIn: number;
  }>;
  channel: {
    name: string;
    logo: string | null;
    slug: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const channelSlug = url.searchParams.get('channel');

    if (!channelSlug) {
      return new Response(
        JSON.stringify({ error: 'Channel slug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch channel
    const { data: channel, error: channelError } = await supabase
      .from('live_channels')
      .select('*')
      .eq('slug', channelSlug)
      .eq('is_active', true)
      .single();

    if (channelError || !channel) {
      console.log('Channel not found:', channelSlug, channelError);
      return new Response(
        JSON.stringify({ error: 'Channel not found', type: 'idle' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch active playlist for this channel
    const { data: playlist, error: playlistError } = await supabase
      .from('live_channel_playlists')
      .select('*')
      .eq('channel_id', channel.id)
      .eq('is_active', true)
      .single();

    if (playlistError || !playlist) {
      console.log('No active playlist for channel:', channel.name);
      return new Response(
        JSON.stringify({ 
          type: 'idle', 
          message: 'No active playlist',
          channel: { name: channel.name, logo: channel.logo_url, slug: channel.slug }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch playlist items with video details
    const { data: items, error: itemsError } = await supabase
      .from('live_playlist_items')
      .select(`
        *,
        video:contents(id, title, poster_url, video_url, trailer_url, duration),
        preroll_ad:ads!live_playlist_items_preroll_ad_id_fkey(id, name, video_url, duration_seconds),
        postroll_ad:ads!live_playlist_items_postroll_ad_id_fkey(id, name, video_url, duration_seconds)
      `)
      .eq('channel_playlist_id', playlist.id)
      .order('order_index', { ascending: true });

    if (itemsError || !items || items.length === 0) {
      console.log('No items in playlist:', playlist.playlist_name);
      return new Response(
        JSON.stringify({ 
          type: 'idle', 
          message: 'Playlist is empty',
          channel: { name: channel.name, logo: channel.logo_url, slug: channel.slug }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build segments array (shows + ads)
    const segments: Segment[] = [];
    
    for (const item of items) {
      const video = item.video;
      if (!video) continue;

      // Parse duration from video (format: "1h 30m" or "45m" or seconds)
      let videoDuration = item.duration_seconds;
      if (!videoDuration && video.duration) {
        videoDuration = parseDuration(video.duration);
      }
      if (!videoDuration) videoDuration = 1800; // Default 30 min

      // Add preroll if exists
      if (item.preroll_ad) {
        segments.push({
          type: 'ad',
          videoUrl: item.preroll_ad.video_url,
          title: item.preroll_ad.name,
          duration: item.preroll_ad.duration_seconds || 30,
        });
      }

      // Add midroll breaks if configured
      const midrolls: number[] = item.midroll_breaks_json || [];
      if (midrolls.length > 0) {
        let lastBreak = 0;
        const sortedMidrolls = [...midrolls].sort((a, b) => a - b);
        
        for (const breakAt of sortedMidrolls) {
          if (breakAt > lastBreak && breakAt < videoDuration) {
            // Show segment before midroll
            segments.push({
              type: 'show',
              videoUrl: video.video_url || video.trailer_url || '',
              videoId: video.id,
              title: video.title,
              thumbnail: video.poster_url,
              duration: breakAt - lastBreak,
              startOffset: lastBreak,
            });
            
            // Midroll ad (use default 30s)
            segments.push({
              type: 'ad',
              videoUrl: '', // Would pull from ad pool
              title: 'Advertisement',
              duration: 30,
            });
            
            lastBreak = breakAt;
          }
        }
        
        // Remaining show segment after last midroll
        if (lastBreak < videoDuration) {
          segments.push({
            type: 'show',
            videoUrl: video.video_url || video.trailer_url || '',
            videoId: video.id,
            title: video.title,
            thumbnail: video.poster_url,
            duration: videoDuration - lastBreak,
            startOffset: lastBreak,
          });
        }
      } else {
        // No midrolls, add whole show as one segment
        segments.push({
          type: 'show',
          videoUrl: video.video_url || video.trailer_url || '',
          videoId: video.id,
          title: video.title,
          thumbnail: video.poster_url,
          duration: videoDuration,
          startOffset: 0,
        });
      }

      // Add postroll if exists
      if (item.postroll_ad) {
        segments.push({
          type: 'ad',
          videoUrl: item.postroll_ad.video_url,
          title: item.postroll_ad.name,
          duration: item.postroll_ad.duration_seconds || 30,
        });
      }
    }

    if (segments.length === 0) {
      return new Response(
        JSON.stringify({ 
          type: 'idle', 
          message: 'No valid segments',
          channel: { name: channel.name, logo: channel.logo_url, slug: channel.slug }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate total cycle duration
    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

    // Get current time in channel timezone
    const nowUtc = new Date();
    
    // Parse playlist start datetime
    const startDate = new Date(playlist.start_date);
    const [hours, minutes] = playlist.start_time.split(':').map(Number);
    const playlistStart = new Date(startDate);
    playlistStart.setHours(hours, minutes, 0, 0);

    // Calculate elapsed seconds since playlist start
    let elapsedSeconds = Math.floor((nowUtc.getTime() - playlistStart.getTime()) / 1000);

    // Handle loop mode
    if (playlist.loop_mode === 'continuous_loop') {
      if (elapsedSeconds < 0) {
        // Playlist hasn't started yet, show first item
        elapsedSeconds = 0;
      } else {
        elapsedSeconds = elapsedSeconds % totalDuration;
      }
    } else {
      // end_then_idle mode
      if (elapsedSeconds < 0 || elapsedSeconds >= totalDuration) {
        return new Response(
          JSON.stringify({ 
            type: 'idle', 
            message: 'Playlist has ended or not started',
            channel: { name: channel.name, logo: channel.logo_url, slug: channel.slug }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Find current segment
    let cumulative = 0;
    let currentIndex = 0;
    let offsetInSegment = 0;

    for (let i = 0; i < segments.length; i++) {
      if (cumulative + segments[i].duration > elapsedSeconds) {
        currentIndex = i;
        offsetInSegment = elapsedSeconds - cumulative;
        break;
      }
      cumulative += segments[i].duration;
    }

    const currentSegment = segments[currentIndex];

    // Build up next list (next 3 items)
    const upNext: Array<{ title: string; thumbnail: string | null; startsIn: number }> = [];
    let timeUntilNext = currentSegment.duration - offsetInSegment;
    
    for (let i = currentIndex + 1; i < Math.min(currentIndex + 4, segments.length); i++) {
      const seg = segments[i];
      if (seg.type === 'show') {
        upNext.push({
          title: seg.title,
          thumbnail: seg.thumbnail || null,
          startsIn: timeUntilNext,
        });
      }
      timeUntilNext += seg.duration;
    }

    // If loop mode and we need more items, wrap around
    if (playlist.loop_mode === 'continuous_loop' && upNext.length < 3) {
      for (let i = 0; i < Math.min(3 - upNext.length, segments.length); i++) {
        const seg = segments[i];
        if (seg.type === 'show') {
          upNext.push({
            title: seg.title,
            thumbnail: seg.thumbnail || null,
            startsIn: timeUntilNext,
          });
        }
        timeUntilNext += seg.duration;
      }
    }

    // Calculate actual video offset (for shows with midroll splits)
    let actualVideoOffset = offsetInSegment;
    if (currentSegment.startOffset !== undefined) {
      actualVideoOffset = currentSegment.startOffset + offsetInSegment;
    }

    const result: ScheduleResult = {
      type: currentSegment.type,
      videoUrl: currentSegment.videoUrl,
      offsetSeconds: actualVideoOffset,
      nowPlaying: {
        title: currentSegment.title,
        thumbnail: currentSegment.thumbnail || null,
        duration: currentSegment.duration,
        type: currentSegment.type,
      },
      upNext,
      channel: {
        name: channel.name,
        logo: channel.logo_url,
        slug: channel.slug,
      },
    };

    console.log('Returning live segment:', {
      channel: channel.slug,
      segment: currentSegment.title,
      offset: actualVideoOffset,
      elapsed: elapsedSeconds,
      totalDuration,
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-live-segment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to parse duration string to seconds
function parseDuration(duration: string): number {
  if (!duration) return 0;
  
  // If it's already a number (seconds)
  if (/^\d+$/.test(duration)) {
    return parseInt(duration, 10);
  }
  
  let totalSeconds = 0;
  
  // Match hours
  const hourMatch = duration.match(/(\d+)\s*h/i);
  if (hourMatch) {
    totalSeconds += parseInt(hourMatch[1], 10) * 3600;
  }
  
  // Match minutes
  const minMatch = duration.match(/(\d+)\s*m/i);
  if (minMatch) {
    totalSeconds += parseInt(minMatch[1], 10) * 60;
  }
  
  // Match seconds
  const secMatch = duration.match(/(\d+)\s*s/i);
  if (secMatch) {
    totalSeconds += parseInt(secMatch[1], 10);
  }
  
  // Match MM:SS or HH:MM:SS format
  const colonMatch = duration.match(/^(\d+):(\d+)(?::(\d+))?$/);
  if (colonMatch) {
    if (colonMatch[3]) {
      // HH:MM:SS
      totalSeconds = parseInt(colonMatch[1], 10) * 3600 + parseInt(colonMatch[2], 10) * 60 + parseInt(colonMatch[3], 10);
    } else {
      // MM:SS
      totalSeconds = parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
    }
  }
  
  return totalSeconds || 1800; // Default 30 min if parsing fails
}
