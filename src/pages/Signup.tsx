
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, Check } from "lucide-react";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Check if plan is in URL
  const planFromUrl = searchParams.get("plan");
  
  // Initialize selected plan from URL parameter
  useState(() => {
    if (planFromUrl) {
      setSelectedPlan(planFromUrl);
    }
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan);
    setStep(3);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // This would be replaced with actual signup logic
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Account created successfully!");
      navigate("/browse");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white px-4 py-4 border-b">
        <Link to="/">
          <img 
            src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png" 
            alt="ZOE" 
            className="h-16 object-contain" 
          />
        </Link>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {step === 1 && (
          <div className="max-w-md w-full text-center">
            <img src="https://assets.nflxext.com/ffe/siteui/acquisition/simplicity/Devices.png" 
                alt="Devices" 
                className="h-16 mx-auto mb-4" />
            
            <p className="text-sm text-[#333] mb-2">STEP 1 OF 3</p>
            <h1 className="text-3xl font-bold mb-4">Create a password to start your membership</h1>
            <p className="mb-6">Just a few more steps and you're done!</p>
            
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email address"
                className="w-full p-4 rounded-md border focus:outline-none focus:ring-1 focus:ring-[#e50914]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <input
                type="password"
                placeholder="Add a password"
                className="w-full p-4 rounded-md border focus:outline-none focus:ring-1 focus:ring-[#e50914]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
              <Button 
                type="submit" 
                className="w-full bg-[#e50914] hover:bg-[#f6121d] text-white font-medium text-lg p-6"
              >
                Next
              </Button>
            </form>
          </div>
        )}
        
        {step === 2 && (
          <div className="max-w-2xl w-full">
            <p className="text-sm text-[#333] mb-2 text-center">STEP 2 OF 3</p>
            <h1 className="text-3xl font-bold mb-4 text-center">Choose your plan</h1>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="text-[#e50914] mr-2 mt-1 flex-shrink-0" />
                <span>No commitments, cancel anytime.</span>
              </li>
              <li className="flex items-start">
                <Check className="text-[#e50914] mr-2 mt-1 flex-shrink-0" />
                <span>Everything on ZOE for one low price.</span>
              </li>
              <li className="flex items-start">
                <Check className="text-[#e50914] mr-2 mt-1 flex-shrink-0" />
                <span>No ads and no extra fees. Ever.</span>
              </li>
            </ul>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                className={`border-2 p-6 rounded-md cursor-pointer transition-all ${
                  selectedPlan === 'free' ? 'border-[#e50914] bg-[#ffefeb]' : 'border-gray-300 hover:border-gray-500'
                }`}
                onClick={() => handlePlanSelect('free')}
              >
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
              </div>
              
              <div 
                className={`border-2 p-6 rounded-md cursor-pointer transition-all relative ${
                  selectedPlan === 'standard' ? 'border-[#e50914] bg-[#ffefeb]' : 'border-gray-300 hover:border-gray-500'
                }`}
                onClick={() => handlePlanSelect('standard')}
              >
                <div className="absolute -top-3 -right-3 bg-[#e50914] text-white text-sm font-bold py-1 px-3 rounded-full">
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
              </div>
              
              <div 
                className={`border-2 p-6 rounded-md cursor-pointer transition-all ${
                  selectedPlan === 'premium' ? 'border-[#e50914] bg-[#ffefeb]' : 'border-gray-300 hover:border-gray-500'
                }`}
                onClick={() => handlePlanSelect('premium')}
              >
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
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              HD (720p), Full HD (1080p), Ultra HD (4K) and HDR availability subject to your internet service and device capabilities. Not all content is available in all resolutions. See our Terms of Use for more details.
            </p>
            
            <p className="text-sm text-gray-500 mt-2">
              Only people who live with you may use your account. Watch on multiple devices at the same time with Premium.
            </p>
          </div>
        )}
        
        {step === 3 && (
          <div className="max-w-md w-full text-center">
            <p className="text-sm text-[#333] mb-2">STEP 3 OF 3</p>
            <h1 className="text-3xl font-bold mb-4">Set up your payment</h1>
            
            <div className="border rounded-lg p-6 mb-6 text-left">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold">
                  {selectedPlan === 'free' ? 'Free' : 
                   selectedPlan === 'standard' ? 'Standard' : 'Premium'}
                </span>
                <span className="font-bold">
                  {selectedPlan === 'free' ? '$0/month' : 
                   selectedPlan === 'standard' ? '$9.99/month' : '$14.99/month'}
                </span>
              </div>
              
              <p className="text-sm text-gray-500">
                Your membership starts as soon as you set up payment.
                {selectedPlan !== 'free' && " First month free."}
              </p>
            </div>
            
            <form onSubmit={handleSignup} className="text-left space-y-6">
              <div>
                <label className="font-bold block mb-2">Credit or Debit Card</label>
                <input
                  type="text"
                  placeholder="Card number"
                  className="w-full p-4 rounded-md border focus:outline-none focus:ring-1 focus:ring-[#e50914]"
                  disabled={selectedPlan === 'free'}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Expiration date (MM/YY)"
                    className="w-full p-4 rounded-md border focus:outline-none focus:ring-1 focus:ring-[#e50914]"
                    disabled={selectedPlan === 'free'}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="CVV"
                    className="w-full p-4 rounded-md border focus:outline-none focus:ring-1 focus:ring-[#e50914]"
                    disabled={selectedPlan === 'free'}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-[#e50914] hover:bg-[#f6121d] text-white font-medium text-lg p-6"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : (selectedPlan === 'free' ? "Start Membership" : "Start Paid Membership")}
              </Button>
              
              <p className="text-sm text-gray-500">
                By clicking the "Start Paid Membership" button, you agree to our Terms of Use and that you are over 18. ZOE will automatically continue your membership and charge the membership fee (currently {selectedPlan === 'standard' ? '$9.99' : selectedPlan === 'premium' ? '$14.99' : '$0'}/month) to your payment method until you cancel. You may cancel at any time to avoid future charges.
              </p>
            </form>
          </div>
        )}
      </div>
      
      <footer className="bg-white py-8 px-4 text-[#737373] border-t">
        <div className="max-w-6xl mx-auto">
          <p className="mb-6">Questions? Call 1-800-555-5555</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <a href="#" className="hover:underline">FAQ</a>
            <a href="#" className="hover:underline">Help Center</a>
            <a href="#" className="hover:underline">Terms of Use</a>
            <a href="#" className="hover:underline">Privacy</a>
          </div>
          
          <p className="mt-8 text-sm">Zoetality Is Our Reality</p>
        </div>
      </footer>
    </div>
  );
};

export default Signup;
