import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";

interface Ad {
  id: string;
  name: string;
  type: 'video' | 'vast';
  video_url: string | null;
  vast_tag_url: string | null;
  duration_seconds: number;
}

interface AdPodResponse {
  ads: Ad[];
  trackingIds: string[];
  reason?: string;
}

interface GeoData {
  country: string;
  region: string;
  city: string;
  postal: string;
  timezone: string;
}

interface PodConfig {
  prerollPodSize: number;
  midrollPodSize: number;
  postrollPodSize: number;
  midrollIntervalMinutes: number;
}

interface MidrollPodConfig {
  break1PodSize: number;
  break2PodSize: number;
  break3PodSize: number;
  break4PodSize: number;
}

interface UseAdsOptions {
  contentId?: string;
  channelId?: string;
  membershipTier?: string;
  deviceType?: 'mobile' | 'desktop' | 'tv';
  onAdStart?: () => void;
  onAdEnd?: () => void;
}

const DEFAULT_POD_CONFIG: PodConfig = {
  prerollPodSize: 1,
  midrollPodSize: 1,
  postrollPodSize: 1,
  midrollIntervalMinutes: 10,
};

const DEFAULT_MIDROLL_POD_CONFIG: MidrollPodConfig = {
  break1PodSize: 2,
  break2PodSize: 3,
  break3PodSize: 5,
  break4PodSize: 3,
};

