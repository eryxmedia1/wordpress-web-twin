import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface IndieChannel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  trailer_url: string | null;
  backdrop_url: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminIndieChannels = () => {
  const [channels, setChannels] = useState<IndieChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<IndieChannel | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [backdropUrl, setBackdropUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from("indie_channels")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching channels:", error);
      toast.error("Failed to load channels");
    } else {
      setChannels(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setLogoUrl("");
    setTrailerUrl("");
    setBackdropUrl("");
    setIsActive(true);
    setEditingChannel(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (channel: IndieChannel) => {
    setEditingChannel(channel);
    setName(channel.name);
    setSlug(channel.slug);
    setDescription(channel.description || "");
    setLogoUrl(channel.logo_url || "");
    setTrailerUrl(channel.trailer_url || "");
    setBackdropUrl(channel.backdrop_url || "");
    setIsActive(channel.is_active);
    setIsDialogOpen(true);
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!editingChannel) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    const channelData = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      logo_url: logoUrl.trim() || null,
      trailer_url: trailerUrl.trim() || null,
      backdrop_url: backdropUrl.trim() || null,
      is_active: isActive,
    };

    if (editingChannel) {
      const { error } = await supabase
        .from("indie_channels")
        .update(channelData)
        .eq("id", editingChannel.id);

      if (error) {
        console.error("Error updating channel:", error);
        toast.error("Failed to update channel");
      } else {
        toast.success("Channel updated successfully");
        fetchChannels();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from("indie_channels").insert(channelData);

      if (error) {
        console.error("Error creating channel:", error);
        if (error.code === "23505") {
          toast.error("A channel with this slug already exists");
        } else {
          toast.error("Failed to create channel");
        }
      } else {
        toast.success("Channel created successfully");
        fetchChannels();
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (channel: IndieChannel) => {
    if (!confirm(`Are you sure you want to delete "${channel.name}"?`)) return;

    const { error } = await supabase
      .from("indie_channels")
      .delete()
      .eq("id", channel.id);

    if (error) {
      console.error("Error deleting channel:", error);
      toast.error("Failed to delete channel");
    } else {
      toast.success("Channel deleted");
      fetchChannels();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">Indie Channels</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Channel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingChannel ? "Edit Channel" : "Create New Channel"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Channel Name *</Label>
                  <Input
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="My Indie Channel"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Slug *</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-indie-channel"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL: /indie-channel/{slug || "..."}
                  </p>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your channel..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Logo URL</Label>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Backdrop Image URL</Label>
                  <Input
                    value={backdropUrl}
                    onChange={(e) => setBackdropUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Trailer URL</Label>
                  <Input
                    value={trailerUrl}
                    onChange={(e) => setTrailerUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingChannel ? "Update Channel" : "Create Channel"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : channels.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No indie channels yet. Create your first one!
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {channel.logo_url ? (
                            <img
                              src={channel.logo_url}
                              alt={channel.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <span className="text-lg font-bold text-primary">
                                {channel.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="font-medium">{channel.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {channel.slug}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          channel.is_active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {channel.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(channel.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link to={`/indie-channel/${channel.slug}`} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(channel)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(channel)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminIndieChannels;
