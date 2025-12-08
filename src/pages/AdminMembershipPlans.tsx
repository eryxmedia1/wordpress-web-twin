import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Crown, Star, Users, Plus, X, Save, Trash } from "lucide-react";
import AdminNavbar from "@/components/AdminNavbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AVAILABLE_CHANNELS = [
  "Zoe RatedTV",
  "MadFaceTV",
  "AyiTV",
  "MyPureTV",
  "Yard MonTV",
  "Indie Films",
  "More Networks",
  "Boss Mogul TV",
  "Caught On Camera",
  "Cap Village Media",
  "Live From Da Street",
];

interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  description: string | null;
  features: string[] | null;
  included_channels: string[] | null;
  sort_order: number | null;
}

const AdminMembershipPlans = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("membership_plans")
      .select("*")
      .order("sort_order");
    
    if (error) {
      toast.error("Failed to load plans");
      return;
    }
    
    setPlans(data || []);
    setLoading(false);
  };

  const handleEditPlan = (plan: MembershipPlan) => {
    setEditingPlan({ ...plan });
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    
    setSaving(editingPlan.id);
    
    const { error } = await supabase
      .from("membership_plans")
      .update({
        name: editingPlan.name,
        price: editingPlan.price,
        description: editingPlan.description,
        features: editingPlan.features,
        included_channels: editingPlan.included_channels,
      })
      .eq("id", editingPlan.id);
    
    if (error) {
      toast.error("Failed to save plan");
      setSaving(null);
      return;
    }
    
    toast.success("Plan updated successfully");
    setEditingPlan(null);
    setSaving(null);
    fetchPlans();
  };

  const handleAddFeature = () => {
    if (!editingPlan || !newFeature.trim()) return;
    
    setEditingPlan({
      ...editingPlan,
      features: [...(editingPlan.features || []), newFeature.trim()]
    });
    setNewFeature("");
  };

  const handleRemoveFeature = (index: number) => {
    if (!editingPlan) return;
    
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features?.filter((_, i) => i !== index) || []
    });
  };

  const handleChannelToggle = (channel: string) => {
    if (!editingPlan) return;
    
    const currentChannels = editingPlan.included_channels || [];
    const newChannels = currentChannels.includes(channel)
      ? currentChannels.filter(c => c !== channel)
      : [...currentChannels, channel];
    
    setEditingPlan({
      ...editingPlan,
      included_channels: newChannels
    });
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'premium': return <Crown className="w-8 h-8 text-amber-500" />;
      case 'standard': return <Star className="w-8 h-8 text-primary" />;
      default: return <Users className="w-8 h-8 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-10">
        <h1 className="text-3xl font-bold mb-2">Membership Plans</h1>
        <p className="text-muted-foreground mb-8">
          Customize features and channels for each membership tier
        </p>
        
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`bg-card border-border ${
              plan.slug === 'premium' ? 'border-amber-500/50' : 
              plan.slug === 'standard' ? 'border-primary/50' : ''
            }`}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-2">
                  {getPlanIcon(plan.slug)}
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-2xl font-bold">
                  {plan.price === 0 || plan.price === null ? 'Free' : `$${plan.price.toFixed(2)}/mo`}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Features ({plan.features?.length || 0})</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {plan.features?.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="truncate">• {feature}</li>
                    ))}
                    {(plan.features?.length || 0) > 4 && (
                      <li className="text-primary">+{plan.features!.length - 4} more</li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold mb-2">Channels ({plan.included_channels?.length || 0})</h4>
                  <div className="flex flex-wrap gap-1">
                    {plan.included_channels?.slice(0, 3).map((channel, idx) => (
                      <span key={idx} className="text-xs bg-muted px-2 py-0.5 rounded">
                        {channel}
                      </span>
                    ))}
                    {(plan.included_channels?.length || 0) > 3 && (
                      <span className="text-xs text-primary">
                        +{plan.included_channels!.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleEditPlan(plan)}
                >
                  Edit Plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Edit Modal */}
        {editingPlan && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-card">
                <h2 className="text-xl font-bold">Edit {editingPlan.name} Plan</h2>
                <Button variant="ghost" size="icon" onClick={() => setEditingPlan(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid gap-4">
                  <div>
                    <Label>Plan Name</Label>
                    <Input
                      value={editingPlan.name}
                      onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  
                  <div>
                    <Label>Price ($ per month)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingPlan.price || 0}
                      onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })}
                      className="bg-background"
                    />
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={editingPlan.description || ""}
                      onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                </div>
                
                {/* Features */}
                <div>
                  <Label className="mb-2 block">Features</Label>
                  <div className="space-y-2 mb-4">
                    {editingPlan.features?.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-muted p-2 rounded">
                        <span className="flex-1 text-sm">{feature}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => handleRemoveFeature(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a feature..."
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                      className="bg-background"
                    />
                    <Button onClick={handleAddFeature} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Channels */}
                <div>
                  <Label className="mb-2 block">Included Channels</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_CHANNELS.map((channel) => (
                      <div key={channel} className="flex items-center space-x-2">
                        <Checkbox
                          id={`channel-${channel}`}
                          checked={editingPlan.included_channels?.includes(channel) || false}
                          onCheckedChange={() => handleChannelToggle(channel)}
                        />
                        <label
                          htmlFor={`channel-${channel}`}
                          className="text-sm cursor-pointer"
                        >
                          {channel}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-card">
                <Button variant="outline" onClick={() => setEditingPlan(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSavePlan}
                  disabled={saving === editingPlan.id}
                  className="bg-primary"
                >
                  {saving === editingPlan.id ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMembershipPlans;