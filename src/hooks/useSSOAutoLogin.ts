import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSSOAutoLogin = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get('sso_token');
    if (!ssoToken) return;

    setIsProcessing(true);

    // Clean the URL immediately
    const url = new URL(window.location.href);
    url.searchParams.delete('sso_token');
    window.history.replaceState({}, '', url.toString());

    // Verify token and auto-login
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-sso-token', {
          body: { token: ssoToken },
        });

        if (error || !data?.action_link) {
          console.warn('SSO auto-login failed', error);
          setIsProcessing(false);
          return;
        }

        // Follow the magic link to complete sign-in
        window.location.href = data.action_link;
      } catch (err) {
        console.warn('SSO auto-login error', err);
        setIsProcessing(false);
      }
    })();
  }, []);

  return { isProcessing };
};
