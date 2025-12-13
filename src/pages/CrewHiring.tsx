import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { CastingSubNav } from "@/components/casting/CastingSubNav";
import BrowseFooter from "@/components/BrowseFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, MapPin, Calendar, DollarSign, Clock, Clapperboard, Briefcase, Building2, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { Department, CrewPosition } from "@/types/casting";

export default function CrewHiring() {
  const [departments, setDepartments] = useState<(Department & { position_count: number })[]>([]);
  const [positions, setPositions] = useState<CrewPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [deptRes, positionsRes] = await Promise.all([
      supabase.from("departments").select("*").order("sort_order"),
      supabase
        .from("crew_positions")
        .select("*, departments(name, slug), casting_shows(title, slug)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(12)
    ]);

    // Count positions per department
    const deptWithCounts = (deptRes.data || []).map(dept => ({
      ...dept,
      position_count: (positionsRes.data || []).filter(p => p.department_id === dept.id).length
    }));

    setDepartments(deptWithCounts);
    setPositions(positionsRes.data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <Navbar />
      <CastingSubNav />
      
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary/20 via-background to-background py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Crew Hiring
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Join our production teams. We're looking for skilled crew members across various departments.
          </p>
          
          <Link to="/talent/signup?type=crew" className="inline-block mt-6">
            <Button size="lg">
              <Briefcase className="h-5 w-5 mr-2" />
              Create Crew Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Departments Grid */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                Departments
              </h2>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {departments.map((dept) => (
                  <Link key={dept.id} to={`/casting/departments/${dept.slug}`}>
                    <Card className="bg-card/50 border-border/50 hover:border-primary/50 hover:bg-card transition-all h-full">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{dept.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {dept.position_count} open {dept.position_count === 1 ? 'position' : 'positions'}
                            </p>
                          </div>
                          {dept.is_hiring && (
                            <Badge className="bg-green-500/20 text-green-400 text-xs">Hiring</Badge>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground mt-2" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            {/* Open Positions */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Clapperboard className="h-6 w-6 text-primary" />
                Open Crew Positions
              </h2>
              
              {positions.length === 0 ? (
                <div className="text-center py-16 bg-card/30 rounded-xl">
                  <Clapperboard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-xl text-muted-foreground">No crew positions available right now</p>
                  <p className="text-muted-foreground mt-2">Check back soon for new opportunities</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {positions.map((position) => (
                    <CrewPositionCard key={position.id} position={position} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <BrowseFooter />
    </div>
  );
}

interface CrewPositionCardProps {
  position: CrewPosition;
}

function CrewPositionCard({ position }: CrewPositionCardProps) {
  const isExpired = position.deadline && new Date(position.deadline) < new Date();

  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-primary border-primary/30">
                {position.departments?.name || "Crew"}
              </Badge>
              {position.is_remote && (
                <Badge className="bg-green-500/20 text-green-400">Remote</Badge>
              )}
            </div>
            <CardTitle className="text-xl">{position.title}</CardTitle>
            {position.casting_shows && (
              <CardDescription className="text-primary mt-1">
                {position.casting_shows.title}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {position.description && (
          <p className="text-muted-foreground text-sm line-clamp-3">{position.description}</p>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          {position.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              {position.location}
            </div>
          )}
          {position.pay_amount && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 text-primary" />
              {position.pay_amount} {position.rate_type && `(${position.rate_type})`}
            </div>
          )}
          {position.schedule_expectations && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              {position.schedule_expectations}
            </div>
          )}
          {position.deadline && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              {isExpired ? 'Expired' : `Due: ${format(new Date(position.deadline), 'MMM d, yyyy')}`}
            </div>
          )}
        </div>

        <div className="pt-2">
          {isExpired ? (
            <Button variant="outline" disabled className="w-full">
              Deadline Passed
            </Button>
          ) : (
            <Link to={`/casting/crew/${position.id}`} className="block">
              <Button className="w-full">
                View Details & Apply
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
