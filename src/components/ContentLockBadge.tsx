import { Lock, Crown, Star } from "lucide-react";

interface ContentLockBadgeProps {
  requiredPlans: string[];
  userPlan: string;
  size?: 'sm' | 'md';
}

export const ContentLockBadge = ({ requiredPlans, userPlan, size = 'sm' }: ContentLockBadgeProps) => {
  const planOrder = ['free', 'standard', 'premium'];
  const userPlanIndex = planOrder.indexOf(userPlan);
  
  // Check if user has access
  const hasAccess = requiredPlans.some(plan => planOrder.indexOf(plan) <= userPlanIndex);
  
  if (hasAccess || requiredPlans.length === 0) {
    return null;
  }
  
  // Determine the lowest plan that unlocks this content
  const lowestRequiredPlan = requiredPlans
    .filter(plan => planOrder.indexOf(plan) > userPlanIndex)
    .sort((a, b) => planOrder.indexOf(a) - planOrder.indexOf(b))[0];
  
  const isPremiumOnly = lowestRequiredPlan === 'premium';
  const isStandardPlus = lowestRequiredPlan === 'standard';
  
  const sizeClasses = size === 'sm' 
    ? 'text-[10px] px-1.5 py-0.5' 
    : 'text-xs px-2 py-1';
  
  if (isPremiumOnly) {
    return (
      <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 rounded ${sizeClasses} bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold`}>
        <Crown className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        Premium
      </div>
    );
  }
  
  if (isStandardPlus) {
    return (
      <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 rounded ${sizeClasses} bg-primary/90 text-primary-foreground font-semibold`}>
        <Star className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        Standard+
      </div>
    );
  }
  
  return (
    <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 rounded ${sizeClasses} bg-muted/90 text-foreground font-semibold`}>
      <Lock className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
    </div>
  );
};

export default ContentLockBadge;
