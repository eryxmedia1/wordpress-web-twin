
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Tv, Video, Radio, Check, X, ChevronDown, ChevronUp } from "lucide-react";

// Comprehensive perks for viewer plans
const VIEWER_PLANS: Record<string, {
  name: string;
  price: number;
  isPopular?: boolean;
  basicPerks: { text: string; included: boolean }[];
  expandedPerks: { text: string; included: boolean }[];
}> = {
  free: {
    name: "Free",
    price: 0,
    basicPerks: [
      { text: "Limited movies & shows", included: true },
      { text: "Limited live TV channels", included: true },
      { text: "Indie channels (limited catalog)", included: true },
      { text: "1080p HD quality", included: true },
    ],
    expandedPerks: [
      { text: "4K / HDR quality", included: false },
      { text: "Premium-only content", included: false },
      { text: "Pre-roll, mid-roll & post-roll ads", included: true },
      { text: "Up to 4 mid-roll ads per hour", included: true },
      { text: "Ad countdown & 'Ad X of Y' display", included: true },
      { text: "Ad skipping", included: false },
      { text: "Play content", included: true },
      { text: "Like (👍) content", included: true },
      { text: "Add to My List", included: true },
      { text: "Continue Watching", included: true },
      { text: "Custom playlists", included: false },
      { text: "Offline downloads", included: false },
      { text: "Up to 2 profiles", included: true },
      { text: "Kids profile", included: true },
      { text: "Watch on 1 device", included: true },
    ],
  },
  standard: {
    name: "Standard",
    price: 9.95,
    isPopular: true,
    basicPerks: [
      { text: "Most movies & shows", included: true },
      { text: "Most live TV channels", included: true },
      { text: "Full indie channel access", included: true },
      { text: "1080p HD quality", included: true },
    ],
    expandedPerks: [
      { text: "4K / HDR quality", included: false },
      { text: "Pre-roll & mid-roll ads only", included: true },
      { text: "Max 2 mid-roll ads per show", included: true },
      { text: "No post-roll ads", included: true },
      { text: "Ad countdown display", included: true },
      { text: "Everything in Free tier", included: true },
      { text: "Custom playlists (up to 10)", included: true },
      { text: "Add to playlist button unlocked", included: true },
      { text: "Up to 4 profiles", included: true },
      { text: "Kids profile", included: true },
      { text: "Because You Watched", included: true },
      { text: "We Think You'll Love", included: true },
      { text: "Next To Watch", included: true },
      { text: "Binge mode", included: true },
      { text: "Watch on 2 devices", included: true },
    ],
  },
  premium: {
    name: "Premium",
    price: 19.95,
    basicPerks: [
      { text: "ALL movies & shows", included: true },
      { text: "ALL live TV channels", included: true },
      { text: "ALL indie channels", included: true },
      { text: "4K + HDR quality", included: true },
    ],
    expandedPerks: [
      { text: "NO ADS. EVER.", included: true },
      { text: "Priority playback / fastest load", included: true },
      { text: "Up to 6 profiles", included: true },
      { text: "Kids profile", included: true },
      { text: "Unlimited playlists", included: true },
      { text: "Playlist sharing (coming soon)", included: true },
      { text: "Full ratings & engagement", included: true },
      { text: "Skip intros", included: true },
      { text: "Instant playback", included: true },
      { text: "No upgrade prompts", included: true },
      { text: "Watch on 4 devices", included: true },
      { text: "24/7 Premium support", included: true },
    ],
  },
};

