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

    // Get all active viewers with user and profile info
    const { data: activeViewers, error } = await supabase
      .from('live_channel_active_viewers')
      .select(`
        id,
        session_id,
        live_channel_id,
        user_id,
        profile_id,
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

    // Get user profiles (accounts)
    const userIds = [...new Set(activeViewers?.map(v => v.user_id).filter(Boolean) || [])]
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])
    
    const userMap = new Map(userProfiles?.map(u => [u.id, u]) || [])

    // Get user viewing profiles
    const profileIds = [...new Set(activeViewers?.map(v => v.profile_id).filter(Boolean) || [])]
    const { data: viewingProfiles } = await supabase
      .from('user_profiles')
      .select('id, name, avatar_color, avatar_icon, account_id')
      .in('id', profileIds.length > 0 ? profileIds : ['00000000-0000-0000-0000-000000000000'])
    
    const profileMap = new Map(viewingProfiles?.map(p => [p.id, p]) || [])

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
      viewers: Array<{
        session_id: string;
        user_email: string | null;
        user_name: string | null;
        profile_name: string | null;
        profile_color: string | null;
        device_type: string;
        geo_country: string | null;
        geo_region: string | null;
        geo_city: string | null;
        started_at: string;
        watch_duration_seconds: number;
      }>;
    }> = {}

    let totalViewers = 0
    const totalDevices: Record<string, number> = {}
    const totalCountries: Record<string, number> = {}
    
    // All viewers list for admin
    const allViewers: Array<{
      session_id: string;
      channel_id: string;
      channel_name: string;
      user_id: string | null;
      user_email: string | null;
      user_name: string | null;
      profile_id: string | null;
      profile_name: string | null;
      profile_color: string | null;
      device_type: string;
      geo_country: string | null;
      geo_region: string | null;
      geo_city: string | null;
      started_at: string;
      watch_duration_seconds: number;
    }> = []

    for (const viewer of activeViewers || []) {
      totalViewers++
      
      const channelId = viewer.live_channel_id
      const channel = channelMap.get(channelId)
      const user = viewer.user_id ? userMap.get(viewer.user_id) : null
      const profile = viewer.profile_id ? profileMap.get(viewer.profile_id) : null
      
      // Calculate watch duration
      const startedAt = new Date(viewer.started_at)
      const watchDurationSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000)
      
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
          cities: {},
          viewers: []
        }
      }

      channelStats[channelId].viewer_count++
      
      // Add viewer details
      const viewerDetail = {
        session_id: viewer.session_id,
        user_email: user?.email || null,
        user_name: user?.full_name || null,
        profile_name: profile?.name || null,
        profile_color: profile?.avatar_color || null,
        device_type: viewer.device_type || 'unknown',
        geo_country: viewer.geo_country,
        geo_region: viewer.geo_region,
        geo_city: viewer.geo_city,
        started_at: viewer.started_at,
        watch_duration_seconds: watchDurationSeconds
      }
      
      channelStats[channelId].viewers.push(viewerDetail)
      
      // Add to all viewers list
      allViewers.push({
        ...viewerDetail,
        channel_id: channelId,
        channel_name: channel?.name || 'Unknown',
        user_id: viewer.user_id,
        profile_id: viewer.profile_id
      })
      
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
      all_viewers: allViewers.sort((a, b) => b.watch_duration_seconds - a.watch_duration_seconds),
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
