import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';

interface GeoData {
  country?: string;
  region?: string;
  city?: string;
}

export const useLiveViewerTracking = (channelId: string | null, isPlaying: boolean) => {
  const { user } = useAuth();
  const { currentProfile } = useProfile();
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const geoDataRef = useRef<GeoData>({});

  // Generate unique session ID
  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `${user?.id || 'anon'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return sessionIdRef.current;
  }, [user?.id]);

  // Detect device type
  const getDeviceType = useCallback(() => {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    if (/smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast/i.test(ua)) return 'tv';
    return 'desktop';
  }, []);

  // Fetch geo data
  const fetchGeoData = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke('detect-geo');
      if (data) {
        geoDataRef.current = {
          country: data.country,
          region: data.region,
          city: data.city
        };
      }
    } catch (error) {
      console.error('Error fetching geo data:', error);
    }
  }, []);

  // Register viewer session
  const registerSession = useCallback(async () => {
    if (!channelId || !user?.id) return;

    const sessionId = getSessionId();
    const deviceType = getDeviceType();

    try {
      const { error } = await supabase
        .from('live_channel_active_viewers')
        .upsert({
          session_id: sessionId,
          live_channel_id: channelId,
          user_id: user.id,
          profile_id: currentProfile?.id || null,
          device_type: deviceType,
          geo_country: geoDataRef.current.country || null,
          geo_region: geoDataRef.current.region || null,
          geo_city: geoDataRef.current.city || null,
          last_heartbeat: new Date().toISOString()
        }, { onConflict: 'session_id' });

      if (error) {
        console.error('Error registering viewer session:', error);
      }
    } catch (error) {
      console.error('Error registering viewer session:', error);
    }
  }, [channelId, user?.id, currentProfile?.id, getSessionId, getDeviceType]);

  // Send heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await supabase
        .from('live_channel_active_viewers')
        .update({ last_heartbeat: new Date().toISOString() })
        .eq('session_id', sessionIdRef.current);
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }, []);

  // Remove viewer session
  const removeSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await supabase
        .from('live_channel_active_viewers')
        .delete()
        .eq('session_id', sessionIdRef.current);
    } catch (error) {
      console.error('Error removing viewer session:', error);
    }
  }, []);

  // Start tracking when playing
  useEffect(() => {
    if (!channelId || !isPlaying || !user?.id) {
      // Clear heartbeat if not playing
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    // Fetch geo data and register session
    fetchGeoData().then(() => {
      registerSession();
    });

    // Set up heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, 30000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [channelId, isPlaying, user?.id, fetchGeoData, registerSession, sendHeartbeat]);

  // Handle page unload/navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        // Use sendBeacon for reliable cleanup on page close
        const url = `https://hbddjtvslojxkkcrpcoo.supabase.co/rest/v1/live_channel_active_viewers?session_id=eq.${sessionIdRef.current}`;
        navigator.sendBeacon && fetch(url, {
          method: 'DELETE',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZGRqdHZzbG9qeGtrY3JwY29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjUxNjcsImV4cCI6MjA2MjYwMTE2N30.TC4eACBOJsfggnuB3OyOK7x4O9yp7bjzOP5Tr9_jHds',
            'Authorization': `Bearer ${sessionIdRef.current}`
          }
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      removeSession();
    };
  }, [removeSession]);

  // Handle channel change
  useEffect(() => {
    return () => {
      removeSession();
      sessionIdRef.current = null;
    };
  }, [channelId, removeSession]);

  return { removeSession };
};