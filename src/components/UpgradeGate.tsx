import { Button } from "@/components/ui/button";
import { Lock, Crown, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeGateProps {
  requiredPlans: string[];
  currentPlan: string;
  contentTitle: string;
  onClose?: () => void;
}

export const UpgradeGate = ({ requiredPlans, currentPlan, contentTitle, onClose }: UpgradeGateProps) => {
  const navigate = useNavigate();
  
  const planOrder = ['free', 'standard', 'premium'];
  const planNames: Record<string, string> = {
    free: 'Free',
    standard: 'Standard ($9.95/mo)',
    premium: 'Premium ($19.95/mo)'
  };
  
  // Determine which plans unlock this content
  const availablePlans = requiredPlans
    .filter(plan => planOrder.indexOf(plan) > planOrder.indexOf(currentPlan))
    .sort((a, b) => planOrder.indexOf(a) - planOrder.indexOf(b));
  
  const lowestRequiredPlan = requiredPlans.sort((a, b) => planOrder.indexOf(a) - planOrder.indexOf(b))[0];
  
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Upgrade to Watch
        </h2>
        
        <p className="text-muted-foreground mb-6">
          "{contentTitle}" is not available on your current plan.
        </p>
        
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground mb-2">Available on:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {requiredPlans.map(plan => (
              <span 
                key={plan} 
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  plan === 'premium' 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black' 
                    : plan === 'standard'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {plan === 'premium' && <Crown className="w-3 h-3 inline mr-1" />}
                {plan === 'standard' && <Star className="w-3 h-3 inline mr-1" />}
                {planNames[plan]}
              </span>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          {availablePlans.includes('standard') && (
            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => navigate('/plans?upgrade=standard')}
            >
              <Star className="w-4 h-4 mr-2" />
              Upgrade to Standard - $9.95/mo
            </Button>
          )}
          
          {availablePlans.includes('premium') && (
            <Button 
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-600 hover:to-yellow-600"
              onClick={() => navigate('/plans?upgrade=premium')}
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium - $19.95/mo
            </Button>
          )}
          
          {onClose && (
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={onClose}
            >
              Maybe Later
            </Button>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground mt-6">
          Upgrade anytime. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default UpgradeGate;
