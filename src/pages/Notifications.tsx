import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, Trash2, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Notification {
  id: string;
  profile_id: string;
  indie_channel_id: string;
  content_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  indie_channels?: {
    name: string;
    slug: string;
    logo_url: string | null;
  };
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { currentProfile } = useProfile();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    if (!currentProfile?.id) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('channel_notifications')
      .select(`
        *,
        indie_channels (name, slug, logo_url)
      `)
      .eq('profile_id', currentProfile.id)
      .order('created_at', { ascending: false });

    if (data) {
      setNotifications(data as Notification[]);
    }
    if (error) {
      console.error('Error fetching notifications:', error);
      toast.error("Failed to load notifications");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentProfile?.id]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await supabase
        .from('channel_notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
      
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    }

    // Navigate to content
    if (notification.content_id) {
      navigate(`/watch/${notification.content_id}`);
    } else if (notification.indie_channels?.slug) {
      navigate(`/indie-channel/${notification.indie_channels.slug}`);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('channel_notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const deleteNotification = async (id: string) => {
    await supabase
      .from('channel_notifications')
      .delete()
      .eq('id', id);
    
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("Notification deleted");
  };

  const markAllAsRead = async () => {
    if (!currentProfile?.id) return;

    await supabase
      .from('channel_notifications')
      .update({ is_read: true })
      .eq('profile_id', currentProfile.id)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success("All notifications marked as read");
  };

  const deleteAllRead = async () => {
    if (!currentProfile?.id) return;

    await supabase
      .from('channel_notifications')
      .delete()
      .eq('profile_id', currentProfile.id)
      .eq('is_read', true);

    setNotifications(prev => prev.filter(n => !n.is_read));
    toast.success("Read notifications deleted");
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ExpandingSidebar />
      
      <main className="pl-16 pt-20 pr-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                <p className="text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              {notifications.some(n => n.is_read) && (
                <Button variant="outline" size="sm" onClick={deleteAllRead}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear read
                </Button>
              )}
            </div>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={filter}>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                    </h3>
                    <p className="text-muted-foreground">
                      {filter === 'unread' 
                        ? "You're all caught up!"
                        : "Follow indie channels to get notified when they upload new content"
                      }
                    </p>
                    <Button asChild className="mt-4">
                      <Link to="/indie-channels">Browse Indie Channels</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                        !notification.is_read ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {notification.indie_channels?.logo_url ? (
                            <img
                              src={notification.indie_channels.logo_url}
                              alt={notification.indie_channels.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <Bell className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <p className={`text-foreground ${!notification.is_read ? 'font-medium' : ''}`}>
                              {notification.message}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markAsRead(notification.id)}
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteNotification(notification.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Notifications;