import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Crown, Star, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  price: number | null;
}

interface MembershipPlansSelectorProps {
  selectedPlans: string[];
  onSelectedPlansChange: (plans: string[]) => void;
}

export const MembershipPlansSelector = ({
  selectedPlans,
  onSelectedPlansChange,
}: MembershipPlansSelectorProps) => {
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from("membership_plans")
        .select("id, name, slug, price")
        .order("sort_order");
      if (data) {
        setMembershipPlans(data);
        setLoaded(true);
      }
    };
    fetchPlans();
  }, []);

  const togglePlan = (planId: string) => {
    if (selectedPlans.includes(planId)) {
      onSelectedPlansChange(selectedPlans.filter(id => id !== planId));
    } else {
      onSelectedPlansChange([...selectedPlans, planId]);
    }
  };

  const selectAllPlans = () => {
    onSelectedPlansChange(membershipPlans.map(p => p.id));
  };

  const selectNonePlans = () => {
    onSelectedPlansChange([]);
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'premium':
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 'standard':
        return <Star className="w-4 h-4 text-primary" />;
      default:
        return <Users className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === 0) return 'Free';
    return `$${price.toFixed(2)}/mo`;
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="py-3">
        <CardTitle className="text-sm text-white flex items-center justify-between">
          Membership Tier Access
          <div className="flex gap-2 text-xs font-normal">
            Select: {" "}
            <button 
              type="button" 
              onClick={selectAllPlans}
              className="text-primary hover:underline"
            >
              All
            </button>
            <span className="text-gray-500">|</span>
            <button 
              type="button" 
              onClick={selectNonePlans}
              className="text-primary hover:underline"
            >
              None
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground mb-3">
          Content will only be accessible to users on the selected plan(s). 
          Leave all unchecked to make content available to everyone.
        </p>
        {membershipPlans.map((plan) => (
          <div 
            key={plan.id} 
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
              selectedPlans.includes(plan.id) 
                ? plan.slug === 'premium' 
                  ? 'bg-amber-500/10 border border-amber-500/30' 
                  : plan.slug === 'standard'
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-muted/30 border border-muted'
                : 'bg-gray-900/50 border border-transparent hover:bg-gray-900'
            }`}
            onClick={() => togglePlan(plan.id)}
          >
            <Checkbox
              id={`plan-${plan.id}`}
              checked={selectedPlans.includes(plan.id)}
              onCheckedChange={() => togglePlan(plan.id)}
            />
            <div className="flex items-center gap-2 flex-1">
              {getPlanIcon(plan.slug)}
              <label 
                htmlFor={`plan-${plan.id}`} 
                className="text-sm text-white cursor-pointer font-medium"
              >
                {plan.name}
              </label>
            </div>
            <span className={`text-xs font-medium ${
              plan.slug === 'premium' 
                ? 'text-amber-500' 
                : plan.slug === 'standard'
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}>
              {formatPrice(plan.price)}
            </span>
          </div>
        ))}
        
        {selectedPlans.length === 0 && (
          <p className="text-xs text-amber-500/80 mt-2">
            ⚠️ No plans selected - this content will be hidden from all users
          </p>
        )}
      </CardContent>
    </Card>
  );
};