import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  price: number | null;
}

interface AdConfig {
  showPreroll: boolean;
  showMidroll: boolean;
  showPostroll: boolean;
  maxAdBreaks: number;
}

export const useMembershipAccess = (contentId?: string) => {
  const [userPlan, setUserPlan] = useState<string>('free');
  const [contentPlans, setContentPlans] = useState<string[]>([]);
  const [allPlans, setAllPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    fetchUserPlan();
    fetchAllPlans();
  }, []);

  useEffect(() => {
    if (contentId) {
      fetchContentPlans(contentId);
    }
  }, [contentId]);

  useEffect(() => {
    // Check access when data is loaded
    if (!loading && contentPlans.length > 0) {
      const planOrder = ['free', 'standard', 'premium'];
      const userPlanIndex = planOrder.indexOf(userPlan);
      const access = contentPlans.some(plan => planOrder.indexOf(plan) <= userPlanIndex);
      setHasAccess(access);
    } else if (contentPlans.length === 0) {
      // No plan restrictions = everyone has access
      setHasAccess(true);
    }
  }, [userPlan, contentPlans, loading]);

  const fetchUserPlan = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();
      
      setUserPlan(profile?.subscription_tier || 'free');
    }
    setLoading(false);
  };

  const fetchAllPlans = async () => {
    const { data } = await supabase
      .from('membership_plans')
      .select('id, name, slug, price')
      .order('sort_order');
    
    if (data) {
      setAllPlans(data);
    }
  };

  const fetchContentPlans = async (id: string) => {
    const { data } = await supabase
      .from('content_membership_plans')
      .select('plan_id, membership_plans(slug)')
      .eq('content_id', id);
    
    if (data) {
      const planSlugs = data
        .map(item => (item.membership_plans as any)?.slug)
        .filter(Boolean);
      setContentPlans(planSlugs);
    }
  };

  // Get ad configuration based on user's plan
  const getAdConfig = (): AdConfig => {
    switch (userPlan) {
      case 'premium':
        return {
          showPreroll: false,
          showMidroll: false,
          showPostroll: false,
          maxAdBreaks: 0
        };
      case 'standard':
        return {
          showPreroll: true,
          showMidroll: true,
          showPostroll: false,
          maxAdBreaks: 2
        };
      case 'free':
      default:
        return {
          showPreroll: true,
          showMidroll: true,
          showPostroll: true,
          maxAdBreaks: 4 // 4 mid-roll breaks per hour (every 15 minutes)
        };
    }
  };

  return {
    userPlan,
    contentPlans,
    allPlans,
    hasAccess,
    loading,
    getAdConfig
  };
};

export default useMembershipAccess;
