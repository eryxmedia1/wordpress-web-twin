import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search, ExternalLink, Star, User, Building2, Mail, Phone, MapPin, Briefcase, Wrench, Award, Link as LinkIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, ApplicationStatus } from "@/types/casting";
import type { CrewApplication } from "@/types/casting";

export default function AdminCrewApplications() {
  const [applications, setApplications] = useState<CrewApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<CrewApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [adminRating, setAdminRating] = useState<number>(0);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const { data } = await supabase
      .from("crew_applications")
      .select("*, crew_positions(title, departments(name)), talents(id, name, email, primary_photo_url, city, state), casting_shows(title)")
      .order("applied_at", { ascending: false });

    setApplications((data as any[]) || []);
    setLoading(false);
  };

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    const { error } = await supabase
      .from("crew_applications")
      .update({ status: newStatus })
      .eq("id", appId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Status updated to ${APPLICATION_STATUS_LABELS[newStatus]}`);
      
      // If hired, trigger automation
      if (newStatus === 'hired') {
        await triggerHiredAutomation(appId);
      }
      
      fetchApplications();
    }
  };

  const triggerHiredAutomation = async (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app || !app.talents) return;

    // Create booking
    await supabase.from("user_bookings").insert({
      user_id: app.profile_snapshot?.user_id,
      talent_id: app.talent_id,
      show_id: app.show_id,
      position_id: app.position_id,
      booking_type: "crew"
    });

    // Create onboarding tasks
    const onboardingTasks = [
      { title: "Complete profile to 100%", priority: "high" },
      { title: "Upload required documents", priority: "high" },
      { title: "Confirm availability for shoot dates", priority: "medium" },
      { title: "Sign release forms", priority: "high" },
      { title: "Confirm travel arrangements", priority: "medium" }
    ];

    for (const task of onboardingTasks) {
      await supabase.from("user_tasks").insert({
        user_id: app.profile_snapshot?.user_id,
        talent_id: app.talent_id,
        show_id: app.show_id,
        title: task.title,
        priority: task.priority,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      });
    }

    // Create onboarding calendar event
    await supabase.from("user_calendar_events").insert({
      user_id: app.profile_snapshot?.user_id,
      talent_id: app.talent_id,
      show_id: app.show_id,
      title: "Onboarding Session",
      event_type: "onboarding",
      start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      description: "Welcome to the team! Please complete your onboarding tasks."
    });

    // Create notification
    await supabase.from("user_notifications").insert({
      user_id: app.profile_snapshot?.user_id,
      type: "hired",
      title: "🎉 Congratulations! You've been hired!",
      message: `You've been hired for ${app.crew_positions?.title}. Check your tasks and calendar for next steps.`,
      link: "/talent/dashboard"
    });

    toast.success("Hired automation triggered - tasks, calendar, and notifications created");
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    
    const { error } = await supabase
      .from("crew_applications")
      .update({ admin_notes: adminNotes, admin_rating: adminRating || null })
      .eq("id", selectedApp.id);

    if (error) {
      toast.error("Failed to save notes");
    } else {
      toast.success("Notes saved");
      fetchApplications();
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesSearch = !searchQuery || 
      app.talents?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.crew_positions?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    const counts: Record<string, number> = { all: applications.length };
    applications.forEach(app => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Crew Applications</h1>
            <p className="text-muted-foreground">{applications.length} total applications</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
            {Object.keys(APPLICATION_STATUS_LABELS).map(status => (
              <TabsTrigger key={status} value={status}>
                {APPLICATION_STATUS_LABELS[status as ApplicationStatus]} ({statusCounts[status] || 0})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={filterStatus} className="mt-0">
            <div className="space-y-4">
              {filteredApps.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No applications found
                  </CardContent>
                </Card>
              ) : (
                filteredApps.map(app => (
                  <Card key={app.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        {app.talents?.primary_photo_url ? (
                          <img
                            src={app.talents.primary_photo_url}
                            alt={app.talents.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                            <User className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{app.talents?.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {app.talents?.city}, {app.talents?.state}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {app.admin_rating && (
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} className={`h-4 w-4 ${i <= app.admin_rating! ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                                  ))}
                                </div>
                              )}
                              <Badge className={APPLICATION_STATUS_COLORS[app.status]}>
                                {APPLICATION_STATUS_LABELS[app.status]}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm mb-3">
                            <span className="font-medium">{app.crew_positions?.title}</span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              {app.crew_positions?.departments?.name}
                            </span>
                            {app.crew_positions?.casting_shows && (
                              <span className="text-primary">{app.crew_positions.casting_shows.title}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Select
                              value={app.status}
                              onValueChange={(v) => handleStatusChange(app.id, v as ApplicationStatus)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedApp(app);
                                setAdminNotes(app.admin_notes || "");
                                setAdminRating(app.admin_rating || 0);
                              }}
                            >
                              Review
                            </Button>

                            <Link to={`/talent/${app.talent_id}`}>
                              <Button variant="outline" size="icon">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Review Dialog with Full Profile */}
        <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Review Application: {selectedApp?.talents?.name}</DialogTitle>
            </DialogHeader>
            {selectedApp && (
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-6">
                  {/* Position Applied For */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <Label className="text-xs text-muted-foreground">Position Applied For</Label>
                    <p className="font-semibold text-lg">{selectedApp.crew_positions?.title}</p>
                    <p className="text-sm text-muted-foreground">{selectedApp.crew_positions?.departments?.name}</p>
                  </div>

                  {/* Full Profile Snapshot */}
                  {selectedApp.profile_snapshot && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Applicant Profile
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Contact Info */}
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedApp.profile_snapshot.name || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedApp.profile_snapshot.email || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedApp.profile_snapshot.phone || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {[selectedApp.profile_snapshot.city, selectedApp.profile_snapshot.state, selectedApp.profile_snapshot.country]
                                    .filter(Boolean).join(', ') || 'N/A'}
                                </span>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Experience & Skills */}
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Experience & Skills</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span>Primary: {selectedApp.profile_snapshot.crew_primary_role || 'N/A'}</span>
                              </div>
                              {selectedApp.profile_snapshot.crew_secondary_roles?.length > 0 && (
                                <div className="flex items-start gap-2">
                                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <span>Secondary: {selectedApp.profile_snapshot.crew_secondary_roles.join(', ')}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedApp.profile_snapshot.crew_years_experience || 0} years experience</span>
                              </div>
                              {selectedApp.profile_snapshot.crew_software?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {selectedApp.profile_snapshot.crew_software.map((sw: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">{sw}</Badge>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>

                        {/* Gear & Certifications */}
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          {selectedApp.profile_snapshot.crew_gear_owned && (
                            <Card>
                              <CardHeader className="py-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Wrench className="h-4 w-4" />
                                  Gear/Equipment Owned
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground">{selectedApp.profile_snapshot.crew_gear_owned}</p>
                              </CardContent>
                            </Card>
                          )}
                          {selectedApp.profile_snapshot.crew_certifications && (
                            <Card>
                              <CardHeader className="py-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Award className="h-4 w-4" />
                                  Certifications
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground">{selectedApp.profile_snapshot.crew_certifications}</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>

                        {/* Links */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {selectedApp.profile_snapshot.portfolio_url && (
                            <a href={selectedApp.profile_snapshot.portfolio_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">
                                <LinkIcon className="h-3 w-3 mr-1" />
                                Portfolio
                              </Button>
                            </a>
                          )}
                          {selectedApp.profile_snapshot.resume_url && (
                            <a href={selectedApp.profile_snapshot.resume_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Resume
                              </Button>
                            </a>
                          )}
                          {selectedApp.profile_snapshot.imdb_url && (
                            <a href={selectedApp.profile_snapshot.imdb_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">IMDb</Button>
                            </a>
                          )}
                        </div>

                        {/* Bio */}
                        {selectedApp.profile_snapshot.bio && (
                          <Card className="mt-4">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Bio</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">{selectedApp.profile_snapshot.bio}</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Cover Letter */}
                  {selectedApp.cover_letter && (
                    <div>
                      <Label>Cover Letter / Message</Label>
                      <p className="text-sm mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap">{selectedApp.cover_letter}</p>
                    </div>
                  )}

                  {/* Rating */}
                  <div>
                    <Label>Your Rating</Label>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <button
                          key={i}
                          onClick={() => setAdminRating(i)}
                          className="p-1"
                        >
                          <Star className={`h-6 w-6 ${i <= adminRating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <Label>Admin Notes</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal notes about this applicant..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setSelectedApp(null)}>Cancel</Button>
                    <Button onClick={handleSaveNotes}>Save Notes</Button>
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
