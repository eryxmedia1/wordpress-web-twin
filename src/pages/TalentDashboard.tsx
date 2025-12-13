import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import BrowseFooter from '@/components/BrowseFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  User, Edit, FileText, Clock, CheckCircle2, XCircle, 
  Star, Calendar, Briefcase, AlertCircle 
} from 'lucide-react';
import { format } from 'date-fns';

interface TalentProfile {
  id: string;
  name: string;
  applicant_type: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  primary_photo_url: string | null;
  video_reel_url: string | null;
  profile_completeness: number;
  is_approved: boolean;
  created_at: string;
}

interface Application {
  id: string;
  show_id: string;
  role_ids: string[];
  status: string;
  applied_at: string;
  admin_notes: string | null;
  show?: {
    title: string;
    poster_url: string | null;
  };
  roles?: {
    id: string;
    title: string;
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'Submitted', color: 'bg-blue-500', icon: <Clock className="w-3 h-3" /> },
  pending: { label: 'Pending', color: 'bg-blue-500', icon: <Clock className="w-3 h-3" /> },
  reviewed: { label: 'Under Review', color: 'bg-amber-500', icon: <FileText className="w-3 h-3" /> },
  shortlist: { label: 'Shortlisted', color: 'bg-purple-500', icon: <Star className="w-3 h-3" /> },
  audition: { label: 'Audition Scheduled', color: 'bg-cyan-500', icon: <Calendar className="w-3 h-3" /> },
  booked: { label: 'Booked!', color: 'bg-green-500', icon: <CheckCircle2 className="w-3 h-3" /> },
  not_selected: { label: 'Not Selected', color: 'bg-gray-500', icon: <XCircle className="w-3 h-3" /> },
  rejected: { label: 'Not Selected', color: 'bg-gray-500', icon: <XCircle className="w-3 h-3" /> },
};

export default function TalentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch talent profile
      const { data: talentData, error: talentError } = await supabase
        .from('talents')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (talentError) throw talentError;

      if (!talentData) {
        navigate('/talent/edit');
        return;
      }

      // Calculate profile completeness
      const completeness = calculateCompleteness(talentData);
      setProfile({ ...talentData, profile_completeness: completeness });

      // Fetch applications with show info
      const { data: appsData, error: appsError } = await supabase
        .from('casting_applications')
        .select('*')
        .eq('talent_id', talentData.id)
        .order('applied_at', { ascending: false });

      if (appsError) throw appsError;

      // Fetch show details for each application
      const appsWithShows = await Promise.all(
        (appsData || []).map(async (app) => {
          let show = null;
          let roles: { id: string; title: string }[] = [];

          if (app.show_id) {
            const { data: showData } = await supabase
              .from('casting_shows')
              .select('title, poster_url')
              .eq('id', app.show_id)
              .maybeSingle();
            show = showData;

            // Fetch role titles
            if (app.role_ids && app.role_ids.length > 0) {
              const { data: rolesData } = await supabase
                .from('casting_roles')
                .select('id, title')
                .in('id', app.role_ids);
              roles = rolesData || [];
            }
          }

          return { ...app, show, roles };
        })
      );

      setApplications(appsWithShows);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const calculateCompleteness = (data: any): number => {
    const fields = [
      'name', 'email', 'phone', 'bio', 'city', 'country',
      'primary_photo_url', 'video_reel_url', 'height', 'age_range'
    ];
    const socialFields = ['instagram_url', 'tiktok_url', 'youtube_url', 'website_url'];
    
    let filled = 0;
    fields.forEach(f => { if (data[f]) filled++; });
    if (socialFields.some(f => data[f])) filled++;
    
    return Math.round((filled / (fields.length + 1)) * 100);
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

  if (!profile) return null;

  const pendingApps = applications.filter(a => ['new', 'pending', 'reviewed'].includes(a.status));
  const activeApps = applications.filter(a => ['shortlist', 'audition'].includes(a.status));
  const completedApps = applications.filter(a => ['booked', 'not_selected', 'rejected'].includes(a.status));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Talent Dashboard</h1>
            <p className="text-muted-foreground">Manage your profile and track applications</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/casting/shows')}>
              <Briefcase className="w-4 h-4 mr-2" />
              Browse Castings
            </Button>
            <Button onClick={() => navigate('/talent/edit')}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-muted">
                {profile.primary_photo_url ? (
                  <img 
                    src={profile.primary_photo_url} 
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardTitle>{profile.name}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2">
                <Badge variant={profile.applicant_type === 'talent' ? 'default' : 'secondary'}>
                  {profile.applicant_type === 'talent' ? 'Talent' : 'Crew'}
                </Badge>
                {profile.is_approved ? (
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Approved
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-500 border-amber-500">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending Review
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Profile Completeness</span>
                    <span className="font-medium">{profile.profile_completeness}%</span>
                  </div>
                  <Progress value={profile.profile_completeness} className="h-2" />
                </div>

                {profile.profile_completeness < 80 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-500">Complete your profile</p>
                      <p className="text-muted-foreground">
                        Profiles over 80% complete get more visibility.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{applications.length}</p>
                    <p className="text-xs text-muted-foreground">Applications</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{activeApps.length}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">
                      {completedApps.filter(a => a.status === 'booked').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Booked</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>My Applications</CardTitle>
                <CardDescription>Track your casting submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pending">
                  <TabsList className="mb-4">
                    <TabsTrigger value="pending">
                      Pending ({pendingApps.length})
                    </TabsTrigger>
                    <TabsTrigger value="active">
                      Active ({activeApps.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                      Completed ({completedApps.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pending" className="space-y-4">
                    {pendingApps.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No pending applications
                      </p>
                    ) : (
                      pendingApps.map(app => <ApplicationCard key={app.id} app={app} />)
                    )}
                  </TabsContent>

                  <TabsContent value="active" className="space-y-4">
                    {activeApps.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No active applications
                      </p>
                    ) : (
                      activeApps.map(app => <ApplicationCard key={app.id} app={app} />)
                    )}
                  </TabsContent>

                  <TabsContent value="completed" className="space-y-4">
                    {completedApps.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No completed applications
                      </p>
                    ) : (
                      completedApps.map(app => <ApplicationCard key={app.id} app={app} />)
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BrowseFooter />
    </div>
  );
}

function ApplicationCard({ app }: { app: Application }) {
  const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.new;

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
      <div className="w-16 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
        {app.show?.poster_url ? (
          <img 
            src={app.show.poster_url} 
            alt={app.show.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">
          {app.show?.title || 'Unknown Show'}
        </h4>
        <p className="text-sm text-muted-foreground">
          {app.roles?.map(r => r.title).join(', ') || 'No roles'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Applied {format(new Date(app.applied_at), 'MMM d, yyyy')}
        </p>
      </div>

      <Badge className={`${status.color} text-white`}>
        {status.icon}
        <span className="ml-1">{status.label}</span>
      </Badge>
    </div>
  );
}
