import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const MUX_TOKEN_ID = Deno.env.get('MUX_TOKEN_ID');
    const MUX_TOKEN_SECRET = Deno.env.get('MUX_TOKEN_SECRET');
    
    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      console.error('Missing Mux credentials');
      return new Response(
        JSON.stringify({ error: 'Mux credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, channelId } = await req.json();
    console.log(`Mux action: ${action}, channelId: ${channelId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Base64 encode credentials for Mux API
    const credentials = btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);

    if (action === 'create') {
      // Create a new Mux Live Stream
      console.log('Creating new Mux live stream...');
      
      const muxResponse = await fetch('https://api.mux.com/video/v1/live-streams', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playback_policy: ['public'],
          new_asset_settings: {
            playback_policy: ['public'],
          },
          reconnect_window: 60,
          latency_mode: 'low',
        }),
      });

      if (!muxResponse.ok) {
        const errorText = await muxResponse.text();
        console.error('Mux API error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to create Mux stream', details: errorText }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const muxData = await muxResponse.json();
      console.log('Mux stream created:', muxData.data.id);

      const streamData = muxData.data;
      const rtmpUrl = 'rtmps://global-live.mux.com:443/app';
      const streamKey = streamData.stream_key;
      const playbackId = streamData.playback_ids?.[0]?.id;
      const playbackUrl = playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null;

      // Update the channel in the database
      if (channelId) {
        const { error: updateError } = await supabase
          .from('live_channels')
          .update({
            mux_stream_id: streamData.id,
            rtmp_url: rtmpUrl,
            stream_key: streamKey,
            playback_url: playbackUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', channelId);

        if (updateError) {
          console.error('Database update error:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update channel', details: updateError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          stream_id: streamData.id,
          rtmp_url: rtmpUrl,
          stream_key: streamKey,
          playback_url: playbackUrl,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'status') {
      // Get the channel's Mux stream status
      const { data: channel, error: fetchError } = await supabase
        .from('live_channels')
        .select('mux_stream_id')
        .eq('id', channelId)
        .single();

      if (fetchError || !channel?.mux_stream_id) {
        return new Response(
          JSON.stringify({ error: 'Channel or stream not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const muxResponse = await fetch(`https://api.mux.com/video/v1/live-streams/${channel.mux_stream_id}`, {
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });

      if (!muxResponse.ok) {
        const errorText = await muxResponse.text();
        console.error('Mux status error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to get stream status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const statusData = await muxResponse.json();
      const isLive = statusData.data.status === 'active';

      // Update is_live_streaming in database
      await supabase
        .from('live_channels')
        .update({ is_live_streaming: isLive })
        .eq('id', channelId);

      return new Response(
        JSON.stringify({
          status: statusData.data.status,
          is_live: isLive,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'delete') {
      // Delete the Mux stream
      const { data: channel, error: fetchError } = await supabase
        .from('live_channels')
        .select('mux_stream_id')
        .eq('id', channelId)
        .single();

      if (fetchError || !channel?.mux_stream_id) {
        return new Response(
          JSON.stringify({ success: true, message: 'No stream to delete' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const muxResponse = await fetch(`https://api.mux.com/video/v1/live-streams/${channel.mux_stream_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });

      // Clear the stream data from the database
      await supabase
        .from('live_channels')
        .update({
          mux_stream_id: null,
          rtmp_url: null,
          stream_key: null,
          playback_url: null,
          is_live_streaming: false,
        })
        .eq('id', channelId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