export function useAds(options: UseAdsOptions = {}) {
  const { currentProfile } = useProfile();
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [trackingIds, setTrackingIds] = useState<string[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adQueue, setAdQueue] = useState<Ad[]>([]);
  const [adPosition, setAdPosition] = useState<'pre' | 'mid' | 'post' | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [geoFetched, setGeoFetched] = useState(false);
  const [podConfig, setPodConfig] = useState<PodConfig>(DEFAULT_POD_CONFIG);
  const [midrollPodConfig, setMidrollPodConfig] = useState<MidrollPodConfig>(DEFAULT_MIDROLL_POD_CONFIG);
  const [podConfigFetched, setPodConfigFetched] = useState(false);
  const [midrollBreakCount, setMidrollBreakCount] = useState(0);

  // Detect device type
  const getDeviceType = useCallback((): 'mobile' | 'desktop' | 'tv' => {
    if (options.deviceType) return options.deviceType;
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 'mobile';
    }
    return 'desktop';
  }, [options.deviceType]);

  // Fetch geo data once
  useEffect(() => {
    if (geoFetched) return;
    
    const fetchGeo = async () => {
      try {
        const funcUrl = 'https://hbddjtvslojxkkcrpcoo.supabase.co/functions/v1/detect-geo';
        const res = await fetch(funcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZGRqdHZzbG9qeGtrY3JwY29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjUxNjcsImV4cCI6MjA2MjYwMTE2N30.TC4eACBOJsfggnuB3OyOK7x4O9yp7bjzOP5Tr9_jHds',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setGeoData({
            country: data.country || 'US',
            region: data.region || '',
            city: data.city || '',
            postal: data.postal || '',
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
        }
      } catch (error) {
        console.error('Error fetching geo:', error);
        // Use defaults
        setGeoData({
          country: 'US',
          region: '',
          city: '',
          postal: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      }
      setGeoFetched(true);
    };

    fetchGeo();
  }, [geoFetched]);

  // Fetch pod configuration including progressive midroll config
  useEffect(() => {
    if (podConfigFetched) return;
    
    const fetchPodConfig = async () => {
      try {
        // First try content-specific config
        if (options.contentId) {
          const { data: contentConfig } = await supabase
            .from('ad_pod_config')
            .select('*')
            .eq('content_id', options.contentId)
            .eq('enabled', true)
            .maybeSingle();
          
          if (contentConfig) {
            setPodConfig({
              prerollPodSize: contentConfig.preroll_pod_size || 1,
              midrollPodSize: contentConfig.midroll_pod_size || 1,
              postrollPodSize: contentConfig.postroll_pod_size || 1,
              midrollIntervalMinutes: contentConfig.midroll_interval_minutes || 10,
            });
          }
        }

        // Then try channel-specific config
        if (options.channelId) {
          const { data: channelConfig } = await supabase
            .from('ad_pod_config')
            .select('*')
            .eq('channel_id', options.channelId)
            .eq('enabled', true)
            .maybeSingle();
          
          if (channelConfig) {
            setPodConfig({
              prerollPodSize: channelConfig.preroll_pod_size || 1,
              midrollPodSize: channelConfig.midroll_pod_size || 1,
              postrollPodSize: channelConfig.postroll_pod_size || 1,
              midrollIntervalMinutes: channelConfig.midroll_interval_minutes || 10,
            });
          }
        }

        // Fetch progressive midroll pod config
        // First try content-specific
        if (options.contentId) {
          const { data: contentMidroll } = await supabase
            .from('ad_midroll_pod_config')
            .select('*')
            .eq('content_id', options.contentId)
            .maybeSingle();
          
          if (contentMidroll) {
            setMidrollPodConfig({
              break1PodSize: contentMidroll.break_1_pod_size || 2,
              break2PodSize: contentMidroll.break_2_pod_size || 3,
              break3PodSize: contentMidroll.break_3_pod_size || 5,
              break4PodSize: contentMidroll.break_4_pod_size || 3,
            });
            setPodConfigFetched(true);
            return;
          }
        }

        // Then try channel-specific
        if (options.channelId) {
          const { data: channelMidroll } = await supabase
            .from('ad_midroll_pod_config')
            .select('*')
            .eq('channel_id', options.channelId)
            .maybeSingle();
          
          if (channelMidroll) {
            setMidrollPodConfig({
              break1PodSize: channelMidroll.break_1_pod_size || 2,
              break2PodSize: channelMidroll.break_2_pod_size || 3,
              break3PodSize: channelMidroll.break_3_pod_size || 5,
              break4PodSize: channelMidroll.break_4_pod_size || 3,
            });
            setPodConfigFetched(true);
            return;
          }
        }

        // Fall back to global config
        const { data: globalConfig } = await supabase
          .from('ad_global_config')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (globalConfig) {
          setPodConfig({
            prerollPodSize: globalConfig.preroll_pod_size || 1,
            midrollPodSize: globalConfig.midroll_pod_size || 1,
            postrollPodSize: globalConfig.postroll_pod_size || 1,
            midrollIntervalMinutes: globalConfig.midroll_interval_minutes || 10,
          });
        }

        // Fetch global progressive midroll config
        const { data: globalMidroll } = await supabase
          .from('ad_midroll_pod_config')
          .select('*')
          .eq('is_global', true)
          .maybeSingle();
        
        if (globalMidroll) {
          setMidrollPodConfig({
            break1PodSize: globalMidroll.break_1_pod_size || 2,
            break2PodSize: globalMidroll.break_2_pod_size || 3,
            break3PodSize: globalMidroll.break_3_pod_size || 5,
            break4PodSize: globalMidroll.break_4_pod_size || 3,
          });
        }
      } catch (error) {
        console.error('Error fetching pod config:', error);
      }
      setPodConfigFetched(true);
    };

    fetchPodConfig();
  }, [options.contentId, options.channelId, podConfigFetched]);

  // Get progressive pod size based on break number
  const getProgressivePodSize = useCallback((breakNumber: number): number => {
    switch (breakNumber) {
      case 1: return midrollPodConfig.break1PodSize;
      case 2: return midrollPodConfig.break2PodSize;
      case 3: return midrollPodConfig.break3PodSize;
      case 4: return midrollPodConfig.break4PodSize;
      default: return midrollPodConfig.break4PodSize; // Use break 4 size for 5+
    }
  }, [midrollPodConfig]);

  // Fetch ads from the select-ad edge function
  const fetchAdPod = useCallback(async (position: 'pre' | 'mid' | 'post', podSize: number): Promise<AdPodResponse | null> => {
    try {
      const session = await supabase.auth.getSession();
      const funcUrl = 'https://hbddjtvslojxkkcrpcoo.supabase.co/functions/v1/select-ad';
      
      const requestBody = {
        position,
        podSize,
        userId: session.data.session?.user?.id || null,
        profileId: currentProfile?.id || null,
        contentId: options.contentId || null,
        channelId: options.channelId || null,
        membershipTier: options.membershipTier || 'free',
        deviceType: getDeviceType(),
        timeZone: geoData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        geoCountry: geoData?.country || null,
        geoRegion: geoData?.region || null,
        geoCity: geoData?.city || null,
        geoPostal: geoData?.postal || null,
      };

      const res = await fetch(funcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token || ''}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZGRqdHZzbG9qeGtrY3JwY29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjUxNjcsImV4cCI6MjA2MjYwMTE2N30.TC4eACBOJsfggnuB3OyOK7x4O9yp7bjzOP5Tr9_jHds',
        },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        const data = await res.json();
        return data as AdPodResponse;
      }
      
      console.log('No ads available:', res.status);
      return null;
    } catch (error) {
      console.error('Error fetching ads:', error);
      return null;
    }
  }, [currentProfile?.id, options.contentId, options.channelId, options.membershipTier, getDeviceType, geoData]);

  // Track an ad impression
  const trackImpression = useCallback(async (adId: string, trackingIdParam: string, position: 'pre' | 'mid' | 'post', durationMs?: number, completed?: boolean) => {
    try {
      const session = await supabase.auth.getSession();
      const funcUrl = 'https://hbddjtvslojxkkcrpcoo.supabase.co/functions/v1/track-ad-impression';
      
      await fetch(funcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token || ''}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZGRqdHZzbG9qeGtrY3JwY29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjUxNjcsImV4cCI6MjA2MjYwMTE2N30.TC4eACBOJsfggnuB3OyOK7x4O9yp7bjzOP5Tr9_jHds',
        },
        body: JSON.stringify({
          adId,
          trackingId: trackingIdParam,
          position,
          userId: session.data.session?.user?.id || null,
          profileId: currentProfile?.id || null,
          contentId: options.contentId || null,
          channelId: options.channelId || null,
          durationMs,
          completed,
          deviceType: getDeviceType(),
          membershipTier: options.membershipTier || 'free',
          timeZone: geoData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          geoCountry: geoData?.country || null,
          geoRegion: geoData?.region || null,
          geoCity: geoData?.city || null,
          geoPostal: geoData?.postal || null,
        }),
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  }, [currentProfile?.id, options.contentId, options.channelId, options.membershipTier, getDeviceType, geoData]);

  // Start playing the first ad in the queue
  const startAdPod = useCallback((ads: Ad[], ids: string[], position: 'pre' | 'mid' | 'post') => {
    if (ads.length === 0) return false;
    
    setAdQueue(ads);
    setTrackingIds(ids);
    setCurrentAdIndex(0);
    setCurrentAd(ads[0]);
    setAdPosition(position);
    setIsAdPlaying(true);
    setShowCountdown(false);
    options.onAdStart?.();
    
    // Track first ad impression
    trackImpression(ads[0].id, ids[0], position);
    return true;
  }, [trackImpression, options]);

  // Request pre-roll ad pod
  const requestPreRoll = useCallback(async (): Promise<boolean> => {
    const response = await fetchAdPod('pre', podConfig.prerollPodSize);
    if (response?.ads && response.ads.length > 0) {
      return startAdPod(response.ads, response.trackingIds, 'pre');
    }
    return false;
  }, [fetchAdPod, podConfig.prerollPodSize, startAdPod]);

  // Request mid-roll ad pod with progressive pod sizes
  const requestMidRoll = useCallback(async (countdownDuration: number = 10): Promise<boolean> => {
    // Increment break count and get progressive pod size
    const nextBreakNumber = midrollBreakCount + 1;
    const podSize = getProgressivePodSize(nextBreakNumber);
    
    console.log(`Mid-roll break #${nextBreakNumber}, pod size: ${podSize}`);
    
    const response = await fetchAdPod('mid', podSize);
    if (response?.ads && response.ads.length > 0) {
      setMidrollBreakCount(nextBreakNumber);
      // Start countdown
      setCountdownSeconds(countdownDuration);
      setShowCountdown(true);
      setAdQueue(response.ads);
      setTrackingIds(response.trackingIds);
      setAdPosition('mid');
      return true;
    }
    return false;
  }, [fetchAdPod, midrollBreakCount, getProgressivePodSize]);

  // Request post-roll ad pod
  const requestPostRoll = useCallback(async (): Promise<boolean> => {
    const response = await fetchAdPod('post', podConfig.postrollPodSize);
    if (response?.ads && response.ads.length > 0) {
      return startAdPod(response.ads, response.trackingIds, 'post');
    }
    return false;
  }, [fetchAdPod, podConfig.postrollPodSize, startAdPod]);

  // Reset midroll break count (call when starting new content)
  const resetMidrollCount = useCallback(() => {
    setMidrollBreakCount(0);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdownSeconds > 0 && showCountdown) {
      const timer = setTimeout(() => {
        setCountdownSeconds(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdownSeconds === 0 && showCountdown && adQueue.length > 0) {
      // Countdown finished, start playing ad pod
      setCurrentAdIndex(0);
      setCurrentAd(adQueue[0]);
      setShowCountdown(false);
      setIsAdPlaying(true);
      options.onAdStart?.();
      // Track first ad impression
      if (trackingIds[0]) {
        trackImpression(adQueue[0].id, trackingIds[0], adPosition || 'mid');
      }
    }
  }, [countdownSeconds, showCountdown, adQueue, adPosition, options, trackImpression, trackingIds]);

  // Called when current ad finishes playing
  const onAdComplete = useCallback(() => {
    if (currentAd && trackingIds[currentAdIndex] && adPosition) {
      trackImpression(currentAd.id, trackingIds[currentAdIndex], adPosition, currentAd.duration_seconds * 1000, true);
    }
    
    // Check if there are more ads in the pod
    const nextIndex = currentAdIndex + 1;
    if (nextIndex < adQueue.length) {
      setCurrentAdIndex(nextIndex);
      setCurrentAd(adQueue[nextIndex]);
      // Track next ad impression
      trackImpression(adQueue[nextIndex].id, trackingIds[nextIndex], adPosition || 'mid');
    } else {
      // Pod complete
      setCurrentAd(null);
      setTrackingIds([]);
      setCurrentAdIndex(0);
      setIsAdPlaying(false);
      setAdQueue([]);
      setAdPosition(null);
      options.onAdEnd?.();
    }
  }, [currentAd, currentAdIndex, trackingIds, adPosition, adQueue, trackImpression, options]);

  // Skip ad (for premium users)
  const skipAd = useCallback(() => {
    onAdComplete();
  }, [onAdComplete]);

  return {
    currentAd,
    isAdPlaying,
    adPosition,
    countdownSeconds,
    showCountdown,
    adQueueLength: adQueue.length,
    currentAdIndex: currentAdIndex + 1, // 1-indexed for display
    podConfig,
    midrollPodConfig,
    midrollBreakCount,
    requestPreRoll,
    requestMidRoll,
    requestPostRoll,
    onAdComplete,
    skipAd,
    resetMidrollCount,
  };
}