import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import BrowseFooter from '@/components/BrowseFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  MapPin, Calendar, DollarSign, Clock, Users, Clapperboard, 
  ChevronDown, ChevronUp, Play, ArrowLeft, CheckCircle2 
} from 'lucide-react';
import { format } from 'date-fns';
import ReactPlayer from 'react-player';

interface CastingShow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  logline: string | null;
  poster_url: string | null;
  trailer_url: string | null;
  filming_dates: string | null;
  filming_location: string | null;
  production_notes: string | null;
  pay_range_min: number | null;
  pay_range_max: number | null;
  status: string;
  deadline: string | null;
}

interface CastingRole {
  id: string;
  title: string;
  role_type: string;
  description: string | null;
  requirements: string | null;
  shoot_dates: string | null;
  time_commitment: string | null;
  location_notes: string | null;
  pay_type: string | null;
  pay_amount: string | null;
  payment_terms: string | null;
  terms_conditions: string | null;
  is_remote: boolean | null;
  deadline: string | null;
  status: string;
}

export default function CastingShowDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [show, setShow] = useState<CastingShow | null>(null);
  const [roles, setRoles] = useState<CastingRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [acceptedTerms, setAcceptedTerms] = useState<Set<string>>(new Set());
  const [talentProfile, setTalentProfile] = useState<{ id: string } | null>(null);
  const [existingApplications, setExistingApplications] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (slug) {
      fetchShowData();
    }
  }, [slug, user]);

  const fetchShowData = async () => {
    try {
      // Fetch show
      const { data: showData, error: showError } = await supabase
        .from('casting_shows')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (showError) throw showError;
      if (!showData) {
        navigate('/casting/shows');
        return;
      }

      setShow(showData);

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('casting_roles')
        .select('*')
        .eq('show_id', showData.id)
        .eq('status', 'open')
        .order('role_type')
        .order('sort_order');

      if (rolesError) throw rolesError;
      setRoles(rolesData || []);

      // Check if user has talent profile and existing applications
      if (user) {
        const { data: talentData } = await supabase
          .from('talents')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        setTalentProfile(talentData);

        if (talentData) {
          const { data: appsData } = await supabase
            .from('casting_applications')
            .select('role_ids')
            .eq('talent_id', talentData.id)
            .eq('show_id', showData.id);

          const appliedRoleIds = new Set<string>();
          appsData?.forEach(app => {
            (app.role_ids as string[] || []).forEach(id => appliedRoleIds.add(id));
          });
          setExistingApplications(appliedRoleIds);
        }
      }
    } catch (error) {
      console.error('Error fetching show:', error);
      toast.error('Failed to load show details');
    } finally {
      setLoading(false);
    }
  };

  const toggleRoleExpand = (roleId: string) => {
    setExpandedRoles(prev => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const toggleRoleSelect = (roleId: string) => {
    setSelectedRoles(prev => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
        setAcceptedTerms(t => { const n = new Set(t); n.delete(roleId); return n; });
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const toggleTermsAccept = (roleId: string) => {
    setAcceptedTerms(prev => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const canSubmit = selectedRoles.size > 0 && 
    Array.from(selectedRoles).every(id => acceptedTerms.has(id));

  const handleSubmitApplication = async () => {
    if (!user) {
      toast.error('Please sign in to apply');
      navigate('/login');
      return;
    }

    if (!talentProfile) {
      toast.error('Please create a talent profile first');
      navigate('/talent/edit');
      return;
    }

    if (!show) return;

    try {
      // Get talent profile snapshot
      const { data: profileData } = await supabase
        .from('talents')
        .select('*')
        .eq('id', talentProfile.id)
        .single();

      // Get selected role names for the notification
      const selectedRoleNames = roles
        .filter(r => selectedRoles.has(r.id))
        .map(r => r.title);

      // Use the existing casting_call_id field - we'll use show.id as reference
      const { data: appData, error } = await supabase
        .from('casting_applications')
        .insert({
          casting_call_id: show.id,
          show_id: show.id,
          role_ids: Array.from(selectedRoles),
          talent_id: talentProfile.id,
          profile_snapshot: profileData as any,
          status: 'new',
          pay_acceptance_timestamp: new Date().toISOString(),
          terms_acceptance_timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Send email notifications via edge function
      try {
        await supabase.functions.invoke('send-casting-notification', {
          body: {
            applicationId: appData.id,
            applicantName: profileData?.name || 'Applicant',
            applicantEmail: profileData?.email || user.email,
            showTitle: show.title,
            roleNames: selectedRoleNames,
            reelUrl: profileData?.video_reel_url,
            location: profileData?.city ? `${profileData.city}, ${profileData.state || ''}` : undefined,
          },
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Don't fail the whole application if email fails
      }

      toast.success('Application submitted successfully!');
      setSelectedRoles(new Set());
      setAcceptedTerms(new Set());
      fetchShowData(); // Refresh to update existing applications
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    }
  };

  const formatPayInfo = (role: CastingRole) => {
    if (!role.pay_type) return 'Compensation TBD';
    if (role.pay_type === 'unpaid') return 'Unpaid / Deferred';
    return `${role.pay_type.charAt(0).toUpperCase() + role.pay_type.slice(1)}: ${role.pay_amount || 'TBD'}`;
  };

  const talentRoles = roles.filter(r => r.role_type === 'talent');
  const crewRoles = roles.filter(r => r.role_type === 'crew');

  const RoleCard = ({ role }: { role: CastingRole }) => {
    const isExpanded = expandedRoles.has(role.id);
    const isSelected = selectedRoles.has(role.id);
    const hasAcceptedTerms = acceptedTerms.has(role.id);
    const alreadyApplied = existingApplications.has(role.id);

    return (
      <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''} ${alreadyApplied ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {!alreadyApplied && (
                <Checkbox 
                  checked={isSelected}
                  onCheckedChange={() => toggleRoleSelect(role.id)}
                  className="mt-1"
                />
              )}
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {role.title}
                  {alreadyApplied && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Applied
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {formatPayInfo(role)}
                  {role.is_remote && <Badge variant="outline" className="ml-2 text-xs">Remote OK</Badge>}
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => toggleRoleExpand(role.id)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Details
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0 space-y-4">
            {role.description && (
              <div>
                <h4 className="font-medium text-sm text-foreground mb-1">Role Description</h4>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </div>
            )}

            {role.requirements && (
              <div>
                <h4 className="font-medium text-sm text-foreground mb-1">Requirements</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{role.requirements}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {role.shoot_dates && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Dates: {role.shoot_dates}</span>
                </div>
              )}
              {role.time_commitment && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{role.time_commitment}</span>
                </div>
              )}
              {role.location_notes && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{role.location_notes}</span>
                </div>
              )}
              {role.deadline && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Deadline: {format(new Date(role.deadline), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>

            {role.payment_terms && (
              <div>
                <h4 className="font-medium text-sm text-foreground mb-1">Payment Terms</h4>
                <p className="text-sm text-muted-foreground">{role.payment_terms}</p>
              </div>
            )}

            {role.terms_conditions && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-sm text-foreground mb-2">Terms & Conditions</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line mb-3">{role.terms_conditions}</p>
                
                {isSelected && !alreadyApplied && (
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id={`terms-${role.id}`}
                      checked={hasAcceptedTerms}
                      onCheckedChange={() => toggleTermsAccept(role.id)}
                    />
                    <label htmlFor={`terms-${role.id}`} className="text-sm font-medium cursor-pointer">
                      I agree to the compensation and terms above
                    </label>
                  </div>
                )}
              </div>
            )}

            {isSelected && !role.terms_conditions && !alreadyApplied && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Checkbox 
                  id={`terms-${role.id}`}
                  checked={hasAcceptedTerms}
                  onCheckedChange={() => toggleTermsAccept(role.id)}
                />
                <label htmlFor={`terms-${role.id}`} className="text-sm font-medium cursor-pointer">
                  I agree to the compensation terms for this role
                </label>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!show) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Full-width Cinematic Hero Section - 120% width */}
      <div className="relative w-[120vw] h-[60vh] md:h-[70vh] lg:h-[80vh] -ml-[10vw] left-0">
        {show.trailer_url ? (
          <div className="absolute inset-0 w-full h-full">
            <ReactPlayer
              url={show.trailer_url}
              playing
              muted
              loop
              width="100%"
              height="100%"
              style={{ position: 'absolute', top: 0, left: 0 }}
              config={{
                file: {
                  attributes: {
                    style: { objectFit: 'cover', width: '100%', height: '100%' }
                  }
                }
              }}
            />
          </div>
        ) : show.poster_url ? (
          <img 
            src={show.poster_url} 
            alt={show.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background" />
        )}
        
        {/* Gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        
        {/* Content overlay positioned at bottom-left */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
          <div className="max-w-7xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/casting/shows')}
              className="mb-4 text-foreground/80 hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shows
            </Button>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3 md:mb-4 drop-shadow-lg">
              {show.title}
            </h1>
            {show.logline && (
              <p className="text-base sm:text-lg md:text-xl text-foreground/90 max-w-3xl line-clamp-3 md:line-clamp-none drop-shadow-md">
                {show.logline}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {show.description && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">About the Show</h2>
                  <p className="text-muted-foreground whitespace-pre-line">{show.description}</p>
                </div>
              )}

              {show.production_notes && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Production Notes</h3>
                  <p className="text-muted-foreground">{show.production_notes}</p>
                </div>
              )}

              {/* Roles */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Open Roles</h2>
                
                <Tabs defaultValue="talent" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="talent" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Talent ({talentRoles.length})
                    </TabsTrigger>
                    <TabsTrigger value="crew" className="flex items-center gap-2">
                      <Clapperboard className="w-4 h-4" />
                      Crew ({crewRoles.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="talent" className="space-y-4">
                    {talentRoles.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No talent roles currently open.</p>
                    ) : (
                      talentRoles.map(role => <RoleCard key={role.id} role={role} />)
                    )}
                  </TabsContent>

                  <TabsContent value="crew" className="space-y-4">
                    {crewRoles.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No crew roles currently open.</p>
                    ) : (
                      crewRoles.map(role => <RoleCard key={role.id} role={role} />)
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Show Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {show.filming_location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{show.filming_location}</p>
                      </div>
                    </div>
                  )}
                  {show.filming_dates && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Filming Dates</p>
                        <p className="font-medium">{show.filming_dates}</p>
                      </div>
                    </div>
                  )}
                  {(show.pay_range_min || show.pay_range_max) && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Pay Range</p>
                        <p className="font-medium">
                          ${show.pay_range_min?.toLocaleString() || '0'} - ${show.pay_range_max?.toLocaleString() || 'TBD'}
                        </p>
                      </div>
                    </div>
                  )}
                  {show.deadline && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Application Deadline</p>
                        <p className="font-medium">{format(new Date(show.deadline), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Application Summary */}
              {selectedRoles.size > 0 && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle>Your Application</CardTitle>
                    <CardDescription>
                      {selectedRoles.size} role{selectedRoles.size !== 1 ? 's' : ''} selected
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {Array.from(selectedRoles).map(roleId => {
                        const role = roles.find(r => r.id === roleId);
                        return role ? (
                          <div key={roleId} className="flex items-center justify-between text-sm">
                            <span>{role.title}</span>
                            {acceptedTerms.has(roleId) ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <span className="text-xs text-amber-500">Accept terms</span>
                            )}
                          </div>
                        ) : null;
                      })}
                    </div>

                    <Button 
                      className="w-full" 
                      disabled={!canSubmit}
                      onClick={handleSubmitApplication}
                    >
                      Submit Application
                    </Button>

                    {!canSubmit && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Accept terms for all selected roles to submit
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {!user && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground mb-4">
                      Sign in to apply for roles
                    </p>
                    <Button className="w-full" onClick={() => navigate('/login')}>
                      Sign In
                    </Button>
                  </CardContent>
                </Card>
              )}

              {user && !talentProfile && (
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <p className="text-center text-muted-foreground mb-2">
                      Create a profile to apply
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={() => navigate('/talent/signup?type=talent')}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Apply as Talent
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full" 
                      onClick={() => navigate('/talent/signup?type=crew')}
                    >
                      <Clapperboard className="w-4 h-4 mr-2" />
                      Apply as Crew
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

      <BrowseFooter />
    </div>
  );
}
