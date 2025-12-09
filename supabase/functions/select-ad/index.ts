import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SelectAdRequest {
  position: 'pre' | 'mid' | 'post' | 'live';
  podSize?: number;
  userId?: string;
  profileId?: string;
  contentId?: string;
  channelId?: string;
  indieChannelId?: string;
  membershipTier?: string;
  deviceType?: string;
  geoCountry?: string;
  geoRegion?: string;
  geoCity?: string;
  geoPostal?: string;
  timeZone?: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  priority: number;
  start_at: string | null;
  end_at: string | null;
  max_impressions: number | null;
  max_impressions_per_day: number | null;
  max_impressions_per_user_per_day: number | null;
  current_impressions: number;
  current_impressions_today: number;
  last_impression_date: string | null;
  allowed_positions: string[];
  allowed_membership_tiers: string[];
  target_countries: string[];
  target_regions: string[];
  target_cities: string[];
  target_postal_codes: string[];
  target_timezones: string[];
  target_devices: string[];
}

interface Creative {
  id: string;
  name: string;
  video_url: string | null;
  vast_tag_url: string | null;
  duration_seconds: number;
  click_through_url: string | null;
}

interface CampaignCreative {
  creative_id: string;
  weight: number;
}

serve(async (req) => {
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
      podSize = 1,
      userId, 
      profileId, 
      contentId, 
      channelId,
      indieChannelId,
      membershipTier = 'free',
      deviceType,
      geoCountry,
      geoRegion,
      geoCity,
      geoPostal,
      timeZone
    } = request;

    // Map position to campaign format
    const positionKey = position === 'live' ? 'live_break' : `${position}_roll`;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    console.log('Campaign ad selection request:', { position: positionKey, podSize, contentId, channelId, membershipTier, geoCountry });

    // Step 1: Get all active campaigns
    const { data: allCampaigns, error: campaignsError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('status', 'active')
      .order('priority', { ascending: false });

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      throw campaignsError;
    }

    if (!allCampaigns || allCampaigns.length === 0) {
      console.log('No active campaigns, falling back to legacy ad selection');
      return await legacyAdSelection(supabase, request);
    }

    console.log(`Found ${allCampaigns.length} active campaigns`);

    // Step 2: Filter campaigns by eligibility
    let eligibleCampaigns = allCampaigns.filter((campaign: Campaign) => {
      // Check flight dates
      if (campaign.start_at && new Date(campaign.start_at) > new Date(now)) return false;
      if (campaign.end_at && new Date(campaign.end_at) < new Date(now)) return false;

      // Check position
      if (!campaign.allowed_positions.includes(positionKey)) return false;

      // Check membership tier
      if (campaign.allowed_membership_tiers.length > 0) {
        if (!campaign.allowed_membership_tiers.includes(membershipTier.toLowerCase())) return false;
      }

      // Check max impressions
      if (campaign.max_impressions !== null && campaign.current_impressions >= campaign.max_impressions) return false;

      // Check daily impressions (reset if new day)
      if (campaign.max_impressions_per_day !== null) {
        const lastDate = campaign.last_impression_date;
        const todayImpressions = lastDate === today ? campaign.current_impressions_today : 0;
        if (todayImpressions >= campaign.max_impressions_per_day) return false;
      }

      // Check device targeting
      if (campaign.target_devices.length > 0 && deviceType) {
        if (!campaign.target_devices.includes(deviceType.toLowerCase())) return false;
      }

      // Check geo targeting - country
      if (campaign.target_countries.length > 0 && geoCountry) {
        if (!campaign.target_countries.some(c => c.toLowerCase() === geoCountry.toLowerCase())) return false;
      }

      // Check geo targeting - region
      if (campaign.target_regions.length > 0 && geoRegion) {
        if (!campaign.target_regions.some(r => r.toLowerCase() === geoRegion.toLowerCase())) return false;
      }

      // Check geo targeting - city
      if (campaign.target_cities.length > 0 && geoCity) {
        if (!campaign.target_cities.some(c => c.toLowerCase() === geoCity.toLowerCase())) return false;
      }

      // Check geo targeting - postal
      if (campaign.target_postal_codes.length > 0 && geoPostal) {
        if (!campaign.target_postal_codes.some(p => p.toLowerCase() === geoPostal.toLowerCase())) return false;
      }

      // Check timezone targeting
      if (campaign.target_timezones.length > 0 && timeZone) {
        if (!campaign.target_timezones.includes(timeZone)) return false;
      }

      return true;
    });

    console.log(`After basic filters: ${eligibleCampaigns.length} campaigns`);

    if (eligibleCampaigns.length === 0) {
      console.log('No eligible campaigns after basic filters, falling back to legacy');
      return await legacyAdSelection(supabase, request);
    }

    // Step 3: Filter by channel/content targeting
    const campaignIds = eligibleCampaigns.map(c => c.id);
    
    const [channelsRes, contentRes] = await Promise.all([
      supabase.from('campaign_channels').select('*').in('campaign_id', campaignIds),
      supabase.from('campaign_content_items').select('*').in('campaign_id', campaignIds),
    ]);

    const channelTargeting = channelsRes.data || [];
    const contentTargeting = contentRes.data || [];

    eligibleCampaigns = eligibleCampaigns.filter((campaign: Campaign) => {
      const campaignChannels = channelTargeting.filter(ct => ct.campaign_id === campaign.id);
      const campaignContent = contentTargeting.filter(ct => ct.campaign_id === campaign.id);

      // If no targeting specified, it's global - show everywhere
      if (campaignChannels.length === 0 && campaignContent.length === 0) return true;

      // Check channel targeting
      if (campaignChannels.length > 0 && (channelId || indieChannelId)) {
        const matchesChannel = campaignChannels.some(ct => 
          ct.channel_id === channelId || ct.channel_id === indieChannelId
        );
        if (matchesChannel) return true;
      }

      // Check content targeting
      if (campaignContent.length > 0 && contentId) {
        const matchesContent = campaignContent.some(ct => ct.content_id === contentId);
        if (matchesContent) return true;
      }

      // If targeting is specified but no match, exclude this campaign
      return campaignChannels.length === 0 && campaignContent.length === 0;
    });

    console.log(`After channel/content targeting: ${eligibleCampaigns.length} campaigns`);

    if (eligibleCampaigns.length === 0) {
      console.log('No eligible campaigns after targeting, falling back to legacy');
      return await legacyAdSelection(supabase, request);
    }

    // Step 4: Check user frequency caps
    if (userId) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: recentImpressions } = await supabase
        .from('ad_impressions')
        .select('campaign_id')
        .eq('user_id', userId)
        .gte('played_at', twentyFourHoursAgo);

      if (recentImpressions && recentImpressions.length > 0) {
        const impressionCounts = recentImpressions.reduce((acc: Record<string, number>, imp) => {
          if (imp.campaign_id) {
            acc[imp.campaign_id] = (acc[imp.campaign_id] || 0) + 1;
          }
          return acc;
        }, {});

        eligibleCampaigns = eligibleCampaigns.filter((campaign: Campaign) => {
          if (!campaign.max_impressions_per_user_per_day) return true;
          const count = impressionCounts[campaign.id] || 0;
          return count < campaign.max_impressions_per_user_per_day;
        });

        console.log(`After user frequency cap: ${eligibleCampaigns.length} campaigns`);
      }
    }

    if (eligibleCampaigns.length === 0) {
      console.log('No eligible campaigns after frequency cap, falling back to legacy');
      return await legacyAdSelection(supabase, request);
    }

    // Step 5: Select campaign by highest priority (already sorted)
    const selectedCampaign = eligibleCampaigns[0];
    console.log(`Selected campaign: ${selectedCampaign.name} (priority: ${selectedCampaign.priority})`);

    // Step 6: Get creatives for the selected campaign
    const { data: campaignCreatives } = await supabase
      .from('campaign_creatives')
      .select('creative_id, weight')
      .eq('campaign_id', selectedCampaign.id);

    if (!campaignCreatives || campaignCreatives.length === 0) {
      console.log('No creatives attached to campaign, falling back to legacy');
      return await legacyAdSelection(supabase, request);
    }

    // Get creative details
    const creativeIds = campaignCreatives.map(cc => cc.creative_id);
    const { data: creatives } = await supabase
      .from('ads')
      .select('id, name, video_url, vast_tag_url, duration_seconds, click_through_url')
      .in('id', creativeIds)
      .eq('status', 'active');

    if (!creatives || creatives.length === 0) {
      console.log('No active creatives found, falling back to legacy');
      return await legacyAdSelection(supabase, request);
    }

    // Step 7: Select creatives by weight for the pod
    const selectedAds: Creative[] = [];
    let remainingCreatives = creatives.map(c => ({
      ...c,
      weight: campaignCreatives.find(cc => cc.creative_id === c.id)?.weight || 1
    }));

    for (let i = 0; i < podSize && remainingCreatives.length > 0; i++) {
      const totalWeight = remainingCreatives.reduce((sum, c) => sum + c.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedCreative = remainingCreatives[0];

      for (const creative of remainingCreatives) {
        random -= creative.weight;
        if (random <= 0) {
          selectedCreative = creative;
          break;
        }
      }

      selectedAds.push(selectedCreative);
      remainingCreatives = remainingCreatives.filter(c => c.id !== selectedCreative.id);
    }

    console.log(`Selected ${selectedAds.length} ads from campaign ${selectedCampaign.name}`);

// Helper function to transform Vimeo URLs to playable format
    const transformVimeoUrl = (url: string | null): string | null => {
      if (!url) return null;
      
      // If already in player format, return as-is
      if (url.includes('player.vimeo.com')) return url;
      
      // Extract video ID from various Vimeo URL formats
      const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      if (vimeoMatch && vimeoMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      }
      
      return url;
    };

    // Return the selected ads with campaign info
    const response = {
      ads: selectedAds.map(ad => ({
        id: ad.id,
        name: ad.name,
        type: ad.vast_tag_url ? 'vast' : 'video',
        video_url: transformVimeoUrl(ad.video_url),
        vast_tag_url: ad.vast_tag_url,
        duration_seconds: ad.duration_seconds,
        click_through_url: ad.click_through_url,
      })),
      trackingIds: selectedAds.map(() => crypto.randomUUID()),
      campaignId: selectedCampaign.id,
      campaignName: selectedCampaign.name,
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

// Fallback to legacy ad selection if no campaigns match
async function legacyAdSelection(supabase: any, request: SelectAdRequest) {
  const { 
    position, 
    podSize = 1,
    userId, 
    contentId, 
    channelId,
    indieChannelId,
    membershipTier,
    deviceType,
    geoCountry,
    geoRegion,
    geoCity,
    geoPostal,
    timeZone
  } = request;

  const now = new Date().toISOString();

  // Get all active ads with correct position
  let query = supabase
    .from('ads')
    .select(`
      id, name, video_url, vast_tag_url, duration_seconds, weight,
      position_pre, position_mid, position_post,
      max_impressions, current_impressions, start_at, end_at, frequency_cap_per_user_per_day
    `)
    .eq('status', 'active');

  const { data: allAds, error: adsError } = await query;

  if (adsError || !allAds || allAds.length === 0) {
    return new Response(JSON.stringify({ ads: [], reason: 'no_active_ads' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Filter by position
  let eligibleAds = allAds.filter((ad: any) => {
    if (position === 'pre') return ad.position_pre;
    if (position === 'mid') return ad.position_mid;
    if (position === 'post') return ad.position_post;
    if (position === 'live') return ad.position_mid || ad.position_pre;
    return false;
  });

  // Filter by flight dates
  eligibleAds = eligibleAds.filter((ad: any) => {
    if (ad.start_at && new Date(ad.start_at) > new Date(now)) return false;
    if (ad.end_at && new Date(ad.end_at) < new Date(now)) return false;
    return true;
  });

  // Filter by impression cap
  eligibleAds = eligibleAds.filter((ad: any) => {
    if (ad.max_impressions === null) return true;
    return ad.current_impressions < ad.max_impressions;
  });

  if (eligibleAds.length === 0) {
    return new Response(JSON.stringify({ ads: [], reason: 'no_eligible_ads' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get targeting and placement data
  const adIds = eligibleAds.map((ad: any) => ad.id);
  const [targetingRes, placementsRes] = await Promise.all([
    supabase.from('ad_targeting').select('*').in('ad_id', adIds),
    supabase.from('ad_placements').select('*').in('ad_id', adIds),
  ]);

  const targetingData = targetingRes.data || [];
  const placementsData = placementsRes.data || [];

  // Apply targeting filters
  if (targetingData.length > 0) {
    eligibleAds = eligibleAds.filter((ad: any) => {
      const targeting = targetingData.find((t: any) => t.ad_id === ad.id);
      if (!targeting) return true;

      if (targeting.membership_tiers?.length > 0 && membershipTier) {
        if (!targeting.membership_tiers.includes(membershipTier.toLowerCase())) return false;
      }
      if (targeting.device_types?.length > 0 && deviceType) {
        if (!targeting.device_types.includes(deviceType.toLowerCase())) return false;
      }
      if (targeting.countries?.length > 0 && geoCountry) {
        if (!targeting.countries.some((c: string) => c.toLowerCase() === geoCountry.toLowerCase())) return false;
      }
      return true;
    });
  }

  // Apply placement filters
  if (placementsData.length > 0) {
    eligibleAds = eligibleAds.filter((ad: any) => {
      const placements = placementsData.filter((p: any) => p.ad_id === ad.id);
      if (placements.length === 0) return true;

      return placements.some((placement: any) => {
        if (placement.placement_type === 'global') return true;
        if (placement.all_channels && channelId) return true;
        if (placement.content_id === contentId) return true;
        if (placement.channel_id === channelId) return true;
        if (placement.indie_channel_id === indieChannelId) return true;
        return false;
      });
    });
  }

  // Apply frequency cap
  if (userId) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentImpressions } = await supabase
      .from('ad_impressions')
      .select('ad_id')
      .eq('user_id', userId)
      .gte('played_at', twentyFourHoursAgo);

    if (recentImpressions && recentImpressions.length > 0) {
      const counts = recentImpressions.reduce((acc: Record<string, number>, imp: any) => {
        acc[imp.ad_id] = (acc[imp.ad_id] || 0) + 1;
        return acc;
      }, {});

      eligibleAds = eligibleAds.filter((ad: any) => {
        if (!ad.frequency_cap_per_user_per_day) return true;
        return (counts[ad.id] || 0) < ad.frequency_cap_per_user_per_day;
      });
    }
  }

  if (eligibleAds.length === 0) {
    return new Response(JSON.stringify({ ads: [], reason: 'all_filtered' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Weighted random selection
  const selectedAds: any[] = [];
  let remaining = [...eligibleAds];

  for (let i = 0; i < podSize && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, ad) => sum + (ad.weight || 1), 0);
    let random = Math.random() * totalWeight;
    let selected = remaining[0];

    for (const ad of remaining) {
      random -= (ad.weight || 1);
      if (random <= 0) {
        selected = ad;
        break;
      }
    }

    selectedAds.push(selected);
    remaining = remaining.filter(ad => ad.id !== selected.id);
  }

  // Helper function to transform Vimeo URLs to playable format
  const transformVimeoUrl = (url: string | null): string | null => {
    if (!url) return null;
    
    // If already in player format, return as-is
    if (url.includes('player.vimeo.com')) return url;
    
    // Extract video ID from various Vimeo URL formats
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return url;
  };

  console.log(`Legacy selection: returning ${selectedAds.length} ads`);

  return new Response(JSON.stringify({
    ads: selectedAds.map(ad => ({
      id: ad.id,
      name: ad.name,
      type: ad.vast_tag_url ? 'vast' : 'video',
      video_url: transformVimeoUrl(ad.video_url),
      vast_tag_url: ad.vast_tag_url,
      duration_seconds: ad.duration_seconds,
    })),
    trackingIds: selectedAds.map(() => crypto.randomUUID()),
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
