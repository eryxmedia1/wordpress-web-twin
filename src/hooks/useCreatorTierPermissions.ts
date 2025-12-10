import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CreatorTierPermissions {
  tier: 'basic' | 'pro' | 'enterprise' | null;
  maxTotalVideos: number;
  maxRows: number;
  maxVideosPerRow: number;
  canGoLive: boolean;
  canUploadShows: boolean;
  allowAds: boolean;
  revenueShareEligible: boolean;
  analyticsLevel: 'basic' | 'full' | 'advanced';
  customBranding: boolean;
}

interface CreatorPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  max_total_videos: number;
  max_rows: number;
  max_videos_per_row: number;
  can_go_live: boolean;
  can_upload_shows: boolean;
  allow_ads: boolean;
  revenue_share_eligible: boolean;
  analytics_level: string;
  custom_branding: boolean;
  features: string[];
}

const DEFAULT_PERMISSIONS: CreatorTierPermissions = {
  tier: null,
  maxTotalVideos: 0,
  maxRows: 0,
  maxVideosPerRow: 0,
  canGoLive: false,
  canUploadShows: false,
  allowAds: false,
  revenueShareEligible: false,
  analyticsLevel: 'basic',
  customBranding: false,
};

const TIER_PERMISSIONS: Record<string, Omit<CreatorTierPermissions, 'tier'>> = {
  basic: {
    maxTotalVideos: 100,
    maxRows: 5,
    maxVideosPerRow: 20,
    canGoLive: false,
    canUploadShows: false,
    allowAds: false,
    revenueShareEligible: false,
    analyticsLevel: 'basic',
    customBranding: false,
  },
  pro: {
    maxTotalVideos: 500,
    maxRows: 10,
    maxVideosPerRow: 50,
    canGoLive: false,
    canUploadShows: true,
    allowAds: true,
    revenueShareEligible: true,
    analyticsLevel: 'full',
    customBranding: false,
  },
  enterprise: {
    maxTotalVideos: 1000,
    maxRows: 20,
    maxVideosPerRow: 50,
    canGoLive: true,
    canUploadShows: true,
    allowAds: true,
    revenueShareEligible: true,
    analyticsLevel: 'advanced',
    customBranding: true,
  },
};

export const useCreatorTierPermissions = (channelId?: string) => {
  const [permissions, setPermissions] = useState<CreatorTierPermissions>(DEFAULT_PERMISSIONS);
  const [allPlans, setAllPlans] = useState<CreatorPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreatorPlans();
  }, []);

  useEffect(() => {
    if (channelId) {
      fetchChannelPermissions(channelId);
    }
  }, [channelId]);

  const fetchCreatorPlans = async () => {
    const { data } = await supabase
      .from('creator_plans')
      .select('*')
      .order('sort_order');
    
    if (data) {
      setAllPlans(data as CreatorPlan[]);
    }
  };

  const fetchChannelPermissions = async (id: string) => {
    // Get channel settings which may override tier defaults
    const { data: channel } = await supabase
      .from('indie_channels')
      .select('max_total_videos, max_rows, max_videos_per_row, can_go_live, allow_ads, analytics_access, custom_branding_enabled, owner_id')
      .eq('id', id)
      .single();

    if (channel) {
      // Use channel-specific settings (set by admin) as overrides
      setPermissions({
        tier: 'basic', // Default tier, would need to fetch from profile
        maxTotalVideos: channel.max_total_videos || 100,
        maxRows: channel.max_rows || 5,
        maxVideosPerRow: channel.max_videos_per_row || 20,
        canGoLive: channel.can_go_live || false,
        canUploadShows: true, // Determined by tier
        allowAds: channel.allow_ads ?? true,
        revenueShareEligible: channel.allow_ads ?? true,
        analyticsLevel: channel.analytics_access ? 'full' : 'basic',
        customBranding: channel.custom_branding_enabled || false,
      });
    }
    setLoading(false);
  };

  const canUploadMoreVideos = (currentCount: number) => currentCount < permissions.maxTotalVideos;
  
  const canCreateMoreRows = (currentCount: number) => currentCount < permissions.maxRows;
  
  const canAddMoreVideosToRow = (currentCount: number) => currentCount < permissions.maxVideosPerRow;

  const getUpgradeReason = (feature: keyof CreatorTierPermissions): string | null => {
    if (feature === 'canGoLive' && !permissions.canGoLive) {
      return 'Upgrade to Enterprise ($995/mo) for live streaming capabilities';
    }
    if (feature === 'canUploadShows' && !permissions.canUploadShows) {
      return 'Upgrade to Professional ($495/mo) to upload TV shows with episodes';
    }
    if (feature === 'allowAds' && !permissions.allowAds) {
      return 'Upgrade to Professional ($495/mo) to enable ads and revenue sharing';
    }
    if (feature === 'customBranding' && !permissions.customBranding) {
      return 'Upgrade to Enterprise ($995/mo) for custom branding';
    }
    return null;
  };

  return {
    permissions,
    allPlans,
    loading,
    canUploadMoreVideos,
    canCreateMoreRows,
    canAddMoreVideosToRow,
    getUpgradeReason,
  };
};

export default useCreatorTierPermissions;
