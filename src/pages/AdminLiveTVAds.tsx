import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { Film, Plus, Pencil, Trash2, ArrowLeft, Loader2, PlayCircle } from "lucide-react";

interface Ad {
  id: string;
  name: string;
  video_url: string;
  duration_seconds: number;
  ad_type: string;
  is_active: boolean;
}

const AD_TYPES = [
  { value: 'preroll', label: 'Pre-roll' },
  { value: 'midroll', label: 'Mid-roll' },
  { value: 'postroll', label: 'Post-roll' },
  { value: 'generic_break', label: 'Generic Break' },
];

export default function AdminLiveTVAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    video_url: '',
    duration_seconds: 30,
    ad_type: 'preroll',
    is_active: true,
  });

  const fetchAds = async () => {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('name');

    if (!error && data) {
      setAds(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      video_url: '',
      duration_seconds: 30,
      ad_type: 'preroll',
      is_active: true,
    });
    setEditingAd(null);
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      name: ad.name,
      video_url: ad.video_url,
      duration_seconds: ad.duration_seconds,
      ad_type: ad.ad_type,
      is_active: ad.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.video_url) {
      toast.error('Name and video URL are required');
      return;
    }

    setIsSaving(true);

    try {
      if (editingAd) {
        const { error } = await supabase
          .from('ads')
          .update({
            name: formData.name,
            video_url: formData.video_url,
            duration_seconds: formData.duration_seconds,
            ad_type: formData.ad_type,
            is_active: formData.is_active,
          })
          .eq('id', editingAd.id);

        if (error) throw error;
        toast.success('Ad updated successfully');
      } else {
        const { error } = await supabase
          .from('ads')
          .insert({
            name: formData.name,
            video_url: formData.video_url,
            duration_seconds: formData.duration_seconds,
            ad_type: formData.ad_type,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast.success('Ad created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAds();
    } catch (error: any) {
      console.error('Error saving ad:', error);
      toast.error(error.message || 'Failed to save ad');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (ad: Ad) => {
    if (!confirm(`Delete ad "${ad.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', ad.id);

      if (error) throw error;
      toast.success('Ad deleted');
      fetchAds();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete ad');
    }
  };

  const toggleActive = async (ad: Ad) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ is_active: !ad.is_active })
        .eq('id', ad.id);

      if (error) throw error;
      fetchAds();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update ad');
    }
  };

  const getAdTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      preroll: 'bg-blue-500',
      midroll: 'bg-amber-500',
      postroll: 'bg-purple-500',
      generic_break: 'bg-gray-500',
    };
    return colors[type] || 'bg-gray-500';
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
              <Film className="h-8 w-8 text-primary" />
              Ads Library
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage advertisements for live TV channels
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Ad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingAd ? 'Edit Advertisement' : 'Create Advertisement'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Ad Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Summer Sale Promo"
                  />
                </div>

                <div>
                  <Label>Video URL *</Label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                    placeholder="https://vimeo.com/... or direct URL"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Duration (seconds)</Label>
                    <Input
                      type="number"
                      value={formData.duration_seconds}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) || 30 }))}
                      min={5}
                      max={300}
                    />
                  </div>
                  <div>
                    <Label>Ad Type</Label>
                    <Select
                      value={formData.ad_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, ad_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AD_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  {editingAd ? 'Update Ad' : 'Create Ad'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {ads.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No Ads Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first advertisement to use in live TV playlists.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ad
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map((ad) => (
              <Card key={ad.id}>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{ad.name}</h3>
                          {!ad.is_active && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getAdTypeBadge(ad.ad_type)}>
                            {AD_TYPES.find(t => t.value === ad.ad_type)?.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {ad.duration_seconds}s
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground truncate">
                      {ad.video_url}
                    </p>

                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(ad)}
                        title={ad.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <PlayCircle className={`h-4 w-4 ${ad.is_active ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(ad)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(ad)}
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
