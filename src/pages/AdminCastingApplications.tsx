import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminNavbar from '@/components/AdminNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Search, User, Star, Eye, Mail, Phone, MapPin, 
  ExternalLink, FileText, Clock, CheckCircle2, XCircle 
} from 'lucide-react';
import { format } from 'date-fns';

interface Application {
  id: string;
  show_id: string | null;
  role_ids: string[];
  talent_id: string;
  profile_snapshot: any;
  status: string;
  applied_at: string;
  admin_notes: string | null;
  admin_rating: number | null;
  talent?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    primary_photo_url: string | null;
    video_reel_url: string | null;
    applicant_type: string;
  };
  show?: {
    title: string;
  };
  roles?: {
    id: string;
    title: string;
  }[];
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-blue-500' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-amber-500' },
  { value: 'shortlist', label: 'Shortlisted', color: 'bg-purple-500' },
  { value: 'audition', label: 'Audition', color: 'bg-cyan-500' },
  { value: 'booked', label: 'Booked', color: 'bg-green-500' },
  { value: 'not_selected', label: 'Not Selected', color: 'bg-gray-500' },
];

export default function AdminCastingApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [shows, setShows] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilter, setShowFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch shows
      const { data: showsData } = await supabase
        .from('casting_shows')
        .select('id, title')
        .order('title');
      setShows(showsData || []);

      // Fetch applications
      const { data: appsData, error } = await supabase
        .from('casting_applications')
        .select('*')
        .order('applied_at', { ascending: false });

      if (error) throw error;

      // Enrich with talent, show, and role data
      const enriched = await Promise.all(
        (appsData || []).map(async (app) => {
          let talent = null;
          let show = null;
          let roles: { id: string; title: string }[] = [];

          // Fetch talent
          const { data: talentData } = await supabase
            .from('talents')
            .select('id, name, email, phone, city, state, country, primary_photo_url, video_reel_url, applicant_type')
            .eq('id', app.talent_id)
            .maybeSingle();
          talent = talentData;

          // Fetch show
          if (app.show_id) {
            const { data: showData } = await supabase
              .from('casting_shows')
              .select('title')
              .eq('id', app.show_id)
              .maybeSingle();
            show = showData;
          }

          // Fetch roles
          if (app.role_ids && app.role_ids.length > 0) {
            const { data: rolesData } = await supabase
              .from('casting_roles')
              .select('id, title')
              .in('id', app.role_ids);
            roles = rolesData || [];
          }

          return { ...app, talent, show, roles };
        })
      );

      setApplications(enriched);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('casting_applications')
        .update({ status: newStatus })
        .eq('id', appId);

      if (error) throw error;

      setApplications(prev => 
        prev.map(a => a.id === appId ? { ...a, status: newStatus } : a)
      );
      toast.success('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const updateNotes = async (appId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('casting_applications')
        .update({ admin_notes: notes })
        .eq('id', appId);

      if (error) throw error;

      setApplications(prev => 
        prev.map(a => a.id === appId ? { ...a, admin_notes: notes } : a)
      );
      if (selectedApp?.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, admin_notes: notes } : null);
      }
      toast.success('Notes saved');
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const updateRating = async (appId: string, rating: number) => {
    try {
      const { error } = await supabase
        .from('casting_applications')
        .update({ admin_rating: rating })
        .eq('id', appId);

      if (error) throw error;

      setApplications(prev => 
        prev.map(a => a.id === appId ? { ...a, admin_rating: rating } : a)
      );
      if (selectedApp?.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, admin_rating: rating } : null);
      }
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.talent?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.talent?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesShow = showFilter === 'all' || app.show_id === showFilter;

    return matchesSearch && matchesStatus && matchesShow;
  });

  const getStatusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    return <Badge className={opt?.color || 'bg-gray-500'}>{opt?.label || status}</Badge>;
  };

  const openDetail = (app: Application) => {
    setSelectedApp(app);
    setDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-6 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Applications</h1>
            <p className="text-muted-foreground">
              {applications.length} total applications
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={showFilter} onValueChange={setShowFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by show" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shows</SelectItem>
              {shows.map(show => (
                <SelectItem key={show.id} value={show.id}>{show.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          {STATUS_OPTIONS.map(opt => {
            const count = applications.filter(a => a.status === opt.value).length;
            return (
              <Card key={opt.value} className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setStatusFilter(opt.value === statusFilter ? 'all' : opt.value)}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{opt.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredApps.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No applications found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApps.map(app => (
              <Card key={app.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {app.talent?.primary_photo_url ? (
                        <img 
                          src={app.talent.primary_photo_url} 
                          alt={app.talent.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{app.talent?.name || 'Unknown'}</h4>
                        <Badge variant="outline">
                          {app.talent?.applicant_type || 'talent'}
                        </Badge>
                        {app.admin_rating && (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star 
                                key={i} 
                                className={`w-3 h-3 ${i <= app.admin_rating! ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        {app.talent?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {app.talent.email}
                          </span>
                        )}
                        {app.talent?.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {app.talent.city}, {app.talent.state}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Applied for:</span>
                        <span className="font-medium">{app.show?.title || 'Unknown Show'}</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{app.roles?.map(r => r.title).join(', ') || 'No roles'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <Select 
                        value={app.status} 
                        onValueChange={(v) => updateStatus(app.id, v)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(app.applied_at), 'MMM d, yyyy')}
                      </p>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => openDetail(app)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>

            {selectedApp && (
              <div className="space-y-6">
                {/* Talent Info */}
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted">
                    {selectedApp.talent?.primary_photo_url ? (
                      <img 
                        src={selectedApp.talent.primary_photo_url} 
                        alt={selectedApp.talent.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{selectedApp.talent?.name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {selectedApp.talent?.email && (
                        <a href={`mailto:${selectedApp.talent.email}`} className="flex items-center gap-1 hover:text-primary">
                          <Mail className="w-4 h-4" />
                          {selectedApp.talent.email}
                        </a>
                      )}
                      {selectedApp.talent?.phone && (
                        <a href={`tel:${selectedApp.talent.phone}`} className="flex items-center gap-1 hover:text-primary">
                          <Phone className="w-4 h-4" />
                          {selectedApp.talent.phone}
                        </a>
                      )}
                    </div>
                    {selectedApp.talent?.video_reel_url && (
                      <Button variant="outline" size="sm" className="mt-2" asChild>
                        <a href={selectedApp.talent.video_reel_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Reel
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Rating</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <button 
                          key={i}
                          onClick={() => updateRating(selectedApp.id, i)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star 
                            className={`w-5 h-5 ${i <= (selectedApp.admin_rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Application Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Application</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Show:</span>
                      <span className="font-medium">{selectedApp.show?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Roles:</span>
                      <span>{selectedApp.roles?.map(r => r.title).join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Applied:</span>
                      <span>{format(new Date(selectedApp.applied_at), 'MMMM d, yyyy h:mm a')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      <Select 
                        value={selectedApp.status} 
                        onValueChange={(v) => {
                          updateStatus(selectedApp.id, v);
                          setSelectedApp(prev => prev ? { ...prev, status: v } : null);
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Admin Notes */}
                <div>
                  <Label>Internal Notes</Label>
                  <Textarea
                    value={selectedApp.admin_notes || ''}
                    onChange={(e) => setSelectedApp(prev => 
                      prev ? { ...prev, admin_notes: e.target.value } : null
                    )}
                    onBlur={(e) => updateNotes(selectedApp.id, e.target.value)}
                    placeholder="Add private notes about this applicant..."
                    rows={4}
                  />
                </div>

                {/* Profile Snapshot */}
                {selectedApp.profile_snapshot && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Profile at Time of Application</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-[200px]">
                        {JSON.stringify(selectedApp.profile_snapshot, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
