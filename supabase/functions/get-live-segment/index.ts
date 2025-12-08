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
  episodeId?: string;
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

    // Fetch playlist items with video and episode details
    const { data: items, error: itemsError } = await supabase
      .from('live_playlist_items')
      .select(`
        *,
        video:contents(id, title, poster_url, video_url, duration),
        episode:episodes(id, title, thumbnail_url, video_url, duration),
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

    // Fetch ads for midroll breaks
    const { data: activeAds } = await supabase
      .from('ads')
      .select('*')
      .eq('is_active', true)
      .eq('ad_type', 'midroll');

    // Build segments array (shows + ads)
    const segments: Segment[] = [];
    
    for (const item of items) {
      // Determine if this is an episode or a content item
      const isEpisode = !!item.episode_id && item.episode;
      const video = isEpisode ? item.episode : item.video;
      
      if (!video) {
        console.log('Skipping item - no video data:', item.id);
        continue;
      }

      // CRITICAL: Only use video_url - NEVER use trailer_url for Live TV
      const videoUrl = video.video_url;
      
      if (!videoUrl) {
        console.log('Skipping item - no video_url (Live TV requires video_url, not trailer):', video.title || item.id);
        continue;
      }

      // Parse duration
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
      if (midrolls.length > 0 && activeAds && activeAds.length > 0) {
        let lastBreak = 0;
        const sortedMidrolls = [...midrolls].sort((a, b) => a - b);
        
        for (let i = 0; i < sortedMidrolls.length; i++) {
          const breakAt = sortedMidrolls[i];
          if (breakAt > lastBreak && breakAt < videoDuration) {
            // Show segment before midroll
            segments.push({
              type: 'show',
              videoUrl,
              videoId: item.video?.id,
              episodeId: item.episode_id,
              title: video.title,
              thumbnail: isEpisode ? video.thumbnail_url : video.poster_url,
              duration: breakAt - lastBreak,
              startOffset: lastBreak,
            });
            
            // Pick a random ad from the active midroll ads
            const randomAd = activeAds[Math.floor(Math.random() * activeAds.length)];
            segments.push({
              type: 'ad',
              videoUrl: randomAd.video_url,
              title: randomAd.name,
              duration: randomAd.duration_seconds || 30,
            });
            
            lastBreak = breakAt;
          }
        }
        
        // Remaining show segment after last midroll
        if (lastBreak < videoDuration) {
          segments.push({
            type: 'show',
            videoUrl,
            videoId: item.video?.id,
            episodeId: item.episode_id,
            title: video.title,
            thumbnail: isEpisode ? video.thumbnail_url : video.poster_url,
            duration: videoDuration - lastBreak,
            startOffset: lastBreak,
          });
        }
      } else {
        // No midrolls, add whole show as one segment
        segments.push({
          type: 'show',
          videoUrl,
          videoId: item.video?.id,
          episodeId: item.episode_id,
          title: video.title,
          thumbnail: isEpisode ? video.thumbnail_url : video.poster_url,
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
          message: 'No valid segments (all items missing video_url)',
          channel: { name: channel.name, logo: channel.logo_url, slug: channel.slug }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate total cycle duration
    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

    // Get current time in UTC
    const nowUtc = Date.now();
    
    // Parse playlist start datetime with proper timezone handling
    // The start_time is stored as local time in the channel's timezone
    const timezone = channel.timezone || 'America/New_York';
    
    // Create the playlist start time
    // Parse start_date (YYYY-MM-DD) and start_time (HH:MM:SS or HH:MM)
    const startDateStr = playlist.start_date;
    const startTimeStr = playlist.start_time;
    
    // Build an ISO string and account for timezone offset
    // For America/New_York, we need to calculate the offset
    const tzOffsetHours = getTimezoneOffsetHours(timezone, new Date());
    
    // Parse the time
    const [hours, minutes, seconds = 0] = startTimeStr.split(':').map(Number);
    
    // Create a date object in UTC that represents the local time
    const playlistStartLocal = new Date(startDateStr);
    playlistStartLocal.setUTCHours(hours - tzOffsetHours, minutes, seconds, 0);
    
    const playlistStartMs = playlistStartLocal.getTime();

    // Calculate elapsed seconds since playlist start
    let elapsedSeconds = Math.floor((nowUtc - playlistStartMs) / 1000);

    console.log('Timezone calculation:', {
      timezone,
      tzOffsetHours,
      startDate: startDateStr,
      startTime: startTimeStr,
      playlistStartUTC: new Date(playlistStartMs).toISOString(),
      nowUTC: new Date(nowUtc).toISOString(),
      elapsedSeconds,
    });

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

// Helper function to get timezone offset in hours
function getTimezoneOffsetHours(timezone: string, date: Date): number {
  try {
    // Create a formatter for the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    
    // Get the hour in the target timezone
    const parts = formatter.formatToParts(date);
    const localHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    
    // Get UTC hour
    const utcHour = date.getUTCHours();
    
    // Calculate offset (this is simplified, handles most cases)
    let offset = localHour - utcHour;
    if (offset > 12) offset -= 24;
    if (offset < -12) offset += 24;
    
    return offset;
  } catch (e) {
    // Default to EST (-5) if timezone parsing fails
    console.log('Failed to parse timezone, defaulting to EST:', timezone);
    return -5;
  }
}

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
