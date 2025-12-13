import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { CastingSubNav } from "@/components/casting/CastingSubNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, DollarSign, Clock, Briefcase, Mail, Users } from "lucide-react";
import type { Department, CrewPosition, DepartmentStaff } from "@/types/casting";

export default function DepartmentPage() {
  const { slug } = useParams<{ slug: string }>();
  const [department, setDepartment] = useState<Department | null>(null);
  const [positions, setPositions] = useState<CrewPosition[]>([]);
  const [staff, setStaff] = useState<DepartmentStaff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchDepartment();
    }
  }, [slug]);

  const fetchDepartment = async () => {
    const { data: dept } = await supabase
      .from("departments")
      .select("*")
      .eq("slug", slug)
      .single();

    if (dept) {
      setDepartment(dept);

      const [positionsRes, staffRes] = await Promise.all([
        supabase
          .from("crew_positions")
          .select("*, casting_shows(title, slug)")
          .eq("department_id", dept.id)
          .eq("status", "open")
          .order("sort_order"),
        supabase
          .from("department_staff")
          .select("*")
          .eq("department_id", dept.id)
          .eq("is_active", true)
      ]);

      setPositions(positionsRes.data || []);
      setStaff(staffRes.data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <CastingSubNav />
        <div className="container mx-auto px-4 py-8 pt-40">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <CastingSubNav />
        <div className="container mx-auto px-4 py-8 pt-40 text-center">
          <h1 className="text-2xl font-bold">Department not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CastingSubNav />
      
      <div className="container mx-auto px-4 py-8 pt-40">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{department.name}</h1>
            {department.is_hiring && (
              <Badge className="bg-green-500">Now Hiring</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-lg">{department.description}</p>
          {department.contact_email && (
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{department.contact_email}</span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Open Positions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Open Positions ({positions.length})
            </h2>

            {positions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No open positions in this department right now.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {positions.map(position => (
                  <Card key={position.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{position.title}</CardTitle>
                          {position.casting_shows && (
                            <p className="text-sm text-muted-foreground">
                              For: {position.casting_shows.title}
                            </p>
                          )}
                        </div>
                        <Badge variant={position.is_remote ? "secondary" : "outline"}>
                          {position.is_remote ? "Remote" : "On-site"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {position.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm mb-4">
                        {position.location && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {position.location}
                          </div>
                        )}
                        {position.pay_amount && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            {position.pay_amount} ({position.rate_type})
                          </div>
                        )}
                        {position.deadline && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            Apply by {new Date(position.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <Link to={`/casting/crew/${position.id}`}>
                        <Button>View Details & Apply</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Staff Directory */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Department Staff
            </h2>

            {staff.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No staff listed yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {staff.map(member => (
                  <Card key={member.id}>
                    <CardContent className="py-4">
                      <p className="font-medium">{member.name}</p>
                      {member.title && (
                        <p className="text-sm text-muted-foreground">{member.title}</p>
                      )}
                      {member.email && (
                        <p className="text-sm text-primary mt-1">{member.email}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Button variant="outline" className="w-full mt-4">
              <Mail className="h-4 w-4 mr-2" />
              Contact Department
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
