import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Check, Crown, Star, Users, Zap, Video, Radio, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  description: string | null;
  features: string[] | null;
}

interface CreatorPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  max_total_videos: number;
  max_rows: number;
  can_go_live: boolean;
  can_upload_shows: boolean;
  features: string[] | null;
}

const Plans = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [creatorPlans, setCreatorPlans] = useState<CreatorPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const highlightPlan = searchParams.get("upgrade");
  const activeTab = searchParams.get("tab") || "viewer";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch viewer plans
    const { data: plansData } = await supabase
      .from("membership_plans")
      .select("*")
      .order("sort_order");
    
    if (plansData) {
      setPlans(plansData);
    }

    // Fetch creator plans
    const { data: creatorData } = await supabase
      .from("creator_plans")
      .select("*")
      .order("sort_order");
    
    if (creatorData) {
      setCreatorPlans(creatorData as CreatorPlan[]);
    }

    // Fetch current user's plan
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setCurrentPlan(profile.subscription_tier || "free");
      }
    }
    
    setLoading(false);
  };

  const handleSelectPlan = async (planSlug: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please sign in to change your plan");
      navigate("/login");
      return;
    }

    if (planSlug === currentPlan) {
      toast.info("You're already on this plan");
      return;
    }

    setUpgrading(planSlug);
    
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_tier: planSlug })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update plan");
      setUpgrading(null);
      return;
    }

    setCurrentPlan(planSlug);
    setUpgrading(null);
    toast.success(`Successfully ${planSlug === 'free' ? 'downgraded' : 'upgraded'} to ${planSlug.charAt(0).toUpperCase() + planSlug.slice(1)} plan!`);
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'premium':
        return <Crown className="w-8 h-8" />;
      case 'standard':
        return <Star className="w-8 h-8" />;
      default:
        return <Users className="w-8 h-8" />;
    }
  };

  const getCreatorPlanIcon = (slug: string) => {
    switch (slug) {
      case 'enterprise':
        return <Radio className="w-8 h-8" />;
      case 'pro':
        return <BarChart3 className="w-8 h-8" />;
      default:
        return <Video className="w-8 h-8" />;
    }
  };

  const getPlanColor = (slug: string) => {
    switch (slug) {
      case 'premium':
      case 'enterprise':
        return 'from-amber-500 to-yellow-500';
      case 'standard':
      case 'pro':
        return 'from-primary to-primary/70';
      default:
        return 'from-muted-foreground to-muted-foreground/70';
    }
  };

  const getButtonStyle = (slug: string, isCurrentPlan: boolean) => {
    if (isCurrentPlan) {
      return "bg-muted text-muted-foreground cursor-not-allowed";
    }
    switch (slug) {
      case 'premium':
      case 'enterprise':
        return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-600 hover:to-yellow-600';
      case 'standard':
      case 'pro':
        return 'bg-primary hover:bg-primary/90 text-primary-foreground';
      default:
        return 'bg-muted hover:bg-muted/80 text-foreground';
    }
  };

  const planOrder = ['free', 'standard', 'premium'];
  const currentPlanIndex = planOrder.indexOf(currentPlan);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground">
            Unlock exclusive content or start your own channel
          </p>
        </div>

        <Tabs defaultValue={activeTab} className="max-w-6xl mx-auto">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="viewer" className="text-base">
              <Users className="w-4 h-4 mr-2" />
              Viewer Plans
            </TabsTrigger>
            <TabsTrigger value="creator" className="text-base">
              <Video className="w-4 h-4 mr-2" />
              Creator Plans
            </TabsTrigger>
          </TabsList>

          {/* Viewer Plans Tab */}
          <TabsContent value="viewer">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => {
                const isCurrentPlan = currentPlan === plan.slug;
                const planIndex = planOrder.indexOf(plan.slug);
                const isUpgrade = planIndex > currentPlanIndex;
                const isHighlighted = highlightPlan === plan.slug;
                
                return (
                  <Card 
                    key={plan.id}
                    className={`relative overflow-hidden transition-all duration-300 border border-border bg-card text-card-foreground ${
                      isHighlighted 
                        ? 'ring-2 ring-primary scale-105 shadow-2xl' 
                        : isCurrentPlan 
                        ? 'ring-2 ring-secondary' 
                        : 'hover:shadow-xl hover:border-primary/30'
                    } ${plan.slug === 'premium' 
                        ? 'bg-gradient-to-b from-card to-amber-950/20' 
                        : ''
                    }`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute top-0 left-0 right-0 bg-secondary text-secondary-foreground text-center py-1 text-sm font-medium">
                        Current Plan
                      </div>
                    )}
                    
                    {plan.slug === 'premium' && !isCurrentPlan && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-center py-1 text-sm font-medium">
                        <Zap className="w-4 h-4 inline mr-1" />
                        Most Popular
                      </div>
                    )}
                    
                    <CardHeader className={`text-center ${isCurrentPlan || plan.slug === 'premium' ? 'pt-10' : 'pt-6'}`}>
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${getPlanColor(plan.slug)} flex items-center justify-center text-white`}>
                        {getPlanIcon(plan.slug)}
                      </div>
                      
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="text-base">{plan.description}</CardDescription>
                      
                      <div className="mt-4">
                        <span className="text-4xl font-bold">
                          {plan.price === 0 || plan.price === null ? 'Free' : `$${plan.price.toFixed(2)}`}
                        </span>
                        {plan.price !== 0 && plan.price !== null && (
                          <span className="text-muted-foreground">/month</span>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <ul className="space-y-3">
                        {plan.features?.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                              plan.slug === 'premium' 
                                ? 'text-amber-500' 
                                : plan.slug === 'standard' 
                                ? 'text-primary' 
                                : 'text-muted-foreground'
                            }`} />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button
                        className={`w-full ${getButtonStyle(plan.slug, isCurrentPlan)}`}
                        onClick={() => handleSelectPlan(plan.slug)}
                        disabled={isCurrentPlan || upgrading !== null}
                      >
                        {upgrading === plan.slug ? (
                          "Processing..."
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : isUpgrade ? (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Upgrade Now
                          </>
                        ) : (
                          "Downgrade"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Ad Comparison Section */}
            <div className="mt-16 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8">Ad Experience Comparison</h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-lg p-6 text-center text-card-foreground">
                  <Users className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="font-semibold mb-2 text-foreground">Free</h3>
                  <p className="text-sm text-muted-foreground">
                    Full ad support with pre-roll, mid-roll (4/hr), and post-roll ads
                  </p>
                </div>
                
                <div className="bg-card border border-primary/30 rounded-lg p-6 text-center text-card-foreground">
                  <Star className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2 text-foreground">Standard</h3>
                  <p className="text-sm text-muted-foreground">
                    Limited ads - maximum 2 ad breaks per show or movie
                  </p>
                </div>
                
                <div className="bg-gradient-to-b from-card to-amber-950/20 border border-amber-500/30 rounded-lg p-6 text-center text-card-foreground">
                  <Crown className="w-8 h-8 mx-auto mb-3 text-amber-500" />
                  <h3 className="font-semibold mb-2 text-foreground">Premium</h3>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-bold text-amber-500">NO ADS</span> - Completely ad-free experience
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Creator Plans Tab */}
          <TabsContent value="creator">
            <div className="text-center mb-8">
              <p className="text-muted-foreground">
                Launch your own indie channel and share your content with the world
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {creatorPlans.map((plan) => {
                const isEnterprise = plan.slug === 'enterprise';
                const isPro = plan.slug === 'pro';
                
                return (
                  <Card 
                    key={plan.id}
                    className={`relative overflow-hidden transition-all duration-300 border border-border bg-card text-card-foreground hover:shadow-xl hover:border-primary/30 ${
                      isEnterprise ? 'bg-gradient-to-b from-card to-amber-950/20' : ''
                    }`}
                  >
                    {isEnterprise && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-center py-1 text-sm font-medium">
                        <Radio className="w-4 h-4 inline mr-1" />
                        Go Live
                      </div>
                    )}
                    
                    <CardHeader className={`text-center ${isEnterprise ? 'pt-10' : 'pt-6'}`}>
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${getPlanColor(plan.slug)} flex items-center justify-center text-white`}>
                        {getCreatorPlanIcon(plan.slug)}
                      </div>
                      
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="text-base">
                        {plan.slug === 'basic' && 'For new indie creators'}
                        {plan.slug === 'pro' && 'For serious creators'}
                        {plan.slug === 'enterprise' && 'For networks & full channels'}
                      </CardDescription>
                      
                      <div className="mt-4">
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Key Limits */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <div className="font-bold text-lg">{plan.max_total_videos}</div>
                          <div className="text-muted-foreground text-xs">Videos</div>
                        </div>
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <div className="font-bold text-lg">{plan.max_rows}</div>
                          <div className="text-muted-foreground text-xs">Rows</div>
                        </div>
                      </div>

                      <ul className="space-y-3">
                        {plan.features?.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                              isEnterprise 
                                ? 'text-amber-500' 
                                : isPro 
                                ? 'text-primary' 
                                : 'text-muted-foreground'
                            }`} />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                        
                        {/* Live streaming indicator */}
                        {plan.can_go_live && (
                          <li className="flex items-start gap-3">
                            <Radio className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                            <span className="text-sm font-semibold text-red-500">Live Streaming</span>
                          </li>
                        )}
                        
                        {/* TV Shows indicator */}
                        {plan.can_upload_shows && (
                          <li className="flex items-start gap-3">
                            <Video className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
                            <span className="text-sm">TV Shows & Episodes</span>
                          </li>
                        )}
                      </ul>
                      
                      <Button
                        className={`w-full ${getButtonStyle(plan.slug, false)}`}
                        onClick={() => toast.info("Creator subscriptions coming soon! Contact us to get started.")}
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Creator Features Comparison */}
            <div className="mt-16 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8">Creator Features</h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-lg p-6 text-center text-card-foreground">
                  <Video className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="font-semibold mb-2 text-foreground">Basic</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload videos, customize your channel, basic analytics
                  </p>
                </div>
                
                <div className="bg-card border border-primary/30 rounded-lg p-6 text-center text-card-foreground">
                  <BarChart3 className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2 text-foreground">Professional</h3>
                  <p className="text-sm text-muted-foreground">
                    TV shows, full analytics, revenue share eligible
                  </p>
                </div>
                
                <div className="bg-gradient-to-b from-card to-amber-950/20 border border-amber-500/30 rounded-lg p-6 text-center text-card-foreground">
                  <Radio className="w-8 h-8 mx-auto mb-3 text-amber-500" />
                  <h3 className="font-semibold mb-2 text-foreground">Enterprise</h3>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-bold text-amber-500">LIVE STREAMING</span> + full ad control
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground mt-12">
          Plans renew monthly. Cancel anytime. Payment integration coming soon.
        </p>
      </main>
    </div>
  );
};

export default Plans;
