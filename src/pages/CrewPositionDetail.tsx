import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { CastingSubNav } from "@/components/casting/CastingSubNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  MapPin, DollarSign, Clock, Briefcase, Building2, 
  Calendar, CheckCircle, ArrowLeft, Send 
} from "lucide-react";
import type { CrewPosition } from "@/types/casting";

export default function CrewPositionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [position, setPosition] = useState<CrewPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplication, setShowApplication] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [talentId, setTalentId] = useState<string | null>(null);
  
  // Application form state
  const [coverLetter, setCoverLetter] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [payAccepted, setPayAccepted] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPosition();
      if (user) {
        checkExistingApplication();
      }
    }
  }, [id, user]);

  const fetchPosition = async () => {
    const { data } = await supabase
      .from("crew_positions")
      .select("*, departments(*), casting_shows(title, slug)")
      .eq("id", id)
      .single();

    setPosition(data);
    setLoading(false);
  };

  const checkExistingApplication = async () => {
    // Get user's talent profile
    const { data: talent } = await supabase
      .from("talents")
      .select("id")
      .eq("user_id", user!.id)
      .single();

    if (talent) {
      setTalentId(talent.id);
      
      // Check if already applied
      const { data: app } = await supabase
        .from("crew_applications")
        .select("id")
        .eq("position_id", id)
        .eq("talent_id", talent.id)
        .single();

      setHasApplied(!!app);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate("/talent/signup?type=crew");
      return;
    }

    if (!talentId) {
      toast.error("Please complete your crew profile first");
      navigate("/talent/signup?type=crew");
      return;
    }

    if (!termsAccepted || !payAccepted) {
      toast.error("Please accept the terms and pay agreement");
      return;
    }

    setApplying(true);

    // Get full talent profile for snapshot
    const { data: talent } = await supabase
      .from("talents")
      .select("*")
      .eq("id", talentId)
      .single();

    const { error } = await supabase.from("crew_applications").insert({
      position_id: id,
      talent_id: talentId,
      show_id: position?.show_id,
      cover_letter: coverLetter,
      profile_snapshot: talent,
      terms_acceptance_timestamp: new Date().toISOString(),
      pay_acceptance_timestamp: new Date().toISOString()
    });

    if (error) {
      toast.error("Failed to submit application");
    } else {
      toast.success("Application submitted successfully!");
      setHasApplied(true);
      setShowApplication(false);
    }
    setApplying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <CastingSubNav />
        <div className="container mx-auto px-4 py-8 pt-40">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-96 mb-4" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <CastingSubNav />
        <div className="container mx-auto px-4 py-8 pt-40 text-center">
          <h1 className="text-2xl font-bold">Position not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CastingSubNav />
      
      <div className="container mx-auto px-4 py-8 pt-40 max-w-4xl">
        <Link to="/casting/crew" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Crew Hiring
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link 
              to={`/casting/departments/${position.departments?.slug}`}
              className="text-primary hover:underline"
            >
              {position.departments?.name}
            </Link>
            <span className="text-muted-foreground">/</span>
            <Badge variant={position.status === "open" ? "default" : "secondary"}>
              {position.status}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold mb-2">{position.title}</h1>
          {position.casting_shows && (
            <p className="text-lg text-muted-foreground">
              For: <Link to={`/casting/shows/${position.casting_shows.slug}`} className="text-primary hover:underline">
                {position.casting_shows.title}
              </Link>
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Info */}
            <div className="flex flex-wrap gap-4">
              {position.location && (
                <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{position.location}</span>
                </div>
              )}
              {position.pay_amount && (
                <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span>{position.pay_amount} ({position.rate_type})</span>
                </div>
              )}
              {position.deadline && (
                <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Deadline: {new Date(position.deadline).toLocaleDateString()}</span>
                </div>
              )}
              {position.is_remote && (
                <Badge variant="secondary">Remote Friendly</Badge>
              )}
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{position.description}</p>
              </CardContent>
            </Card>

            {/* Responsibilities */}
            {position.responsibilities && (
              <Card>
                <CardHeader>
                  <CardTitle>Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{position.responsibilities}</p>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {(position.required_experience || position.gear_required) && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {position.required_experience && (
                    <div>
                      <h4 className="font-medium mb-1">Experience Required</h4>
                      <p className="text-muted-foreground">{position.required_experience}</p>
                    </div>
                  )}
                  {position.gear_required && (
                    <div>
                      <h4 className="font-medium mb-1">Gear/Equipment Required</h4>
                      <p className="text-muted-foreground">{position.gear_required}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Schedule */}
            {position.schedule_expectations && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Schedule & Availability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{position.schedule_expectations}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Apply */}
          <div>
            <Card className="sticky top-40">
              <CardHeader>
                <CardTitle>Apply for This Position</CardTitle>
              </CardHeader>
              <CardContent>
                {hasApplied ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="font-medium">Application Submitted</p>
                    <p className="text-sm text-muted-foreground">
                      We'll be in touch if you're selected
                    </p>
                  </div>
                ) : showApplication ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="coverLetter">Cover Letter / Message</Label>
                      <Textarea
                        id="coverLetter"
                        placeholder="Tell us why you're a great fit..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        className="mt-1"
                        rows={4}
                      />
                    </div>

                    {position.pay_amount && (
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="payAccepted"
                          checked={payAccepted}
                          onCheckedChange={(checked) => setPayAccepted(!!checked)}
                        />
                        <Label htmlFor="payAccepted" className="text-sm">
                          I accept the pay rate of {position.pay_amount} ({position.rate_type})
                        </Label>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="termsAccepted"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                      />
                      <Label htmlFor="termsAccepted" className="text-sm">
                        {position.terms_conditions || "I agree to the terms and conditions for this position"}
                      </Label>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowApplication(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleApply}
                        disabled={applying || (!position.pay_amount ? !termsAccepted : !termsAccepted || !payAccepted)}
                        className="flex-1"
                      >
                        {applying ? "Submitting..." : "Submit Application"}
                        <Send className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-2">
                      {position.pay_amount && (
                        <div className="text-2xl font-bold text-primary">
                          {position.pay_amount}
                        </div>
                      )}
                      {position.rate_type && (
                        <div className="text-sm text-muted-foreground capitalize">
                          {position.rate_type} rate
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => user ? setShowApplication(true) : navigate("/talent/signup?type=crew")}
                      disabled={position.status !== "open"}
                    >
                      {position.status === "open" ? "Apply Now" : "Position Closed"}
                    </Button>

                    {!user && (
                      <p className="text-xs text-center text-muted-foreground">
                        You'll need to create a crew profile to apply
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
