import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get viewers with heartbeat within last 2 minutes (active)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    // First, clean up stale sessions (older than 2 minutes)
    await supabase
      .from('live_channel_active_viewers')
      .delete()
      .lt('last_heartbeat', twoMinutesAgo)

    // Get all active viewers
    const { data: activeViewers, error } = await supabase
      .from('live_channel_active_viewers')
      .select(`
        id,
        live_channel_id,
        device_type,
        geo_country,
        geo_region,
        geo_city,
        started_at,
        last_heartbeat
      `)
      .gte('last_heartbeat', twoMinutesAgo)

    if (error) {
      console.error('Error fetching active viewers:', error)
      throw error
    }

    // Get channel info
    const { data: channels } = await supabase
      .from('live_channels')
      .select('id, name, slug, logo_url')

    const channelMap = new Map(channels?.map(c => [c.id, c]) || [])

    // Group by channel
    const channelStats: Record<string, {
      channel_id: string;
      channel_name: string;
      channel_slug: string;
      logo_url: string | null;
      viewer_count: number;
      devices: Record<string, number>;
      countries: Record<string, number>;
      regions: Record<string, number>;
      cities: Record<string, number>;
    }> = {}

    let totalViewers = 0
    const totalDevices: Record<string, number> = {}
    const totalCountries: Record<string, number> = {}

    for (const viewer of activeViewers || []) {
      totalViewers++
      
      const channelId = viewer.live_channel_id
      const channel = channelMap.get(channelId)
      
      if (!channelStats[channelId]) {
        channelStats[channelId] = {
          channel_id: channelId,
          channel_name: channel?.name || 'Unknown',
          channel_slug: channel?.slug || '',
          logo_url: channel?.logo_url || null,
          viewer_count: 0,
          devices: {},
          countries: {},
          regions: {},
          cities: {}
        }
      }

      channelStats[channelId].viewer_count++
      
      // Device breakdown
      const device = viewer.device_type || 'unknown'
      channelStats[channelId].devices[device] = (channelStats[channelId].devices[device] || 0) + 1
      totalDevices[device] = (totalDevices[device] || 0) + 1
      
      // Geo breakdown
      if (viewer.geo_country) {
        channelStats[channelId].countries[viewer.geo_country] = (channelStats[channelId].countries[viewer.geo_country] || 0) + 1
        totalCountries[viewer.geo_country] = (totalCountries[viewer.geo_country] || 0) + 1
      }
      if (viewer.geo_region) {
        channelStats[channelId].regions[viewer.geo_region] = (channelStats[channelId].regions[viewer.geo_region] || 0) + 1
      }
      if (viewer.geo_city) {
        channelStats[channelId].cities[viewer.geo_city] = (channelStats[channelId].cities[viewer.geo_city] || 0) + 1
      }
    }

    const response = {
      total_viewers: totalViewers,
      total_devices: totalDevices,
      total_countries: totalCountries,
      channels: Object.values(channelStats).sort((a, b) => b.viewer_count - a.viewer_count),
      timestamp: new Date().toISOString()
    }

    console.log('Active viewers response:', response)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in get-active-viewers:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})