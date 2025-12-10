
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
  basicPerks: string[];
  expandedPerks: string[];
}> = {
  free: {
    name: "Free",
    price: 0,
    basicPerks: [
      "Limited content access",
      "Ad-supported viewing",
      "HD quality (1080p)",
      "Basic channels only",
    ],
    expandedPerks: [
      "2 user profiles",
      "4 mid-roll ads per hour",
      "No playlist creation",
      "Standard support",
      "Watch on 1 device at a time",
      "Basic recommendations",
    ],
  },
  standard: {
    name: "Standard",
    price: 9.95,
    isPopular: true,
    basicPerks: [
      "Most content access",
      "Limited ads (max 2 per show)",
      "HD quality (1080p)",
      "Most channels included",
    ],
    expandedPerks: [
      "4 user profiles",
      "Create up to 10 playlists",
      "Download for offline viewing",
      "Priority support",
      "Watch on 2 devices at a time",
      "Personalized recommendations",
      "Early access to new releases",
    ],
  },
  premium: {
    name: "Premium",
    price: 19.95,
    basicPerks: [
      "All content access",
      "No ads ever",
      "4K + HDR quality",
      "All channels included",
    ],
    expandedPerks: [
      "6 user profiles",
      "Unlimited playlists",
      "Download for offline viewing",
      "24/7 Premium support",
      "Watch on 4 devices at a time",
      "AI-powered recommendations",
      "Exclusive premiere access",
      "Behind-the-scenes content",
      "Director's cut versions",
    ],
  },
};

// Comprehensive perks for creator plans
const CREATOR_PLANS: Record<string, {
  name: string;
  price: number;
  icon: typeof Video;
  isPopular?: boolean;
  basicPerks: string[];
  noLiveStreaming?: boolean;
  expandedPerks: string[];
}> = {
  basic: {
    name: "Basic",
    price: 295,
    icon: Video,
    basicPerks: [
      "5 Rows",
      "20 videos per row",
      "100 videos total",
    ],
    noLiveStreaming: true,
    expandedPerks: [
      "Custom branding",
      "Basic analytics dashboard",
      "50% ad revenue share",
      "Standard support",
      "Manual video uploads",
      "Basic thumbnail customization",
    ],
  },
  professional: {
    name: "Professional",
    price: 495,
    icon: Tv,
    isPopular: true,
    basicPerks: [
      "10 Rows",
      "50 videos per row",
      "500 videos total",
    ],
    noLiveStreaming: true,
    expandedPerks: [
      "Custom branding",
      "Advanced analytics dashboard",
      "60% ad revenue share",
      "Priority support",
      "Bulk video uploads",
      "Custom thumbnail library",
      "Audience insights",
      "Scheduled publishing",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 995,
    icon: Radio,
    basicPerks: [
      "20 Rows",
      "50 videos per row",
      "1000 videos total",
      "Access to Live Streaming",
    ],
    expandedPerks: [
      "Full custom branding",
      "Full analytics access",
      "70% ad revenue share",
      "24/7 Dedicated support",
      "API access",
      "White-label options",
      "Sponsorship opportunities",
      "Multi-channel management",
      "Real-time viewer analytics",
      "Custom integrations",
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
                      <span className="text-green-500 mr-2">✓</span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                {/* Expanded Perks */}
                {isExpanded && (
                  <ul className="space-y-3 mt-3 pt-3 border-t border-border">
                    {plan.expandedPerks.map((perk, i) => (
                      <li key={i} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>{perk}</span>
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
                    <td className="py-4 px-4">Video Quality</td>
                    <td className="py-4 px-4 text-center">HD (1080p)</td>
                    <td className="py-4 px-4 text-center bg-primary/10">HD (1080p)</td>
                    <td className="py-4 px-4 text-center">4K + HDR</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Ads</td>
                    <td className="py-4 px-4 text-center">4/hour</td>
                    <td className="py-4 px-4 text-center bg-primary/10">Max 2/show</td>
                    <td className="py-4 px-4 text-center text-green-500">None</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Content Access</td>
                    <td className="py-4 px-4 text-center">Limited</td>
                    <td className="py-4 px-4 text-center bg-primary/10">Most</td>
                    <td className="py-4 px-4 text-center text-green-500">All</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Playlists</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10">10</td>
                    <td className="py-4 px-4 text-center">Unlimited</td>
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
                  <tr>
                    <td className="py-4 px-4">Exclusive Content</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-primary/10">Early Access</td>
                    <td className="py-4 px-4 text-center text-green-500">Full Access</td>
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
                        <span className="text-green-500 mr-2">✓</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                    {plan.noLiveStreaming && (
                      <li className="flex items-center">
                        <span className="text-red-500 mr-2">✗</span>
                        <span className="text-muted-foreground">No Live Streaming</span>
                      </li>
                    )}
                  </ul>

                  {/* Expanded Perks */}
                  {isExpanded && (
                    <ul className="space-y-3 mt-3 pt-3 border-t border-border">
                      {plan.expandedPerks.map((perk, i) => (
                        <li key={i} className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          <span>{perk}</span>
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
                    <td className="py-4 px-4 text-center">1,000</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Live Streaming</td>
                    <td className="py-4 px-4 text-center">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center bg-primary/10">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Custom Branding</td>
                    <td className="py-4 px-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center bg-primary/10">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Analytics Dashboard</td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-muted-foreground">Basic</span>
                    </td>
                    <td className="py-4 px-4 text-center bg-primary/10">
                      <span className="text-primary">Advanced</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-primary">Full Access</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Ad Revenue Share</td>
                    <td className="py-4 px-4 text-center">50%</td>
                    <td className="py-4 px-4 text-center bg-primary/10">60%</td>
                    <td className="py-4 px-4 text-center">70%</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4">Priority Support</td>
                    <td className="py-4 px-4 text-center">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center bg-primary/10">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4">API Access</td>
                    <td className="py-4 px-4 text-center">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center bg-primary/10">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
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
