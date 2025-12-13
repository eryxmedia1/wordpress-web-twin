import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Calendar, MapPin, ExternalLink } from "lucide-react";
import type { UserBooking } from "@/types/casting";

interface TalentDashboardBookingsProps {
  userId: string;
}

export function TalentDashboardBookings({ userId }: TalentDashboardBookingsProps) {
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [userId]);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("user_bookings")
      .select("*, casting_shows(title, poster_url), casting_roles(title), crew_positions(title)")
      .eq("user_id", userId)
      .order("hired_at", { ascending: false });

    setBookings((data as any[]) || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => <Skeleton key={i} className="h-40" />)}
      </div>
    );
  }

  const activeBookings = bookings.filter(b => b.status === 'active');
  const pastBookings = bookings.filter(b => b.status !== 'active');

  return (
    <div className="space-y-6">
      {/* Active Bookings */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Active Bookings ({activeBookings.length})</h3>
        
        {activeBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-2" />
              <p>No active bookings</p>
              <p className="text-sm">You'll see shows you're hired for here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {activeBookings.map(booking => (
              <Card key={booking.id} className="overflow-hidden">
                <div className="flex">
                  {booking.casting_shows?.poster_url && (
                    <img
                      src={booking.casting_shows.poster_url}
                      alt={booking.casting_shows?.title}
                      className="w-24 h-32 object-cover"
                    />
                  )}
                  <CardContent className="flex-1 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{booking.casting_shows?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {booking.booking_type === 'talent' 
                            ? booking.casting_roles?.title 
                            : booking.crew_positions?.title}
                        </p>
                      </div>
                      <Badge variant={booking.booking_type === 'talent' ? 'default' : 'secondary'}>
                        {booking.booking_type === 'talent' ? 'Talent' : 'Crew'}
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Hired {new Date(booking.hired_at).toLocaleDateString()}
                    </div>

                    <Button variant="link" className="p-0 h-auto mt-2" asChild>
                      <Link to={`/casting/shows/${booking.show_id}`}>
                        View Show Details <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Past Bookings ({pastBookings.length})</h3>
          <div className="space-y-3">
            {pastBookings.map(booking => (
              <Card key={booking.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{booking.casting_shows?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {booking.booking_type === 'talent' 
                          ? booking.casting_roles?.title 
                          : booking.crew_positions?.title}
                      </p>
                    </div>
                    <Badge variant="outline">{booking.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
