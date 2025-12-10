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
  const isTrackingRef = useRef(false);

  // Generate unique session ID (works for both authenticated and anonymous)
  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      const prefix = user?.id || 'anon';
      sessionIdRef.current = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

  // Register viewer session - works for both authenticated and anonymous users
  const registerSession = useCallback(async (chId: string) => {
    if (!chId) {
      console.log('Cannot register session: missing channelId');
      return;
    }

    const sessionId = getSessionId();
    const deviceType = getDeviceType();

    console.log('Registering viewer session:', { 
      sessionId, 
      channelId: chId, 
      userId: user?.id || 'anonymous', 
      deviceType,
      geo: geoDataRef.current
    });

    try {
      const { error } = await supabase
        .from('live_channel_active_viewers')
        .upsert({
          session_id: sessionId,
          live_channel_id: chId,
          device_type: deviceType,
          geo_country: geoDataRef.current.country || null,
          geo_region: geoDataRef.current.region || null,
          geo_city: geoDataRef.current.city || null,
          last_heartbeat: new Date().toISOString(),
          started_at: new Date().toISOString(),
          user_id: user?.id || null,
          profile_id: user?.id ? (currentProfile?.id || null) : null
        }, { onConflict: 'session_id' });

      if (error) {
        console.error('Error registering viewer session:', error);
      } else {
        console.log('Successfully registered viewer session:', sessionId);
        isTrackingRef.current = true;
      }
    } catch (error) {
      console.error('Error registering viewer session:', error);
    }
  }, [user?.id, currentProfile?.id, getSessionId, getDeviceType]);

  // Send heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!sessionIdRef.current || !isTrackingRef.current) return;

    try {
      const { error } = await supabase
        .from('live_channel_active_viewers')
        .update({ last_heartbeat: new Date().toISOString() })
        .eq('session_id', sessionIdRef.current);
      
      if (error) {
        console.error('Heartbeat error:', error);
      }
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }, []);

  // Remove viewer session
  const removeSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    console.log('Removing viewer session:', sessionIdRef.current);

    try {
      await supabase
        .from('live_channel_active_viewers')
        .delete()
        .eq('session_id', sessionIdRef.current);
      
      isTrackingRef.current = false;
    } catch (error) {
      console.error('Error removing viewer session:', error);
    }
  }, []);

  // Start tracking when playing - NO longer requires user to be logged in
  useEffect(() => {
    // Clear any existing heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (!channelId || !isPlaying) {
      console.log('Not tracking - conditions not met:', { channelId, isPlaying });
      return;
    }

    console.log('Starting live viewer tracking for channel:', channelId);

    // Fetch geo data and register session
    fetchGeoData().then(() => {
      registerSession(channelId);
    });

    // Set up heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, 30000);

    // Cleanup function
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [channelId, isPlaying, fetchGeoData, registerSession, sendHeartbeat]);

  // Handle page unload/navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionIdRef.current && isTrackingRef.current) {
        console.log('beforeunload: removing session');
        // Use sendBeacon for reliable cleanup on page close
        const url = `https://hbddjtvslojxkkcrpcoo.supabase.co/rest/v1/live_channel_active_viewers?session_id=eq.${sessionIdRef.current}`;
        fetch(url, {
          method: 'DELETE',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZGRqdHZzbG9qeGtrY3JwY29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjUxNjcsImV4cCI6MjA2MjYwMTE2N30.TC4eACBOJsfggnuB3OyOK7x4O9yp7bjzOP5Tr9_jHds',
            'Content-Type': 'application/json'
          },
          keepalive: true
        }).catch(() => {});
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && sessionIdRef.current && isTrackingRef.current) {
        sendHeartbeat();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sendHeartbeat]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (isTrackingRef.current) {
        removeSession();
        sessionIdRef.current = null;
        isTrackingRef.current = false;
      }
    };
  }, []);

  return { removeSession };
};
