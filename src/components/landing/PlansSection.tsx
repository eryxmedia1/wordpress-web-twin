
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PlansSection = () => {
  return (
    <section className="bg-black text-white border-t-8 border-[#222] py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Choose the plan that's right for you</h2>
        <p className="text-xl mb-12">Join with a free trial, cancel anytime.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-[#222] p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Free</h3>
            <p className="text-3xl font-bold mb-6">$0<span className="text-sm font-normal">/month</span></p>
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
                <span>SD quality (480p)</span>
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
            <p className="text-3xl font-bold mb-6">$9.99<span className="text-sm font-normal">/month</span></p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Full content access</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Ad-free viewing</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>HD quality (1080p)</span>
              </li>
            </ul>
            <Link to="/signup?plan=standard">
              <Button className="w-full mt-6 bg-primary hover:bg-primary/90">Get Started</Button>
            </Link>
          </div>
          
          <div className="bg-[#222] p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Premium</h3>
            <p className="text-3xl font-bold mb-6">$14.99<span className="text-sm font-normal">/month</span></p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Full content access</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Ad-free viewing</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>4K + HDR quality</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Multiple devices</span>
              </li>
            </ul>
            <Link to="/signup?plan=premium">
              <Button className="w-full mt-6 bg-primary hover:bg-primary/90">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
