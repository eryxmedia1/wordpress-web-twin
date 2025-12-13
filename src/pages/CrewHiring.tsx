import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { CastingSubNav } from "@/components/casting/CastingSubNav";
import BrowseFooter from "@/components/BrowseFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, MapPin, Calendar, DollarSign, Clock, Clapperboard, Briefcase } from "lucide-react";
import { format } from "date-fns";

interface CrewRole {
  id: string;
  title: string;
  description: string | null;
  role_type: string;
  pay_type: string | null;
  pay_amount: string | null;
  deadline: string | null;
  requirements: string | null;
  location_notes: string | null;
  is_remote: boolean;
  shoot_dates: string | null;
  time_commitment: string | null;
  status: string;
  show: {
    id: string;
    title: string;
    slug: string;
    poster_url: string | null;
  } | null;
}

export default function CrewHiring() {
  const { user } = useAuth();
  const [crewRoles, setCrewRoles] = useState<CrewRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCrewRoles();
  }, []);

  const fetchCrewRoles = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('casting_roles')
      .select(`
        id,
        title,
        description,
        role_type,
        pay_type,
        pay_amount,
        deadline,
        requirements,
        location_notes,
        is_remote,
        shoot_dates,
        time_commitment,
        status,
        show:casting_shows!inner(id, title, slug, poster_url)
      `)
      .eq('role_type', 'crew')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (data) {
      setCrewRoles(data as unknown as CrewRole[]);
    }
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
            Crew Positions
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
        ) : crewRoles.length === 0 ? (
          <div className="text-center py-16">
            <Clapperboard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No crew positions available right now</p>
            <p className="text-muted-foreground mt-2">Check back soon for new opportunities</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Open Crew Positions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {crewRoles.map((role) => (
                <CrewRoleCard key={role.id} role={role} />
              ))}
            </div>
          </div>
        )}
      </div>

      <BrowseFooter />
    </div>
  );
}

interface CrewRoleCardProps {
  role: CrewRole;
}

function CrewRoleCard({ role }: CrewRoleCardProps) {
  const isExpired = role.deadline && new Date(role.deadline) < new Date();

  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-primary border-primary/30">
                Crew
              </Badge>
              {role.is_remote && (
                <Badge className="bg-green-500/20 text-green-400">Remote</Badge>
              )}
            </div>
            <CardTitle className="text-xl">{role.title}</CardTitle>
            {role.show && (
              <CardDescription className="text-primary mt-1">
                {role.show.title}
              </CardDescription>
            )}
          </div>
          {role.show?.poster_url && (
            <div className="w-16 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img src={role.show.poster_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {role.description && (
          <p className="text-muted-foreground text-sm line-clamp-3">{role.description}</p>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          {role.location_notes && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              {role.location_notes}
            </div>
          )}
          {role.pay_amount && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 text-primary" />
              {role.pay_amount} {role.pay_type && `(${role.pay_type})`}
            </div>
          )}
          {role.time_commitment && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              {role.time_commitment}
            </div>
          )}
          {role.deadline && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              {isExpired ? 'Expired' : `Due: ${format(new Date(role.deadline), 'MMM d, yyyy')}`}
            </div>
          )}
        </div>

        <div className="pt-2">
          {isExpired ? (
            <Button variant="outline" disabled className="w-full">
              Deadline Passed
            </Button>
          ) : role.show ? (
            <Link to={`/casting/shows/${role.show.slug}`} className="block">
              <Button className="w-full">
                View & Apply
              </Button>
            </Link>
          ) : (
            <Link to="/talent/signup?type=crew" className="block">
              <Button variant="outline" className="w-full">
                Create Crew Profile to Apply
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
