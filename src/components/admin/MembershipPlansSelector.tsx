import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Star, Users, Check, ChevronsUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from("membership_plans")
        .select("id, name, slug, price")
        .order("sort_order");
      if (data) {
        setMembershipPlans(data);
      }
    };
    fetchPlans();
  }, []);

  const togglePlan = (planId: string) => {
    const newPlans = selectedPlans.includes(planId)
      ? selectedPlans.filter(id => id !== planId)
      : [...selectedPlans, planId];
    onSelectedPlansChange(newPlans);
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

  const getSelectedPlanNames = () => {
    if (selectedPlans.length === 0) return "Select membership plans...";
    const names = membershipPlans
      .filter(p => selectedPlans.includes(p.id))
      .map(p => p.name);
    return names.join(", ");
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="py-3">
        <CardTitle className="text-sm text-white">
          Membership Tier Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground mb-3">
          Content will only be accessible to users on the selected plan(s). 
          Leave all unchecked to make content available to everyone.
        </p>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-gray-900 border-gray-600 text-white hover:bg-gray-800"
            >
              <span className="truncate">{getSelectedPlanNames()}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 bg-gray-900 border-gray-700" align="start">
            <div className="p-2 space-y-1">
              {membershipPlans.map((plan) => {
                const isSelected = selectedPlans.includes(plan.id);
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePlan(plan.id);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full p-3 rounded-lg transition-colors text-left",
                      isSelected 
                        ? plan.slug === 'premium' 
                          ? 'bg-amber-500/10 border border-amber-500/30' 
                          : plan.slug === 'standard'
                          ? 'bg-primary/10 border border-primary/30'
                          : 'bg-muted/30 border border-muted'
                        : 'bg-gray-800/50 border border-transparent hover:bg-gray-800'
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 border rounded flex items-center justify-center",
                      isSelected ? "bg-primary border-primary" : "border-gray-500"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      {getPlanIcon(plan.slug)}
                      <span className="text-sm text-white font-medium">
                        {plan.name}
                      </span>
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      plan.slug === 'premium' 
                        ? 'text-amber-500' 
                        : plan.slug === 'standard'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}>
                      {formatPrice(plan.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        
        {selectedPlans.length === 0 && (
          <p className="text-xs text-amber-500/80 mt-2">
            ⚠️ No plans selected - this content will be hidden from all users
          </p>
        )}
      </CardContent>
    </Card>
  );
};
