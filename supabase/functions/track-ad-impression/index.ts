import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackImpressionRequest {
  adId: string;
  trackingId: string;
  position: 'pre' | 'mid' | 'post';
  userId?: string;
  profileId?: string;
  contentId?: string;
  channelId?: string;
  durationMs?: number;
  completed?: boolean;
  geoCountry?: string;
  geoRegion?: string;
  geoCity?: string;
  geoPostal?: string;
  timeZone?: string;
  deviceType?: string;
  membershipTier?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const request: TrackImpressionRequest = await req.json();
    const {
      adId,
      trackingId,
      position,
      userId,
      profileId,
      contentId,
      channelId,
      durationMs,
      completed,
      geoCountry,
      geoRegion,
      geoCity,
      geoPostal,
      timeZone,
      deviceType,
      membershipTier,
    } = request;

    console.log('Tracking impression:', { adId, position, userId, contentId, channelId, completed });

    // Step 1: Insert impression record
    const { data: impression, error: impressionError } = await supabase
      .from('ad_impressions')
      .insert({
        ad_id: adId,
        user_id: userId || null,
        profile_id: profileId || null,
        content_id: contentId || null,
        channel_id: channelId || null,
        position,
        played_at: new Date().toISOString(),
        duration_ms: durationMs || null,
        completed: completed || false,
        geo_country: geoCountry || null,
        geo_region: geoRegion || null,
        geo_city: geoCity || null,
        geo_postal: geoPostal || null,
        time_zone: timeZone || null,
        device_type: deviceType || null,
        membership_tier: membershipTier || null,
      })
      .select()
      .single();

    if (impressionError) {
      console.error('Error inserting impression:', impressionError);
      throw impressionError;
    }

    console.log('Impression recorded:', impression.id);

    // Step 2: Increment the ad's current_impressions counter
    const { error: updateError } = await supabase.rpc('increment_ad_impression_count', { 
      ad_id_param: adId 
    });

    // If RPC doesn't exist, fall back to direct update
    if (updateError) {
      console.log('RPC not available, using direct update');
      const { data: adData, error: fetchError } = await supabase
        .from('ads')
        .select('current_impressions')
        .eq('id', adId)
        .single();

      if (!fetchError && adData) {
        await supabase
          .from('ads')
          .update({ current_impressions: (adData.current_impressions || 0) + 1 })
          .eq('id', adId);
      }
    }

    // Step 3: Check if ad has reached max impressions and should be expired
    const { data: adData } = await supabase
      .from('ads')
      .select('max_impressions, current_impressions')
      .eq('id', adId)
      .single();

    if (adData && adData.max_impressions !== null) {
      if (adData.current_impressions >= adData.max_impressions) {
        console.log(`Ad ${adId} reached max impressions, marking as expired`);
        await supabase
          .from('ads')
          .update({ status: 'expired' })
          .eq('id', adId);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      impressionId: impression.id,
      trackingId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in track-ad-impression function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
