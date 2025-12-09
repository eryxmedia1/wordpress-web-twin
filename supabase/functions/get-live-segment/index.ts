import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaylistItem {
  id: string;
  videoUrl: string;
  videoId?: string;
  episodeId?: string;
  title: string;
  thumbnail?: string;
  duration: number; // Full video duration in seconds
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
        video:contents(id, title, poster_url, video_url, trailer_url, duration),
        episode:episodes(id, title, thumbnail_url, video_url, duration)
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

    // Build playlist items array - each video plays its FULL duration
    const playlistItems: PlaylistItem[] = [];
    
    for (const item of items) {
      // Determine if this is an episode or a content item
      const isEpisode = !!item.episode_id && item.episode;
      const video = isEpisode ? item.episode : item.video;
      
      if (!video) {
        console.log('Skipping item - no video data:', item.id);
        continue;
      }

      // Use video_url first, then fall back to trailer_url for Live TV
      const videoUrl = video.video_url || item.video?.trailer_url;
      
      if (!videoUrl) {
        console.log('Skipping item - no video_url or trailer_url:', video.title || item.id);
        continue;
      }

      // Parse duration - use stored duration_seconds first, then parse from string
      let videoDuration = item.duration_seconds;
      if (!videoDuration && video.duration) {
        videoDuration = parseDuration(video.duration);
      }
      // Default to 30 minutes if no duration found
      if (!videoDuration || videoDuration <= 0) {
        videoDuration = 1800;
        console.log('No duration found for', video.title, '- defaulting to 30 min');
      }

      playlistItems.push({
        id: item.id,
        videoUrl,
        videoId: item.video?.id,
        episodeId: item.episode_id,
        title: video.title,
        thumbnail: isEpisode ? video.thumbnail_url : video.poster_url,
        duration: videoDuration,
      });
    }

    if (playlistItems.length === 0) {
      return new Response(
        JSON.stringify({ 
          type: 'idle', 
          message: 'No valid items (all items missing video_url)',
          channel: { name: channel.name, logo: channel.logo_url, slug: channel.slug }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate total playlist duration (sum of all video durations)
    const totalDuration = playlistItems.reduce((sum, item) => sum + item.duration, 0);

    console.log('Playlist summary:', {
      channel: channel.slug,
      itemCount: playlistItems.length,
      totalDuration: totalDuration,
      totalDurationFormatted: `${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m`,
      items: playlistItems.map(i => ({ title: i.title, duration: i.duration }))
    });

    // Get current time in UTC
    const nowUtc = Date.now();
    
    // Parse playlist start datetime with proper timezone handling
    const timezone = channel.timezone || 'America/New_York';
    const startDateStr = playlist.start_date;
    const startTimeStr = playlist.start_time;
    
    const tzOffsetHours = getTimezoneOffsetHours(timezone, new Date());
    const [hours, minutes, seconds = 0] = startTimeStr.split(':').map(Number);
    
    const playlistStartLocal = new Date(startDateStr);
    playlistStartLocal.setUTCHours(hours - tzOffsetHours, minutes, seconds, 0);
    
    const playlistStartMs = playlistStartLocal.getTime();

    // Calculate elapsed seconds since playlist start
    let elapsedSeconds = Math.floor((nowUtc - playlistStartMs) / 1000);

    console.log('Time calculation:', {
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
        elapsedSeconds = 0;
      } else {
        // Loop around when playlist ends
        elapsedSeconds = elapsedSeconds % totalDuration;
      }
    } else {
      // Non-looping mode
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

    // Find current video based on elapsed time
    let cumulative = 0;
    let currentIndex = 0;
    let offsetInCurrentVideo = 0;

    for (let i = 0; i < playlistItems.length; i++) {
      const itemDuration = playlistItems[i].duration;
      if (cumulative + itemDuration > elapsedSeconds) {
        currentIndex = i;
        offsetInCurrentVideo = elapsedSeconds - cumulative;
        break;
      }
      cumulative += itemDuration;
    }

    const currentItem = playlistItems[currentIndex];
    const remainingInCurrent = currentItem.duration - offsetInCurrentVideo;

    // Build up next list (next 3 UNIQUE videos)
    const upNext: Array<{ title: string; thumbnail: string | null; startsIn: number }> = [];
    const seenTitles = new Set<string>();
    seenTitles.add(currentItem.title); // Don't show current video in up next
    
    let timeUntilNext = remainingInCurrent;
    
    // Look at items after current
    for (let i = currentIndex + 1; i < playlistItems.length && upNext.length < 3; i++) {
      const item = playlistItems[i];
      if (!seenTitles.has(item.title)) {
        upNext.push({
          title: item.title,
          thumbnail: item.thumbnail || null,
          startsIn: timeUntilNext,
        });
        seenTitles.add(item.title);
      }
      timeUntilNext += item.duration;
    }

    // If loop mode and we need more items, wrap around to beginning
    if (playlist.loop_mode === 'continuous_loop' && upNext.length < 3) {
      for (let i = 0; i < playlistItems.length && upNext.length < 3; i++) {
        const item = playlistItems[i];
        if (!seenTitles.has(item.title)) {
          upNext.push({
            title: item.title,
            thumbnail: item.thumbnail || null,
            startsIn: timeUntilNext,
          });
          seenTitles.add(item.title);
        }
        timeUntilNext += item.duration;
      }
    }

    const result: ScheduleResult = {
      type: 'show',
      videoUrl: currentItem.videoUrl,
      offsetSeconds: offsetInCurrentVideo,
      nowPlaying: {
        title: currentItem.title,
        thumbnail: currentItem.thumbnail || null,
        duration: currentItem.duration,
        type: 'show',
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
      currentVideo: currentItem.title,
      currentIndex: currentIndex + 1,
      totalVideos: playlistItems.length,
      offsetInVideo: offsetInCurrentVideo,
      videoDuration: currentItem.duration,
      remainingInVideo: remainingInCurrent,
      elapsedTotal: elapsedSeconds,
      totalPlaylistDuration: totalDuration,
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
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(date);
    const localHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const utcHour = date.getUTCHours();
    
    let offset = localHour - utcHour;
    if (offset > 12) offset -= 24;
    if (offset < -12) offset += 24;
    
    return offset;
  } catch (e) {
    console.log('Failed to parse timezone, defaulting to EST:', timezone);
    return -5;
  }
}

// Helper function to parse duration string to seconds
function parseDuration(duration: string): number {
  if (!duration) return 0;
  
  // If it's just a number, assume seconds
  if (/^\d+$/.test(duration)) {
    return parseInt(duration, 10);
  }
  
  let totalSeconds = 0;
  
  // Handle "1h 30m 45s" format
  const hourMatch = duration.match(/(\d+)\s*h/i);
  if (hourMatch) {
    totalSeconds += parseInt(hourMatch[1], 10) * 3600;
  }
  
  const minMatch = duration.match(/(\d+)\s*m/i);
  if (minMatch) {
    totalSeconds += parseInt(minMatch[1], 10) * 60;
  }
  
  const secMatch = duration.match(/(\d+)\s*s/i);
  if (secMatch) {
    totalSeconds += parseInt(secMatch[1], 10);
  }
  
  // Handle "HH:MM:SS" or "MM:SS" format
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
  
  return totalSeconds || 0;
}
