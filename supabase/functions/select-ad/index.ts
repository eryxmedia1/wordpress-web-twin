import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SelectAdRequest {
  position: 'pre' | 'mid' | 'post';
  userId?: string;
  profileId?: string;
  contentId?: string;
  channelId?: string;
  membershipTier?: string;
  deviceType?: string;
  geoCountry?: string;
  geoRegion?: string;
  geoCity?: string;
  geoPostal?: string;
  timeZone?: string;
}

interface Ad {
  id: string;
  name: string;
  video_url: string | null;
  vast_tag_url: string | null;
  duration_seconds: number;
  weight: number;
  position_pre: boolean;
  position_mid: boolean;
  position_post: boolean;
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

    const request: SelectAdRequest = await req.json();
    const { 
      position, 
      userId, 
      profileId, 
      contentId, 
      channelId, 
      membershipTier,
      deviceType,
      geoCountry,
      geoRegion,
      geoCity,
      geoPostal,
      timeZone
    } = request;

    console.log('Ad selection request:', { position, contentId, channelId, membershipTier, geoCountry });

    const now = new Date().toISOString();

    // Step 1: Get all active ads with correct position
    let query = supabase
      .from('ads')
      .select(`
        id,
        name,
        video_url,
        vast_tag_url,
        duration_seconds,
        weight,
        position_pre,
        position_mid,
        position_post,
        max_impressions,
        current_impressions,
        start_at,
        end_at,
        frequency_cap_per_user_per_day
      `)
      .eq('status', 'active');

    const { data: allAds, error: adsError } = await query;

    if (adsError) {
      console.error('Error fetching ads:', adsError);
      throw adsError;
    }

