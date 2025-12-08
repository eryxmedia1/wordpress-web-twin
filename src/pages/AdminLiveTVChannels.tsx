import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Tv, Plus, Pencil, Trash2, ArrowLeft, Loader2, Radio, Upload, X } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  timezone: string;
  is_active: boolean;
  default_ad_interval_minutes: number;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London (GMT)' },
];

export default function AdminLiveTVChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo_url: '',
    description: '',
    timezone: 'America/New_York',
    is_active: true,
    default_ad_interval_minutes: 15,
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `channel-logos/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('channel-logos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) {
        // If bucket doesn't exist, show helpful message
        if (error.message.includes('bucket') || error.message.includes('Bucket')) {
          toast.error('Storage bucket not configured. Using URL input for now.');
          return;
        }
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('channel-logos').getPublicUrl(fileName);
      
      setFormData(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from('live_channels')
      .select('*')
      .order('name');

    if (!error && data) {
      setChannels(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      logo_url: '',
      description: '',
      timezone: 'America/New_York',
      is_active: true,
      default_ad_interval_minutes: 15,
    });
    setEditingChannel(null);
  };

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      slug: channel.slug,
      logo_url: channel.logo_url || '',
      description: channel.description || '',
      timezone: channel.timezone,
      is_active: channel.is_active,
      default_ad_interval_minutes: channel.default_ad_interval_minutes,
    });
    setIsDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: !editingChannel ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prev.slug,
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Name and slug are required');
      return;
    }

    setIsSaving(true);

    try {
      if (editingChannel) {
        const { error } = await supabase
          .from('live_channels')
          .update({
            name: formData.name,
            slug: formData.slug,
            logo_url: formData.logo_url || null,
            description: formData.description || null,
            timezone: formData.timezone,
            is_active: formData.is_active,
            default_ad_interval_minutes: formData.default_ad_interval_minutes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingChannel.id);

        if (error) throw error;
        toast.success('Channel updated successfully');
      } else {
        const { error } = await supabase
          .from('live_channels')
          .insert({
            name: formData.name,
            slug: formData.slug,
            logo_url: formData.logo_url || null,
            description: formData.description || null,
            timezone: formData.timezone,
            is_active: formData.is_active,
            default_ad_interval_minutes: formData.default_ad_interval_minutes,
          });

        if (error) throw error;
        toast.success('Channel created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchChannels();
    } catch (error: any) {
      console.error('Error saving channel:', error);
      toast.error(error.message || 'Failed to save channel');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (channel: Channel) => {
    if (!confirm(`Delete channel "${channel.name}"? This will also delete all playlists and scheduled content.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('live_channels')
        .delete()
        .eq('id', channel.id);

      if (error) throw error;
      toast.success('Channel deleted');
      fetchChannels();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete channel');
    }
  };

  const toggleActive = async (channel: Channel) => {
    try {
      const { error } = await supabase
        .from('live_channels')
        .update({ is_active: !channel.is_active })
        .eq('id', channel.id);

      if (error) throw error;
      fetchChannels();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update channel');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin/livetv">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Tv className="h-8 w-8 text-primary" />
              Channels Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage live TV channels
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Channel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {editingChannel ? 'Edit Channel' : 'Create New Channel'}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Channel Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., MadFaceTV"
                    />
                  </div>

                  <div>
                    <Label>Slug *</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="e.g., madfacetv"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used in URLs: /live/{formData.slug || 'channel-slug'}
                    </p>
                  </div>

                <div>
                  <Label>Channel Logo</Label>
                  <div className="space-y-2">
                    {/* Logo Preview */}
                    {formData.logo_url && (
                      <div className="relative inline-block">
                        <img 
                          src={formData.logo_url} 
                          alt="Logo preview" 
                          className="h-16 w-auto rounded border border-border"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="flex-1"
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload Logo
                      </Button>
                    </div>
                    
                    {/* URL Input as fallback */}
                    <Input
                      value={formData.logo_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                      placeholder="Or paste image URL..."
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Channel description..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Default Ad Interval (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.default_ad_interval_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_ad_interval_minutes: parseInt(e.target.value) || 15 }))}
                    min={5}
                    max={60}
                  />
                </div>

                  <div className="flex items-center justify-between">
                    <Label>Active</Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>

                  <Button onClick={handleSave} className="w-full" disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingChannel ? 'Update Channel' : 'Create Channel'}
                  </Button>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        {channels.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Tv className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No Channels Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first live TV channel to get started.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Channel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {channels.map((channel) => (
              <Card key={channel.id}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {channel.logo_url ? (
                      <img
                        src={channel.logo_url}
                        alt={channel.name}
                        className="h-16 w-auto rounded"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-primary/10 rounded flex items-center justify-center">
                        <Tv className="h-8 w-8 text-primary" />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-foreground">{channel.name}</h3>
                        {channel.is_active ? (
                          <Badge variant="outline" className="text-green-500 border-green-500">
                            <Radio className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        /{channel.slug} • {channel.timezone} • Ads every {channel.default_ad_interval_minutes}m
                      </p>
                      {channel.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {channel.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/admin/livetv/playlists/${channel.id}`}>
                        <Button variant="outline" size="sm">
                          Manage Playlists
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(channel)}
                        title={channel.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Radio className={`h-4 w-4 ${channel.is_active ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(channel)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(channel)}
                        className="text-destructive hover:text-destructive"
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
      </main>
    </div>
  );
}
