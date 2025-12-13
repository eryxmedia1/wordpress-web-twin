import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, Film, Briefcase, FileText, Calendar, 
  MessageSquare, Settings, ArrowRight, TrendingUp 
} from "lucide-react";

export default function AdminCastingDashboard() {
  const [stats, setStats] = useState({
    totalTalent: 0,
    pendingTalent: 0,
    totalCrew: 0,
    activeShows: 0,
    openRoles: 0,
    openPositions: 0,
    newApplications: 0,
    pendingTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentApps, setRecentApps] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentApplications();
  }, []);

  const fetchStats = async () => {
    const [
      talentRes,
      pendingTalentRes,
      crewRes,
      showsRes,
      rolesRes,
      positionsRes,
      appsRes,
      tasksRes
    ] = await Promise.all([
      supabase.from("talents").select("id", { count: "exact" }).eq("applicant_type", "talent"),
      supabase.from("talents").select("id", { count: "exact" }).eq("is_approved", false),
      supabase.from("talents").select("id", { count: "exact" }).eq("applicant_type", "crew"),
      supabase.from("casting_shows").select("id", { count: "exact" }).eq("status", "casting"),
      supabase.from("casting_roles").select("id", { count: "exact" }).eq("status", "open"),
      supabase.from("crew_positions").select("id", { count: "exact" }).eq("status", "open"),
      supabase.from("casting_applications").select("id", { count: "exact" }).eq("status", "new"),
      supabase.from("user_tasks").select("id", { count: "exact" }).neq("status", "completed")
    ]);

    setStats({
      totalTalent: talentRes.count || 0,
      pendingTalent: pendingTalentRes.count || 0,
      totalCrew: crewRes.count || 0,
      activeShows: showsRes.count || 0,
      openRoles: rolesRes.count || 0,
      openPositions: positionsRes.count || 0,
      newApplications: appsRes.count || 0,
      pendingTasks: tasksRes.count || 0
    });
    setLoading(false);
  };

  const fetchRecentApplications = async () => {
    const { data } = await supabase
      .from("casting_applications")
      .select("*, talents(name, primary_photo_url), casting_roles(title), casting_shows(title)")
      .order("applied_at", { ascending: false })
      .limit(5);
    setRecentApps(data || []);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
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
            <h1 className="text-3xl font-bold">Casting Command Center</h1>
            <p className="text-muted-foreground">Manage talent, crew, shows, and applications</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.totalTalent}</p>
                  <p className="text-sm text-muted-foreground">Total Talent</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
              {stats.pendingTalent > 0 && (
                <p className="text-xs text-yellow-500 mt-2">{stats.pendingTalent} pending approval</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.totalCrew}</p>
                  <p className="text-sm text-muted-foreground">Total Crew</p>
                </div>
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.activeShows}</p>
                  <p className="text-sm text-muted-foreground">Active Shows</p>
                </div>
                <Film className="h-8 w-8 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.openRoles} roles, {stats.openPositions} positions open
              </p>
            </CardContent>
          </Card>

          <Card className={stats.newApplications > 0 ? "border-primary" : ""}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.newApplications}</p>
                  <p className="text-sm text-muted-foreground">New Applications</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Casting Admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Casting Admin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/admin/casting-shows">
                <Button variant="outline" className="w-full justify-between">
                  Shows Being Cast <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/casting-roles">
                <Button variant="outline" className="w-full justify-between">
                  Talent Roles <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/casting-applications">
                <Button variant="outline" className="w-full justify-between">
                  Talent Applications <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/talents">
                <Button variant="outline" className="w-full justify-between">
                  Talent Roster <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Crew Admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Crew Hiring Admin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/admin/departments">
                <Button variant="outline" className="w-full justify-between">
                  Departments <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/crew-positions">
                <Button variant="outline" className="w-full justify-between">
                  Crew Positions <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/crew-applications">
                <Button variant="outline" className="w-full justify-between">
                  Crew Applications <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/crew-roster">
                <Button variant="outline" className="w-full justify-between">
                  Crew Roster <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Production Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Production Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/admin/department-staff">
                <Button variant="outline" className="w-full justify-between">
                  Department Staff <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/tasks-manager">
                <Button variant="outline" className="w-full justify-between">
                  Tasks Manager <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/production-calendar">
                <Button variant="outline" className="w-full justify-between">
                  Production Calendar <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/email-settings">
                <Button variant="outline" className="w-full justify-between">
                  Email Settings <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Applications</CardTitle>
            <Link to="/admin/casting-applications">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentApps.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent applications</p>
            ) : (
              <div className="space-y-3">
                {recentApps.map(app => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {app.talents?.primary_photo_url ? (
                        <img
                          src={app.talents.primary_photo_url}
                          alt={app.talents.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          {app.talents?.name?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{app.talents?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {app.casting_roles?.title} • {app.casting_shows?.title}
                        </p>
                      </div>
                    </div>
                    <Link to={`/admin/casting-applications?id=${app.id}`}>
                      <Button size="sm">Review</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
