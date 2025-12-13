import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MessageSquare, Send, Plus, Building2 } from "lucide-react";
import { format } from "date-fns";
import type { Conversation, DepartmentMessage, Department } from "@/types/casting";

interface TalentDashboardMessagesProps {
  userId: string;
  talentId: string;
}

export function TalentDashboardMessages({ userId, talentId }: TalentDashboardMessagesProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DepartmentMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newDepartmentId, setNewDepartmentId] = useState("");
  const [newShowId, setNewShowId] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchDepartments();
    fetchShows();
  }, [userId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      subscribeToMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select("*, departments(name), casting_shows(title)")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false });

    setConversations((data as any[]) || []);
    setLoading(false);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase
      .from("departments")
      .select("*")
      .order("sort_order");
    setDepartments(data || []);
  };

  const fetchShows = async () => {
    const { data } = await supabase
      .from("casting_shows")
      .select("id, title")
      .eq("status", "casting");
    setShows(data || []);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from("department_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at");

    setMessages((data as any[]) || []);
  };

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'department_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as DepartmentMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    const { error } = await supabase.from("department_messages").insert({
      conversation_id: selectedConversation.id,
      sender_id: userId,
      sender_type: "talent",
      department_id: selectedConversation.department_id,
      show_id: selectedConversation.show_id,
      content: newMessage
    });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
      // Update conversation last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConversation.id);
    }
    setSending(false);
  };

  const handleNewConversation = async () => {
    if (!newDepartmentId) {
      toast.error("Please select a department");
      return;
    }

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        talent_id: talentId,
        department_id: newDepartmentId,
        show_id: newShowId || null,
        subject: newSubject || null
      })
      .select("*, departments(name), casting_shows(title)")
      .single();

    if (error) {
      toast.error("Failed to create conversation");
    } else {
      setConversations(prev => [data as any, ...prev]);
      setSelectedConversation(data as any);
      setShowNewDialog(false);
      setNewDepartmentId("");
      setNewShowId("");
      setNewSubject("");
    }
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6 h-[600px]">
        <Skeleton className="h-full" />
        <Skeleton className="h-full md:col-span-2" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Conversations</CardTitle>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Department *</label>
                  <Select value={newDepartmentId} onValueChange={setNewDepartmentId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Related Show (optional)</label>
                  <Select value={newShowId} onValueChange={setNewShowId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select show" />
                    </SelectTrigger>
                    <SelectContent>
                      {shows.map(show => (
                        <SelectItem key={show.id} value={show.id}>{show.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Subject (optional)</label>
                  <Input
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Message subject"
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleNewConversation} className="w-full">
                  Start Conversation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0 overflow-y-auto max-h-[520px]">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-3 text-left hover:bg-muted transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{conv.departments?.name}</span>
                  </div>
                  {conv.subject && (
                    <p className="text-sm truncate">{conv.subject}</p>
                  )}
                  {conv.casting_shows && (
                    <p className="text-xs text-muted-foreground">Re: {conv.casting_shows.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(conv.last_message_at), "MMM d, h:mm a")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="md:col-span-2 flex flex-col overflow-hidden">
        {selectedConversation ? (
          <>
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">{selectedConversation.departments?.name}</CardTitle>
                  {selectedConversation.subject && (
                    <p className="text-sm text-muted-foreground">{selectedConversation.subject}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.sender_id === userId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {format(new Date(msg.created_at), "h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="min-h-[40px] max-h-[100px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-2" />
              <p>Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
