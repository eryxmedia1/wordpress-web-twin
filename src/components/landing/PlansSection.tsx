
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Tv, Video, Radio } from "lucide-react";

const PlansSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const getPrice = (monthlyPrice: number) => {
    if (isAnnual) {
      const annualPrice = monthlyPrice * 12 * 0.9; // 10% off
      return (annualPrice / 12).toFixed(2);
    }
    return monthlyPrice.toFixed(2);
  };

  const getChannelPrice = (monthlyPrice: number) => {
    if (isAnnual) {
      const annualPrice = monthlyPrice * 12 * 0.9; // 10% off
      return Math.round(annualPrice / 12);
    }
    return monthlyPrice;
  };

  return (
    <section className="bg-black text-white border-t-8 border-[#222] py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Choose the plan that's right for you</h2>
        <p className="text-xl mb-8">Join with a free trial, cancel anytime.</p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-lg ${!isAnnual ? 'text-primary font-semibold' : 'text-gray-400'}`}>Monthly</span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            className="data-[state=checked]:bg-primary"
          />
          <span className={`text-lg ${isAnnual ? 'text-primary font-semibold' : 'text-gray-400'}`}>
            Annual <span className="text-green-500 text-sm font-bold ml-1">Save 10%</span>
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-[#222] p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Free</h3>
            <p className="text-3xl font-bold mb-6">$0<span className="text-sm font-normal">/{isAnnual ? 'year' : 'month'}</span></p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Limited content access</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Ad-supported viewing</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>HD quality (1080p)</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Basic channels only</span>
              </li>
            </ul>
            <Link to="/signup?plan=free">
              <Button className="w-full mt-6 bg-primary hover:bg-primary/90">Get Started</Button>
            </Link>
          </div>
          
          <div className="bg-[#222] p-6 rounded-lg border-2 border-primary relative">
            <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-sm font-bold py-1 px-3 rounded-full">
              Popular
            </div>
            <h3 className="text-xl font-bold mb-4">Standard</h3>
            <p className="text-3xl font-bold mb-6">${getPrice(9.95)}<span className="text-sm font-normal">/{isAnnual ? 'year' : 'month'}</span></p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Most content access</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Limited ads (max 2 per show)</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>HD quality (1080p)</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Most channels included</span>
              </li>
            </ul>
            <Link to="/signup?plan=standard">
              <Button className="w-full mt-6 bg-primary hover:bg-primary/90">Get Started</Button>
            </Link>
          </div>
          
          <div className="bg-[#222] p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Premium</h3>
            <p className="text-3xl font-bold mb-6">${getPrice(19.95)}<span className="text-sm font-normal">/{isAnnual ? 'year' : 'month'}</span></p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>All content access</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>No ads ever</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>4K + HDR quality</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>All channels included</span>
              </li>
            </ul>
            <Link to="/signup?plan=premium">
              <Button className="w-full mt-6 bg-primary hover:bg-primary/90">Get Started</Button>
            </Link>
          </div>
        </div>

        {/* Create Your Own TV Channel Section */}
        <div className="mt-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Create Your Own TV Channel</h2>
          <p className="text-xl mb-12">Launch your own streaming channel on Zoe RatedTV</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-[#222] p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Video className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">Basic</h3>
              </div>
              <p className="text-3xl font-bold mb-6">${getChannelPrice(295)}<span className="text-sm font-normal">/{isAnnual ? 'year' : 'month'}</span></p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>5 Rows</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>20 videos per row</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>100 videos total</span>
                </li>
                <li className="flex items-center">
                  <span className="text-red-500 mr-2">✗</span>
                  <span className="text-gray-400">No Live Streaming</span>
                </li>
              </ul>
              <Link to="/signup?channel=basic">
                <Button className="w-full mt-6 bg-primary hover:bg-primary/90">Get Started</Button>
              </Link>
            </div>
            
            <div className="bg-[#222] p-6 rounded-lg border-2 border-primary relative">
              <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-sm font-bold py-1 px-3 rounded-full">
                Popular
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Tv className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">Professional</h3>
              </div>
              <p className="text-3xl font-bold mb-6">${getChannelPrice(495)}<span className="text-sm font-normal">/{isAnnual ? 'year' : 'month'}</span></p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>10 Rows</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>50 videos per row</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>500 videos total</span>
                </li>
                <li className="flex items-center">
                  <span className="text-red-500 mr-2">✗</span>
                  <span className="text-gray-400">No Live Streaming</span>
                </li>
              </ul>
              <Link to="/signup?channel=professional">
                <Button className="w-full mt-6 bg-primary hover:bg-primary/90">Get Started</Button>
              </Link>
            </div>
            
            <div className="bg-[#222] p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Radio className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">Enterprise</h3>
              </div>
              <p className="text-3xl font-bold mb-6">${getChannelPrice(995)}<span className="text-sm font-normal">/{isAnnual ? 'year' : 'month'}</span></p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>20 Rows</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>50 videos per row</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>1000 videos total</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Access to Live Streaming</span>
                </li>
              </ul>
              <Link to="/signup?channel=enterprise">
                <Button className="w-full mt-6 bg-primary hover:bg-primary/90">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