    if (!allAds || allAds.length === 0) {
      console.log('No active ads found');
      return new Response(JSON.stringify({ ad: null, reason: 'no_active_ads' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${allAds.length} active ads`);

    // Step 2: Filter by position
    let eligibleAds = allAds.filter(ad => {
      if (position === 'pre') return ad.position_pre;
      if (position === 'mid') return ad.position_mid;
      if (position === 'post') return ad.position_post;
      return false;
    });

    console.log(`After position filter: ${eligibleAds.length} ads`);

    if (eligibleAds.length === 0) {
      return new Response(JSON.stringify({ ad: null, reason: 'no_ads_for_position' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Filter by flight dates
    eligibleAds = eligibleAds.filter(ad => {
      if (ad.start_at && new Date(ad.start_at) > new Date(now)) return false;
      if (ad.end_at && new Date(ad.end_at) < new Date(now)) return false;
      return true;
    });

    console.log(`After flight date filter: ${eligibleAds.length} ads`);

    // Step 4: Filter by impression cap
    eligibleAds = eligibleAds.filter(ad => {
      if (ad.max_impressions === null) return true;
      return ad.current_impressions < ad.max_impressions;
    });

    console.log(`After impression cap filter: ${eligibleAds.length} ads`);

    if (eligibleAds.length === 0) {
      return new Response(JSON.stringify({ ad: null, reason: 'all_ads_capped' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 5: Get targeting data for remaining ads
    const adIds = eligibleAds.map(ad => ad.id);
    const { data: targetingData } = await supabase
      .from('ad_targeting')
      .select('*')
      .in('ad_id', adIds);

    // Step 6: Filter by targeting
    if (targetingData && targetingData.length > 0) {
      eligibleAds = eligibleAds.filter(ad => {
        const targeting = targetingData.find(t => t.ad_id === ad.id);
        if (!targeting) return true; // No targeting = show to everyone

        // Check membership tier
        if (targeting.membership_tiers && targeting.membership_tiers.length > 0 && membershipTier) {
          if (!targeting.membership_tiers.includes(membershipTier.toLowerCase())) {
            return false;
          }
        }

        // Check device type
        if (targeting.device_types && targeting.device_types.length > 0 && deviceType) {
          if (!targeting.device_types.includes(deviceType.toLowerCase())) {
            return false;
          }
        }

        // Check country
        if (targeting.countries && targeting.countries.length > 0 && geoCountry) {
          if (!targeting.countries.some((c: string) => c.toLowerCase() === geoCountry.toLowerCase())) {
            return false;
          }
        }

        // Check region
        if (targeting.regions && targeting.regions.length > 0 && geoRegion) {
          if (!targeting.regions.some((r: string) => r.toLowerCase() === geoRegion.toLowerCase())) {
            return false;
          }
        }

        // Check city
        if (targeting.cities && targeting.cities.length > 0 && geoCity) {
          if (!targeting.cities.some((c: string) => c.toLowerCase() === geoCity.toLowerCase())) {
            return false;
          }
        }

        // Check postal code
        if (targeting.postal_codes && targeting.postal_codes.length > 0 && geoPostal) {
          if (!targeting.postal_codes.some((p: string) => p.toLowerCase() === geoPostal.toLowerCase())) {
            return false;
          }
        }

        // Check timezone
        if (targeting.time_zones && targeting.time_zones.length > 0 && timeZone) {
          if (!targeting.time_zones.includes(timeZone)) {
            return false;
          }
        }

        return true;
      });

      console.log(`After targeting filter: ${eligibleAds.length} ads`);
    }

    // Step 7: Get placements for remaining ads
    const { data: placementsData } = await supabase
      .from('ad_placements')
      .select('*')
      .in('ad_id', adIds);

    // Step 8: Filter by placements
    if (placementsData && placementsData.length > 0) {
      eligibleAds = eligibleAds.filter(ad => {
        const placements = placementsData.filter(p => p.ad_id === ad.id);
        if (placements.length === 0) return true; // No placements = global

        // Check if any placement matches
        return placements.some(placement => {
          // Check position is enabled for this placement
          if (position === 'pre' && !placement.pre_enabled) return false;
          if (position === 'mid' && !placement.mid_enabled) return false;
          if (position === 'post' && !placement.post_enabled) return false;

          // Check placement type
          if (placement.placement_type === 'global') return true;
          if (placement.placement_type === 'content' && contentId && placement.content_id === contentId) return true;
          if (placement.placement_type === 'channel' && channelId && placement.channel_id === channelId) return true;

          return false;
        });
      });

      console.log(`After placement filter: ${eligibleAds.length} ads`);
    }

    if (eligibleAds.length === 0) {
      return new Response(JSON.stringify({ ad: null, reason: 'no_matching_placements' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 9: Apply frequency cap (if user is identified)
    if (userId) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: recentImpressions } = await supabase
        .from('ad_impressions')
        .select('ad_id')
        .eq('user_id', userId)
        .gte('played_at', twentyFourHoursAgo);

      if (recentImpressions && recentImpressions.length > 0) {
        const impressionCounts = recentImpressions.reduce((acc: Record<string, number>, imp) => {
          acc[imp.ad_id] = (acc[imp.ad_id] || 0) + 1;
          return acc;
        }, {});

        eligibleAds = eligibleAds.filter(ad => {
          const adData = allAds.find(a => a.id === ad.id);
          if (!adData?.frequency_cap_per_user_per_day) return true;
          const count = impressionCounts[ad.id] || 0;
          return count < adData.frequency_cap_per_user_per_day;
        });

        console.log(`After frequency cap filter: ${eligibleAds.length} ads`);
      }
    }

    if (eligibleAds.length === 0) {
      return new Response(JSON.stringify({ ad: null, reason: 'frequency_capped' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 10: Weighted random selection
    const totalWeight = eligibleAds.reduce((sum, ad) => sum + (ad.weight || 1), 0);
    let random = Math.random() * totalWeight;
    let selectedAd: Ad | null = null;

    for (const ad of eligibleAds) {
      random -= (ad.weight || 1);
      if (random <= 0) {
        selectedAd = ad;
        break;
      }
    }

    // Fallback to first ad if somehow none selected
    if (!selectedAd) {
      selectedAd = eligibleAds[0];
    }

    console.log(`Selected ad: ${selectedAd.name} (ID: ${selectedAd.id})`);

    // Return the selected ad
    const response = {
      ad: {
        id: selectedAd.id,
        name: selectedAd.name,
        type: selectedAd.vast_tag_url ? 'vast' : 'video',
        video_url: selectedAd.video_url,
        vast_tag_url: selectedAd.vast_tag_url,
        duration_seconds: selectedAd.duration_seconds,
      },
      trackingId: crypto.randomUUID(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in select-ad function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
