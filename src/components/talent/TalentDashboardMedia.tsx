import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Image, Video, FileText, Plus, Trash2 } from "lucide-react";
import ReactPlayer from "react-player";

interface TalentDashboardMediaProps {
  talentId: string;
}

export function TalentDashboardMedia({ talentId }: TalentDashboardMediaProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [talent, setTalent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, [talentId]);

  const fetchMedia = async () => {
    const [photosRes, talentRes] = await Promise.all([
      supabase.from("talent_photos").select("*").eq("talent_id", talentId).order("sort_order"),
      supabase.from("talents").select("video_reel_url, resume_url, primary_photo_url").eq("id", talentId).single()
    ]);

    setPhotos(photosRes.data || []);
    setTalent(talentRes.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Reel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Reel
          </CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Upload Reel
          </Button>
        </CardHeader>
        <CardContent>
          {talent?.video_reel_url ? (
            <div className="aspect-video rounded-lg overflow-hidden">
              <ReactPlayer
                url={talent.video_reel_url}
                width="100%"
                height="100%"
                controls
              />
            </div>
          ) : (
            <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-2" />
                <p>No video reel uploaded yet</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Gallery */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Photo Gallery ({photos.length})
          </CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Photos
          </Button>
        </CardHeader>
        <CardContent>
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map(photo => (
                <div key={photo.id} className="group relative aspect-[3/4] rounded-lg overflow-hidden">
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || "Photo"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60">
                      <p className="text-xs text-white truncate">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-2" />
              <p>No photos uploaded yet</p>
              <p className="text-sm">Add headshots and full body photos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resume */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume / CV
          </CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Upload Resume
          </Button>
        </CardHeader>
        <CardContent>
          {talent?.resume_url ? (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Resume.pdf</p>
                  <p className="text-sm text-muted-foreground">Click to view or download</p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <a href={talent.resume_url} target="_blank" rel="noopener">
                  View
                </a>
              </Button>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <p>No resume uploaded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
