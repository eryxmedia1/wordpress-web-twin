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

interface AdResponse {
  ad: Ad | null;
  trackingId: string;
  reason?: string;
}

interface GeoData {
  country: string;
  region: string;
  city: string;
  postal: string;
  timezone: string;
}

interface UseAdsOptions {
  contentId?: string;
  channelId?: string;
  membershipTier?: string;
  deviceType?: 'mobile' | 'desktop' | 'tv';
  onAdStart?: () => void;
  onAdEnd?: () => void;
}

export function useAds(options: UseAdsOptions = {}) {
  const { currentProfile } = useProfile();
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adQueue, setAdQueue] = useState<Ad[]>([]);
  const [adPosition, setAdPosition] = useState<'pre' | 'mid' | 'post' | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [geoFetched, setGeoFetched] = useState(false);

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

  // Fetch an ad from the select-ad edge function
  const fetchAd = useCallback(async (position: 'pre' | 'mid' | 'post'): Promise<AdResponse | null> => {
    try {
      const session = await supabase.auth.getSession();
      const funcUrl = 'https://hbddjtvslojxkkcrpcoo.supabase.co/functions/v1/select-ad';
      
      const requestBody = {
        position,
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
        return data as AdResponse;
      }
      
      console.log('No ad available:', res.status);
      return null;
    } catch (error) {
      console.error('Error fetching ad:', error);
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

  // Request pre-roll ad
  const requestPreRoll = useCallback(async (): Promise<boolean> => {
    const response = await fetchAd('pre');
    if (response?.ad) {
      setCurrentAd(response.ad);
      setTrackingId(response.trackingId);
      setAdPosition('pre');
      setIsAdPlaying(true);
      options.onAdStart?.();
      // Track impression when ad starts
      trackImpression(response.ad.id, response.trackingId, 'pre');
      return true;
    }
    return false;
  }, [fetchAd, trackImpression, options]);

  // Request mid-roll ad with countdown
  const requestMidRoll = useCallback(async (countdownDuration: number = 10): Promise<boolean> => {
    const response = await fetchAd('mid');
    if (response?.ad) {
      // Start countdown
      setCountdownSeconds(countdownDuration);
      setShowCountdown(true);
      setAdQueue([response.ad]);
      setAdPosition('mid');
      return true;
    }
    return false;
  }, [fetchAd]);

  // Request post-roll ad
  const requestPostRoll = useCallback(async (): Promise<boolean> => {
    const response = await fetchAd('post');
    if (response?.ad) {
      setCurrentAd(response.ad);
      setTrackingId(response.trackingId);
      setAdPosition('post');
      setIsAdPlaying(true);
      options.onAdStart?.();
      trackImpression(response.ad.id, response.trackingId, 'post');
      return true;
    }
    return false;
  }, [fetchAd, trackImpression, options]);

  // Countdown timer
  useEffect(() => {
    if (countdownSeconds > 0 && showCountdown) {
      const timer = setTimeout(() => {
        setCountdownSeconds(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdownSeconds === 0 && showCountdown && adQueue.length > 0) {
      // Countdown finished, start playing ad
      const ad = adQueue[0];
      setCurrentAd(ad);
      setShowCountdown(false);
      setIsAdPlaying(true);
      options.onAdStart?.();
      // Generate tracking ID and track impression
      const newTrackingId = crypto.randomUUID();
      setTrackingId(newTrackingId);
      trackImpression(ad.id, newTrackingId, adPosition || 'mid');
    }
  }, [countdownSeconds, showCountdown, adQueue, adPosition, options, trackImpression]);

  // Called when ad finishes playing
  const onAdComplete = useCallback(() => {
    if (currentAd && trackingId && adPosition) {
      trackImpression(currentAd.id, trackingId, adPosition, currentAd.duration_seconds * 1000, true);
    }
    
    // Check if there are more ads in queue
    if (adQueue.length > 1) {
      setAdQueue(prev => prev.slice(1));
      const nextAd = adQueue[1];
      setCurrentAd(nextAd);
      const newTrackingId = crypto.randomUUID();
      setTrackingId(newTrackingId);
      trackImpression(nextAd.id, newTrackingId, adPosition || 'mid');
    } else {
      // No more ads
      setCurrentAd(null);
      setTrackingId(null);
      setIsAdPlaying(false);
      setAdQueue([]);
      setAdPosition(null);
      options.onAdEnd?.();
    }
  }, [currentAd, trackingId, adPosition, adQueue, trackImpression, options]);

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
    requestPreRoll,
    requestMidRoll,
    requestPostRoll,
    onAdComplete,
    skipAd,
  };
}
