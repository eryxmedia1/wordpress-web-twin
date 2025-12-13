import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, CheckCircle, XCircle, Calendar } from "lucide-react";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from "@/types/casting";

interface TalentDashboardApplicationsProps {
  talentId: string;
  isCrew: boolean;
}

export function TalentDashboardApplications({ talentId, isCrew }: TalentDashboardApplicationsProps) {
  const [talentApps, setTalentApps] = useState<any[]>([]);
  const [crewApps, setCrewApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [talentId]);

  const fetchApplications = async () => {
    const [talentRes, crewRes] = await Promise.all([
      supabase
        .from("casting_applications")
        .select("*, casting_calls(title, project_name), casting_roles(title), casting_shows(title)")
        .eq("talent_id", talentId)
        .order("applied_at", { ascending: false }),
      supabase
        .from("crew_applications")
        .select("*, crew_positions(title, departments(name)), casting_shows(title)")
        .eq("talent_id", talentId)
        .order("applied_at", { ascending: false })
    ]);

    setTalentApps(talentRes.data || []);
    setCrewApps(crewRes.data || []);
    setLoading(false);
  };

  const ApplicationCard = ({ app, type }: { app: any; type: 'talent' | 'crew' }) => {
    const status = app.status as keyof typeof APPLICATION_STATUS_LABELS;
    const title = type === 'talent' 
      ? (app.casting_roles?.title || app.casting_calls?.title)
      : app.crew_positions?.title;
    const show = app.casting_shows?.title;
    const department = type === 'crew' ? app.crew_positions?.departments?.name : null;

    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-medium">{title}</h4>
              {show && <p className="text-sm text-muted-foreground">{show}</p>}
              {department && <p className="text-sm text-muted-foreground">{department} Dept</p>}
            </div>
            <Badge className={APPLICATION_STATUS_COLORS[status]}>
              {APPLICATION_STATUS_LABELS[status]}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Applied {new Date(app.applied_at).toLocaleDateString()}
            </div>
          </div>

          {status === 'hired' && (
            <div className="mt-3 p-2 bg-green-500/10 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-500">Congratulations! You've been hired.</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  const allApps = [...talentApps.map(a => ({ ...a, type: 'talent' })), ...crewApps.map(a => ({ ...a, type: 'crew' }))];
  const pendingApps = allApps.filter(a => !['hired', 'not_selected'].includes(a.status));
  const completedApps = allApps.filter(a => ['hired', 'not_selected'].includes(a.status));

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allApps.length}</p>
                <p className="text-sm text-muted-foreground">Total Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingApps.length}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allApps.filter(a => a.status === 'hired').length}</p>
                <p className="text-sm text-muted-foreground">Booked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({allApps.length})</TabsTrigger>
          <TabsTrigger value="pending">In Progress ({pendingApps.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedApps.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {allApps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2" />
                <p>No applications yet</p>
                <p className="text-sm">Browse casting calls and crew positions to apply</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {allApps.map(app => (
                <ApplicationCard key={app.id} app={app} type={app.type} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <div className="space-y-3">
            {pendingApps.map(app => (
              <ApplicationCard key={app.id} app={app} type={app.type} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <div className="space-y-3">
            {completedApps.map(app => (
              <ApplicationCard key={app.id} app={app} type={app.type} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
