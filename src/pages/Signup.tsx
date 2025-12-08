import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, Check, Crown, Star, Users, Zap, Film, Tv, Music, Skull, Heart, Rocket, FileText, Laugh, Users2, Sparkles, Baby, HelpCircle, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const GENRES = [
  { id: 'action', name: 'Action', icon: Zap },
  { id: 'comedy', name: 'Comedy', icon: Laugh },
  { id: 'drama', name: 'Drama', icon: Users2 },
  { id: 'horror', name: 'Horror', icon: Skull },
  { id: 'romance', name: 'Romance', icon: Heart },
  { id: 'sci-fi', name: 'Sci-Fi', icon: Rocket },
  { id: 'documentary', name: 'Documentary', icon: FileText },
  { id: 'thriller', name: 'Thriller', icon: Sparkles },
  { id: 'animation', name: 'Animation', icon: Baby },
  { id: 'family', name: 'Family', icon: Users },
  { id: 'mystery', name: 'Mystery', icon: HelpCircle },
  { id: 'adventure', name: 'Adventure', icon: Compass },
];

interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  description: string | null;
  features: string[] | null;
  included_channels: string[] | null;
}

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<string>("free");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const planFromUrl = searchParams.get("plan");
  
  useEffect(() => {
    if (planFromUrl) {
      setSelectedPlan(planFromUrl);
    }
    fetchPlans();
  }, [planFromUrl]);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("membership_plans")
      .select("*")
      .order("sort_order");
    if (data) setPlans(data);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setStep(2);
  };

  const handleGenreToggle = (genreId: string) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(g => g !== genreId)
        : [...prev, genreId]
    );
  };

  const handleGenreSubmit = () => {
    if (selectedGenres.length < 3) {
      toast.error("Please select at least 3 genres");
      return;
    }
    setStep(3);
  };

  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan);
    setStep(4);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            preferred_genres: selectedGenres,
            subscription_tier: selectedPlan
          }
        }
      });
      
      if (error) throw error;

      // Update the profile with subscription tier
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ subscription_tier: selectedPlan })
          .eq('id', data.user.id);
      }
      
      toast.success("Account created successfully! Please check your email to verify.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'premium': return <Crown className="w-6 h-6" />;
      case 'standard': return <Star className="w-6 h-6" />;
      default: return <Users className="w-6 h-6" />;
    }
  };

  const getPlanColor = (slug: string) => {
    switch (slug) {
      case 'premium': return 'border-amber-500 bg-amber-500/10';
      case 'standard': return 'border-primary bg-primary/10';
      default: return 'border-gray-400 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-background px-4 py-4 border-b border-border">
        <Link to="/">
          <img 
            src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png" 
            alt="Zoe RatedTV" 
            className="h-16 object-contain" 
          />
        </Link>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Step 1: Email & Password */}
        {step === 1 && (
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">STEP 1 OF 4</p>
            <h1 className="text-3xl font-bold mb-4 text-foreground">Create your account</h1>
            <p className="mb-6 text-muted-foreground">Just a few steps to get started!</p>
            
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email address"
                className="w-full p-4 rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <input
                type="password"
                placeholder="Create a password"
                className="w-full p-4 rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg p-6"
              >
                Next
              </Button>
            </form>
            
            <p className="mt-6 text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </div>
        )}
        
        {/* Step 2: Genre Selection */}
        {step === 2 && (
          <div className="max-w-3xl w-full">
            <p className="text-sm text-muted-foreground mb-2 text-center">STEP 2 OF 4</p>
            <h1 className="text-3xl font-bold mb-2 text-center text-foreground">What do you like to watch?</h1>
            <p className="text-center text-muted-foreground mb-8">
              Select at least 3 genres to personalize your experience
            </p>
            
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-8">
              {GENRES.map((genre) => {
                const Icon = genre.icon;
                const isSelected = selectedGenres.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    onClick={() => handleGenreToggle(genre.id)}
                    className={`flex items-center gap-2 p-3 rounded-full border-2 transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/20 text-primary' 
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{genre.name}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {selectedGenres.length}/3 genres selected {selectedGenres.length >= 3 && <Check className="inline w-4 h-4 text-green-500" />}
              </p>
              <Button 
                onClick={handleGenreSubmit}
                disabled={selectedGenres.length < 3}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-lg"
              >
                Continue
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 3: Plan Selection */}
        {step === 3 && (
          <div className="max-w-4xl w-full">
            <p className="text-sm text-muted-foreground mb-2 text-center">STEP 3 OF 4</p>
            <h1 className="text-3xl font-bold mb-4 text-center text-foreground">Choose your plan</h1>
            
            <ul className="space-y-3 mb-8 max-w-md mx-auto">
              <li className="flex items-start">
                <Check className="text-primary mr-2 mt-1 flex-shrink-0" />
                <span className="text-foreground">No commitments, cancel anytime.</span>
              </li>
              <li className="flex items-start">
                <Check className="text-primary mr-2 mt-1 flex-shrink-0" />
                <span className="text-foreground">Everything on ZOE for one low price.</span>
              </li>
              <li className="flex items-start">
                <Check className="text-primary mr-2 mt-1 flex-shrink-0" />
                <span className="text-foreground">Upgrade anytime for more features.</span>
              </li>
            </ul>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`border-2 p-6 rounded-lg cursor-pointer transition-all relative ${
                    selectedPlan === plan.slug 
                      ? getPlanColor(plan.slug)
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                  onClick={() => handlePlanSelect(plan.slug)}
                >
                  {plan.slug === 'premium' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Best Value
                    </div>
                  )}
                  
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    plan.slug === 'premium' ? 'bg-amber-500 text-black' : 
                    plan.slug === 'standard' ? 'bg-primary text-primary-foreground' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    {getPlanIcon(plan.slug)}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 text-center text-foreground">{plan.name}</h3>
                  <p className="text-3xl font-bold mb-4 text-center text-foreground">
                    {plan.price === 0 || plan.price === null ? 'Free' : `$${plan.price.toFixed(2)}`}
                    {plan.price !== 0 && plan.price !== null && (
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    )}
                  </p>
                  
                  <ul className="space-y-2">
                    {plan.features?.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <Check className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${
                          plan.slug === 'premium' ? 'text-amber-500' : 
                          plan.slug === 'standard' ? 'text-primary' : 
                          'text-muted-foreground'
                        }`} />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.included_channels && plan.included_channels.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Included Channels:</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.included_channels.slice(0, 3).map((channel, idx) => (
                          <span key={idx} className="text-xs bg-muted px-2 py-0.5 rounded">
                            {channel}
                          </span>
                        ))}
                        {plan.included_channels.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{plan.included_channels.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground mt-6 text-center">
              Start with Free and upgrade anytime. All paid plans include a 7-day free trial.
            </p>
          </div>
        )}
        
        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="max-w-md w-full text-center">
            <p className="text-sm text-muted-foreground mb-2">STEP 4 OF 4</p>
            <h1 className="text-3xl font-bold mb-4 text-foreground">Complete your signup</h1>
            
            <div className="border border-border rounded-lg p-6 mb-6 text-left bg-card">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-foreground">
                  {plans.find(p => p.slug === selectedPlan)?.name || 'Free'} Plan
                </span>
                <span className="font-bold text-foreground">
                  {selectedPlan === 'free' ? 'Free' : 
                   `$${plans.find(p => p.slug === selectedPlan)?.price?.toFixed(2) || '0'}/month`}
                </span>
              </div>
              
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-sm text-muted-foreground mb-2">Selected Genres:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedGenres.map(g => (
                    <span key={g} className="bg-primary/20 text-primary px-2 py-1 rounded text-sm capitalize">
                      {GENRES.find(genre => genre.id === g)?.name || g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSignup} className="space-y-6">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg p-6"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
              
              <p className="text-sm text-muted-foreground">
                By clicking "Create Account", you agree to our Terms of Use and Privacy Policy.
                {selectedPlan !== 'free' && " Payment will be set up on the next page."}
              </p>
            </form>
          </div>
        )}
      </div>
      
      <footer className="bg-card py-8 px-4 text-muted-foreground border-t border-border">
        <div className="max-w-6xl mx-auto">
          <p className="mb-6">Questions? Call 1-800-555-5555</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <a href="#" className="hover:underline">FAQ</a>
            <a href="#" className="hover:underline">Help Center</a>
            <a href="#" className="hover:underline">Terms of Use</a>
            <a href="#" className="hover:underline">Privacy</a>
          </div>
          
          <p className="mt-8 text-sm">Zoe RatedTV Is Our Reality</p>
        </div>
      </footer>
    </div>
  );
};

export default Signup;