// Comprehensive perks for creator plans
const CREATOR_PLANS: Record<string, {
  name: string;
  price: number;
  icon: typeof Video;
  isPopular?: boolean;
  basicPerks: { text: string; included: boolean }[];
  expandedPerks: { text: string; included: boolean }[];
}> = {
  basic: {
    name: "Basic",
    price: 295,
    icon: Video,
    basicPerks: [
      { text: "1 Indie Channel", included: true },
      { text: "Channel page & branding", included: true },
      { text: "Logo + description", included: true },
      { text: "Custom rows (max 5)", included: true },
    ],
    expandedPerks: [
      { text: "Max 100 videos total", included: true },
      { text: "Max 20 videos per row", included: true },
      { text: "TV seasons/episodes", included: false },
      { text: "Bulk import", included: false },
      { text: "Ads disabled", included: false },
      { text: "Revenue share", included: false },
      { text: "Sponsorships", included: false },
      { text: "Basic analytics (views, followers)", included: true },
      { text: "Live streaming", included: false },
    ],
  },
  professional: {
    name: "Pro",
    price: 495,
    icon: Tv,
    isPopular: true,
    basicPerks: [
      { text: "Everything in Basic", included: true },
      { text: "TV shows & seasons", included: true },
      { text: "Episode selector", included: true },
      { text: "Categories & rows (max 10)", included: true },
    ],
    expandedPerks: [
      { text: "Max 500 videos total", included: true },
      { text: "Max 50 videos per row", included: true },
      { text: "Platform ads allowed", included: true },
      { text: "Eligible for revenue share", included: true },
      { text: "Can be included in campaigns", included: true },
      { text: "Full analytics dashboard", included: true },
      { text: "Watch time & geo data", included: true },
      { text: "Device & top videos stats", included: true },
      { text: "Live streaming", included: false },
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 995,
    icon: Radio,
    basicPerks: [
      { text: "Unlimited customization", included: true },
      { text: "Multiple admins", included: true },
      { text: "Featured placement eligibility", included: true },
      { text: "Max 20 rows", included: true },
    ],
    expandedPerks: [
      { text: "Max 1,000+ videos", included: true },
      { text: "Max 50 videos per row", included: true },
      { text: "Full ad control (pre/mid/post)", included: true },
      { text: "Sponsorship eligible", included: true },
      { text: "Campaign targeting allowed", included: true },
      { text: "Live streaming (RTMP/Mux)", included: true },
      { text: "Playlist-based scheduling", included: true },
      { text: "Join-in-progress logic", included: true },
      { text: "Live ads insertion", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Revenue reports & export", included: true },
    ],
  },
};

const PlansSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isChannelAnnual, setIsChannelAnnual] = useState(false);
  const [expandedViewerPlans, setExpandedViewerPlans] = useState<string[]>([]);
  const [expandedCreatorPlans, setExpandedCreatorPlans] = useState<string[]>([]);
  const [showViewerComparison, setShowViewerComparison] = useState(false);

  const getPrice = (monthlyPrice: number) => {
    if (isAnnual) {
      const annualPrice = monthlyPrice * 12 * 0.9;
      return (annualPrice / 12).toFixed(2);
    }
    return monthlyPrice.toFixed(2);
  };

  const getChannelPrice = (monthlyPrice: number) => {
    if (isChannelAnnual) {
      const annualPrice = monthlyPrice * 12 * 0.9;
      return Math.round(annualPrice / 12);
    }
    return monthlyPrice;
  };

  const toggleViewerPlan = (plan: string) => {
    setExpandedViewerPlans((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
    );
  };

  const toggleCreatorPlan = (plan: string) => {
    setExpandedCreatorPlans((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
    );
  };

  return (
    <section className="bg-black text-white border-t-8 border-[#222] py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Choose the plan that's right for you</h2>
        <p className="text-xl mb-8">Join with a free trial, cancel anytime.</p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={`text-lg ${!isAnnual ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>Monthly</span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            className="data-[state=checked]:bg-primary"
          />
          <span className={`text-lg ${isAnnual ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
            Annual <span className="text-green-500 text-sm font-bold ml-1">Save 10%</span>
          </span>
        </div>

        {/* Compare Button */}
        <Button
          variant="outline"
          className="mb-12 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          onClick={() => setShowViewerComparison(!showViewerComparison)}
        >
          {showViewerComparison ? "Hide Comparison" : "Compare Plans"}
        </Button>
        
        {/* Viewer Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {Object.entries(VIEWER_PLANS).map(([key, plan]) => {
            const isExpanded = expandedViewerPlans.includes(key);
            return (
              <div
                key={key}
                className={`bg-card p-6 rounded-lg ${plan.isPopular ? 'border-2 border-primary relative' : 'border border-border'}`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-sm font-bold py-1 px-3 rounded-full">
                    Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-4">{plan.name}</h3>
                <p className="text-3xl font-bold mb-6">
                  ${plan.price === 0 ? "0" : getPrice(plan.price)}
                  <span className="text-sm font-normal text-muted-foreground">/{isAnnual ? 'year' : 'month'}</span>
                </p>
                
                {/* Basic Perks */}
                <ul className="space-y-3">
                  {plan.basicPerks.map((perk, i) => (
                    <li key={i} className="flex items-center">
                      <span className={perk.included ? "text-green-500" : "text-red-500"} style={{ marginRight: '0.5rem' }}>
                        {perk.included ? "✓" : "✗"}
                      </span>
                      <span className={!perk.included ? "text-muted-foreground" : ""}>{perk.text}</span>
                    </li>
                  ))}
                </ul>

                {/* Expanded Perks */}
                {isExpanded && (
                  <ul className="space-y-3 mt-3 pt-3 border-t border-border">
                    {plan.expandedPerks.map((perk, i) => (
                      <li key={i} className="flex items-center">
                        <span className={perk.included ? "text-green-500" : "text-red-500"} style={{ marginRight: '0.5rem' }}>
                          {perk.included ? "✓" : "✗"}
                        </span>
                        <span className={!perk.included ? "text-muted-foreground" : ""}>{perk.text}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* View More Button */}
                <button
                  onClick={() => toggleViewerPlan(key)}
                  className="flex items-center gap-1 text-primary text-sm mt-4 hover:underline"
                >
                  {isExpanded ? (
                    <>
                      View Less <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      View More <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>

                <Link to={`/signup?plan=${key}`}>
                  <Button className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground">
                    Get Started
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Viewer Plans Comparison Table */}
        {showViewerComparison && (
          <div className="mt-12 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-2xl font-bold mb-8">Compare Viewer Plans</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-4 px-4 text-muted-foreground font-normal">Features</th>
                    <th className="py-4 px-4 text-center">
                      <div className="font-bold">Free</div>
                      <div className="text-primary text-sm">$0/mo</div>
                    </th>
                    <th className="py-4 px-4 text-center bg-primary/10 rounded-t-lg">
                      <div className="font-bold">Standard</div>
                      <div className="text-primary text-sm">${getPrice(9.95)}/mo</div>
                    </th>
                    <th className="py-4 px-4 text-center">
                      <div className="font-bold">Premium</div>
                      <div className="text-primary text-sm">${getPrice(19.95)}/mo</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">User Profiles</td>
                    <td className="py-4 px-4 text-center">2</td>
                    <td className="py-4 px-4 text-center bg-primary/10">4</td>
                    <td className="py-4 px-4 text-center">6</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Kids Profile</td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Video Quality</td>
                    <td className="py-4 px-4 text-center">HD (1080p)</td>
                    <td className="py-4 px-4 text-center bg-primary/10">HD (1080p)</td>
                    <td className="py-4 px-4 text-center text-green-500">4K + HDR</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Ads</td>
                    <td className="py-4 px-4 text-center">4 mid-roll/hour + pre/post</td>
                    <td className="py-4 px-4 text-center bg-primary/10">Max 2/show (no post)</td>
                    <td className="py-4 px-4 text-center text-green-500">None</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Content Access</td>
                    <td className="py-4 px-4 text-center">Limited</td>
                    <td className="py-4 px-4 text-center bg-primary/10">Most</td>
                    <td className="py-4 px-4 text-center text-green-500">All</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Live TV Channels</td>
                    <td className="py-4 px-4 text-center">Limited</td>
                    <td className="py-4 px-4 text-center bg-primary/10">Most</td>
                    <td className="py-4 px-4 text-center text-green-500">All</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Indie Channels</td>
                    <td className="py-4 px-4 text-center">Limited</td>
                    <td className="py-4 px-4 text-center bg-primary/10">Full Access</td>
                    <td className="py-4 px-4 text-center text-green-500">Full Access</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Custom Playlists</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10">Up to 10</td>
                    <td className="py-4 px-4 text-center text-green-500">Unlimited</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Offline Downloads</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Simultaneous Streams</td>
                    <td className="py-4 px-4 text-center">1</td>
                    <td className="py-4 px-4 text-center bg-primary/10">2</td>
                    <td className="py-4 px-4 text-center">4</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Smart Features (Binge Mode, Recommendations)</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Skip Intros</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4">Priority Playback</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Your Own TV Channel Section */}
        <div className="mt-20 pt-16 border-t border-border">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Create Your Own TV Channel</h2>
          <p className="text-xl mb-8">Launch your own streaming channel on Zoe RatedTV</p>
          
          {/* Channel Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-lg ${!isChannelAnnual ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>Monthly</span>
            <Switch
              checked={isChannelAnnual}
              onCheckedChange={setIsChannelAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-lg ${isChannelAnnual ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              Annual <span className="text-green-500 text-sm font-bold ml-1">Save 10%</span>
            </span>
          </div>
          
          {/* Creator Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {Object.entries(CREATOR_PLANS).map(([key, plan]) => {
              const isExpanded = expandedCreatorPlans.includes(key);
              const Icon = plan.icon;
              return (
                <div
                  key={key}
                  className={`bg-card p-6 rounded-lg ${plan.isPopular ? 'border-2 border-primary relative' : 'border border-border'}`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-sm font-bold py-1 px-3 rounded-full">
                      Popular
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>
                  <p className="text-3xl font-bold mb-6">
                    ${getChannelPrice(plan.price)}
                    <span className="text-sm font-normal text-muted-foreground">/{isChannelAnnual ? 'year' : 'month'}</span>
                  </p>

                  {/* Basic Perks */}
                  <ul className="space-y-3">
                    {plan.basicPerks.map((perk, i) => (
                      <li key={i} className="flex items-center">
                        <span className={perk.included ? "text-green-500" : "text-red-500"} style={{ marginRight: '0.5rem' }}>
                          {perk.included ? "✓" : "✗"}
                        </span>
                        <span className={!perk.included ? "text-muted-foreground" : ""}>{perk.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Expanded Perks */}
                  {isExpanded && (
                    <ul className="space-y-3 mt-3 pt-3 border-t border-border">
                      {plan.expandedPerks.map((perk, i) => (
                        <li key={i} className="flex items-center">
                          <span className={perk.included ? "text-green-500" : "text-red-500"} style={{ marginRight: '0.5rem' }}>
                            {perk.included ? "✓" : "✗"}
                          </span>
                          <span className={!perk.included ? "text-muted-foreground" : ""}>{perk.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* View More Button */}
                  <button
                    onClick={() => toggleCreatorPlan(key)}
                    className="flex items-center gap-1 text-primary text-sm mt-4 hover:underline"
                  >
                    {isExpanded ? (
                      <>
                        View Less <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        View More <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <Link to={`/signup?channel=${key}`}>
                    <Button className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground">
                      Get Started
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Channel Plans Comparison Table */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold mb-8">Compare Channel Plans</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-4 px-4 text-muted-foreground font-normal">Features</th>
                    <th className="py-4 px-4 text-center">
                      <div className="font-bold">Basic</div>
                      <div className="text-primary text-sm">${getChannelPrice(295)}/mo</div>
                    </th>
                    <th className="py-4 px-4 text-center bg-primary/10 rounded-t-lg">
                      <div className="font-bold">Professional</div>
                      <div className="text-primary text-sm">${getChannelPrice(495)}/mo</div>
                    </th>
                    <th className="py-4 px-4 text-center">
                      <div className="font-bold">Enterprise</div>
                      <div className="text-primary text-sm">${getChannelPrice(995)}/mo</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Content Rows</td>
                    <td className="py-4 px-4 text-center">5</td>
                    <td className="py-4 px-4 text-center bg-primary/10">10</td>
                    <td className="py-4 px-4 text-center">20</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Videos Per Row</td>
                    <td className="py-4 px-4 text-center">20</td>
                    <td className="py-4 px-4 text-center bg-primary/10">50</td>
                    <td className="py-4 px-4 text-center">50</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Total Videos</td>
                    <td className="py-4 px-4 text-center">100</td>
                    <td className="py-4 px-4 text-center bg-primary/10">500</td>
                    <td className="py-4 px-4 text-center text-green-500">1,000+</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">TV Shows & Seasons</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Live Streaming (RTMP/Mux)</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Custom Branding</td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Platform Ads</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center text-green-500">Full Control</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Revenue Share Eligible</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Sponsorship Eligible</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Analytics Dashboard</td>
                    <td className="py-4 px-4 text-center"><span className="text-muted-foreground">Basic</span></td>
                    <td className="py-4 px-4 text-center bg-primary/10"><span className="text-primary">Full</span></td>
                    <td className="py-4 px-4 text-center text-green-500">Advanced + Export</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Multiple Admins</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4">Featured Placement</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
