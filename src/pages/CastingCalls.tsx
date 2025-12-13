import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import BrowseFooter from "@/components/BrowseFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MapPin, Calendar, DollarSign, Users, Clock, Star, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type TalentCategory = 'actor' | 'model' | 'singer' | 'dancer' | 'extra' | 'voice_artist' | 'host' | 'influencer' | 'other';

interface CastingCall {
  id: string;
  title: string;
  description: string | null;
  project_name: string | null;
  category: TalentCategory;
  location: string | null;
  compensation: string | null;
  deadline: string | null;
  requirements: string | null;
  age_range: string | null;
  gender: string | null;
  is_featured: boolean;
  poster_url: string | null;
}

const CATEGORY_LABELS: Record<TalentCategory, string> = {
  actor: "Actor",
  model: "Model",
  singer: "Singer",
  dancer: "Dancer",
  voice_artist: "Voice Artist",
  host: "Host",
  influencer: "Influencer",
  extra: "Extra",
  other: "Other",
};

export default function CastingCalls() {
  const { user } = useAuth();
  const [castingCalls, setCastingCalls] = useState<CastingCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<CastingCall | null>(null);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [userTalentId, setUserTalentId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCastingCalls();
    if (user) fetchUserTalent();
  }, [user]);

  const fetchCastingCalls = async () => {
    setLoading(true);
    
    const { data } = await supabase
      .from('casting_calls')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) setCastingCalls(data as CastingCall[]);
    setLoading(false);
  };

  const fetchUserTalent = async () => {
    if (!user) return;

    const { data: talent } = await supabase
      .from('talents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (talent) {
      setUserTalentId(talent.id);
      
      // Fetch applied casting calls
      const { data: applications } = await supabase
        .from('casting_applications')
        .select('casting_call_id')
        .eq('talent_id', talent.id);

      if (applications) {
        setAppliedIds(new Set(applications.map(a => a.casting_call_id)));
      }
    }
  };

  const handleApply = async () => {
    if (!userTalentId || !selectedCall) return;

    setApplying(true);

    try {
      const { error } = await supabase
        .from('casting_applications')
        .insert({
          casting_call_id: selectedCall.id,
          talent_id: userTalentId,
          cover_letter: coverLetter.trim() || null,
        });

      if (error) throw error;

      setAppliedIds(new Set([...appliedIds, selectedCall.id]));
      toast.success("Application submitted successfully!");
      setSelectedCall(null);
      setCoverLetter("");
    } catch (error: any) {
      if (error.message.includes('duplicate')) {
        toast.error("You have already applied to this casting call");
      } else {
        toast.error(error.message);
      }
    } finally {
      setApplying(false);
    }
  };

  const featuredCalls = castingCalls.filter(c => c.is_featured);
  const regularCalls = castingCalls.filter(c => !c.is_featured);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary/20 via-background to-background py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Casting Calls
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Discover exclusive opportunities and apply directly to productions looking for talent like you.
          </p>
          
          {!userTalentId && user && (
            <Link to="/talent/signup" className="inline-block mt-6">
              <Button size="lg">
                Create Talent Profile to Apply
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : castingCalls.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No casting calls available right now</p>
            <p className="text-muted-foreground mt-2">Check back soon for new opportunities</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featuredCalls.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Star className="h-6 w-6 text-primary" />
                  Featured Opportunities
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredCalls.map((call) => (
                    <CastingCallCard 
                      key={call.id} 
                      call={call} 
                      onApply={() => setSelectedCall(call)}
                      hasApplied={appliedIds.has(call.id)}
                      canApply={!!userTalentId}
                      featured
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Calls */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">All Opportunities</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularCalls.map((call) => (
                  <CastingCallCard 
                    key={call.id} 
                    call={call} 
                    onApply={() => setSelectedCall(call)}
                    hasApplied={appliedIds.has(call.id)}
                    canApply={!!userTalentId}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Apply Dialog */}
      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply to: {selectedCall?.title}</DialogTitle>
            <DialogDescription>
              Submit your application for {selectedCall?.project_name || 'this project'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cover Letter (Optional)</label>
              <Textarea 
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell them why you're perfect for this role..."
                rows={5}
              />
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleApply} 
                disabled={applying}
                className="flex-1"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
              <Button variant="outline" onClick={() => setSelectedCall(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BrowseFooter />
    </div>
  );
}

interface CastingCallCardProps {
  call: CastingCall;
  onApply: () => void;
  hasApplied: boolean;
  canApply: boolean;
  featured?: boolean;
}

function CastingCallCard({ call, onApply, hasApplied, canApply, featured }: CastingCallCardProps) {
  const isExpired = call.deadline && new Date(call.deadline) < new Date();

  return (
    <Card className={`bg-card/50 border-border/50 ${featured ? 'ring-2 ring-primary/30' : ''} hover:border-primary/30 transition-all`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-primary border-primary/30">
                {CATEGORY_LABELS[call.category]}
              </Badge>
              {featured && (
                <Badge className="bg-primary/20 text-primary">Featured</Badge>
              )}
            </div>
            <CardTitle className="text-xl">{call.title}</CardTitle>
            {call.project_name && (
              <CardDescription className="text-primary mt-1">
                {call.project_name}
              </CardDescription>
            )}
          </div>
          {call.poster_url && (
            <div className="w-20 h-28 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img src={call.poster_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {call.description && (
          <p className="text-muted-foreground text-sm line-clamp-3">{call.description}</p>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          {call.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              {call.location}
            </div>
          )}
          {call.compensation && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 text-primary" />
              {call.compensation}
            </div>
          )}
          {call.age_range && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              Age: {call.age_range}
            </div>
          )}
          {call.deadline && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              {isExpired ? 'Expired' : `Due: ${format(new Date(call.deadline), 'MMM d, yyyy')}`}
            </div>
          )}
        </div>

        <div className="pt-2">
          {hasApplied ? (
            <Button variant="outline" disabled className="w-full">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Applied
            </Button>
          ) : isExpired ? (
            <Button variant="outline" disabled className="w-full">
              Deadline Passed
            </Button>
          ) : canApply ? (
            <Button onClick={onApply} className="w-full">
              Apply Now
            </Button>
          ) : (
            <Link to="/talent/signup" className="block">
              <Button variant="outline" className="w-full">
                Create Profile to Apply
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
