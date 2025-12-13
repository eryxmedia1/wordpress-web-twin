import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, Clock, MapPin, Film } from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek, addDays, startOfDay } from "date-fns";
import type { UserCalendarEvent } from "@/types/casting";

interface TalentDashboardCalendarProps {
  userId: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  audition: "Audition",
  interview: "Interview",
  call_time: "Call Time",
  shoot_day: "Shoot Day",
  fitting: "Fitting",
  wardrobe: "Wardrobe",
  table_read: "Table Read",
  rehearsal: "Rehearsal",
  paperwork: "Paperwork Due",
  travel: "Travel",
  meeting: "Meeting",
  onboarding: "Onboarding",
  other: "Other"
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  audition: "bg-purple-500",
  interview: "bg-blue-500",
  call_time: "bg-green-500",
  shoot_day: "bg-green-600",
  fitting: "bg-pink-500",
  wardrobe: "bg-pink-400",
  table_read: "bg-yellow-500",
  rehearsal: "bg-orange-500",
  paperwork: "bg-red-500",
  travel: "bg-cyan-500",
  meeting: "bg-gray-500",
  onboarding: "bg-primary",
  other: "bg-gray-400"
};

export function TalentDashboardCalendar({ userId }: TalentDashboardCalendarProps) {
  const [events, setEvents] = useState<UserCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [userId]);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("user_calendar_events")
      .select("*, casting_shows(title), departments(name)")
      .eq("user_id", userId)
      .gte("start_time", new Date().toISOString())
      .order("start_time");

    setEvents((data as any[]) || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  // Group events by day
  const todayEvents = events.filter(e => isToday(new Date(e.start_time)));
  const tomorrowEvents = events.filter(e => isTomorrow(new Date(e.start_time)));
  const thisWeekEvents = events.filter(e => {
    const date = new Date(e.start_time);
    return isThisWeek(date) && !isToday(date) && !isTomorrow(date);
  });
  const upcomingEvents = events.filter(e => {
    const date = new Date(e.start_time);
    return !isThisWeek(date);
  });

  const EventCard = ({ event }: { event: UserCalendarEvent }) => (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <div className="text-center min-w-[50px]">
            <p className="text-sm text-muted-foreground">{format(new Date(event.start_time), "EEE")}</p>
            <p className="text-2xl font-bold">{format(new Date(event.start_time), "d")}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(event.start_time), "MMM")}</p>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={EVENT_TYPE_COLORS[event.event_type]}>
                {EVENT_TYPE_LABELS[event.event_type]}
              </Badge>
              {event.casting_shows && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Film className="h-3 w-3" />
                  {event.casting_shows.title}
                </span>
              )}
            </div>
            
            <h4 className="font-medium">{event.title}</h4>
            
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(event.start_time), "h:mm a")}
                {event.end_time && ` - ${format(new Date(event.end_time), "h:mm a")}`}
              </div>
              {event.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </div>
              )}
            </div>

            {event.description && (
              <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EventSection = ({ title, events }: { title: string; events: UserCalendarEvent[] }) => (
    events.length > 0 && (
      <div>
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <div className="space-y-3">
          {events.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      </div>
    )
  );

  return (
    <div className="space-y-8">
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-2" />
            <p>No upcoming events</p>
            <p className="text-sm">Events will appear here when you're booked for shows</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <EventSection title="Today" events={todayEvents} />
          <EventSection title="Tomorrow" events={tomorrowEvents} />
          <EventSection title="This Week" events={thisWeekEvents} />
          <EventSection title="Upcoming" events={upcomingEvents} />
        </>
      )}
    </div>
  );
}
