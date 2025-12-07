import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
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

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from("membership_plans")
        .select("id, name, slug")
        .order("sort_order");
      if (data) setMembershipPlans(data);
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

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="py-3">
        <CardTitle className="text-sm text-white flex items-center justify-between">
          Require Membership
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
      <CardContent className="space-y-2">
        {membershipPlans.map((plan) => (
          <div key={plan.id} className="flex items-center gap-3">
            <Checkbox
              id={`plan-${plan.id}`}
              checked={selectedPlans.includes(plan.id)}
              onCheckedChange={() => togglePlan(plan.id)}
            />
            <label 
              htmlFor={`plan-${plan.id}`} 
              className="text-sm text-white cursor-pointer"
            >
              {plan.name}
            </label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
