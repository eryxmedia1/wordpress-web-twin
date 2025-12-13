import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Bell, CheckCheck, ExternalLink, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { UserNotification } from "@/types/casting";

interface TalentDashboardNotificationsProps {
  userId: string;
  onUpdate: () => void;
}

const NOTIFICATION_ICONS: Record<string, string> = {
  application_update: "📋",
  hired: "🎉",
  task_assigned: "✅",
  event_added: "📅",
  message_received: "💬",
  shortlisted: "⭐",
  audition_requested: "🎬",
  default: "🔔"
};

export function TalentDashboardNotifications({ userId, onUpdate }: TalentDashboardNotificationsProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    subscribeToNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    setNotifications((data as any[]) || []);
    setLoading(false);
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as UserNotification, ...prev]);
          toast(payload.new.title, {
            description: payload.new.message
          });
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleMarkRead = async (id: string) => {
    await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("id", id);
    
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    onUpdate();
  };

  const handleMarkAllRead = async () => {
    await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    onUpdate();
    toast.success("All notifications marked as read");
  };

  const handleClick = (notification: UserNotification) => {
    if (!notification.is_read) {
      handleMarkRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-2" />
            <p>No notifications yet</p>
            <p className="text-sm">You'll receive updates about your applications and bookings here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-colors hover:border-primary/50 ${
                !notification.is_read ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => handleClick(notification)}
            >
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={`font-medium ${!notification.is_read ? 'text-primary' : ''}`}>
                          {notification.title}
                        </h4>
                        {notification.message && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                      </div>
                      {notification.link && (
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notification.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
