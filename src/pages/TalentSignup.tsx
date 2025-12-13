import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { CastingSubNav } from "@/components/casting/CastingSubNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Star, Camera, Users, Mic, Film, CheckCircle } from "lucide-react";

type TalentCategory = 'actor' | 'model' | 'singer' | 'dancer' | 'extra' | 'voice_artist' | 'host' | 'influencer' | 'other';

const CATEGORIES: { value: TalentCategory; label: string; icon: React.ReactNode }[] = [
  { value: "actor", label: "Actor/Actress", icon: <Film className="h-5 w-5" /> },
  { value: "model", label: "Model", icon: <Camera className="h-5 w-5" /> },
  { value: "singer", label: "Singer", icon: <Mic className="h-5 w-5" /> },
  { value: "dancer", label: "Dancer", icon: <Star className="h-5 w-5" /> },
  { value: "voice_artist", label: "Voice Artist", icon: <Mic className="h-5 w-5" /> },
  { value: "host", label: "Host/Presenter", icon: <Users className="h-5 w-5" /> },
  { value: "influencer", label: "Influencer", icon: <Star className="h-5 w-5" /> },
  { value: "extra", label: "Extra/Background", icon: <Users className="h-5 w-5" /> },
  { value: "other", label: "Other", icon: <Star className="h-5 w-5" /> },
];

const BENEFITS = [
  "Get discovered by casting directors",
  "Apply to exclusive casting calls",
  "Showcase your portfolio",
  "Connect with productions",
  "Build your professional profile",
  "Access industry opportunities",
];

export default function TalentSignup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TalentCategory>("actor");

  useEffect(() => {
    checkExistingProfile();
  }, [user]);

  const checkExistingProfile = async () => {
    if (!user) {
      setChecking(false);
      return;
    }

    const { data } = await supabase
      .from('talents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (data) {
      navigate('/talent/edit');
    }
    setChecking(false);
  };

  const handleSignup = async () => {
    if (!user) {
      toast.error("Please log in first");
      navigate('/login');
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('talents')
        .insert({
          user_id: user.id,
          name: name.trim(),
          category,
        });

      if (error) throw error;

      toast.success("Welcome! Let's complete your profile");
      navigate('/talent/edit');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CastingSubNav />
      
      {/* Spacer for fixed navbars */}
      <div className="pt-32" />
      
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left - Benefits */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Join Our Talent Network
                </h1>
                <p className="text-xl text-muted-foreground">
                  Create your profile and get discovered by top casting directors and productions.
                </p>
              </div>

              <div className="space-y-4">
                {BENEFITS.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-8">
                {CATEGORIES.slice(0, 6).map((cat) => (
                  <div key={cat.value} className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2 text-primary">
                      {cat.icon}
                    </div>
                    <span className="text-sm text-muted-foreground">{cat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Form */}
            <div>
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle>Create Your Profile</CardTitle>
                  <CardDescription>
                    {user 
                      ? "Start with the basics, you can add more details later"
                      : "Please log in to create a talent profile"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!user ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        You need to be logged in to create a talent profile
                      </p>
                      <Link to="/login">
                        <Button size="lg">Log In to Continue</Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Your Full Name *</Label>
                        <Input 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className="text-lg py-6"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Primary Category *</Label>
                        <Select value={category} onValueChange={(v: TalentCategory) => setCategory(v)}>
                          <SelectTrigger className="text-lg py-6">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                <span className="flex items-center gap-2">
                                  {cat.icon}
                                  {cat.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        onClick={handleSignup} 
                        disabled={loading || !name.trim()}
                        className="w-full py-6 text-lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Creating Profile...
                          </>
                        ) : (
                          "Create My Profile"
                        )}
                      </Button>

                      <p className="text-sm text-muted-foreground text-center">
                        By creating a profile, you agree to our terms of service and privacy policy
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
