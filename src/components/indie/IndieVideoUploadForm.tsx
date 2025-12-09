import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { useVimeoMetadata } from "@/hooks/useVimeoMetadata";

interface IndieVideoUploadFormProps {
  channelId: string;
  onSuccess: () => void;
  onCancel: () => void;
  currentVideoCount: number;
  maxVideos: number;
}

const MATURITY_RATINGS = ["G", "PG", "PG-13", "TV-14", "TV-MA", "R"];

const IndieVideoUploadForm = ({
  channelId,
  onSuccess,
  onCancel,
  currentVideoCount,
  maxVideos,
}: IndieVideoUploadFormProps) => {
  const { fetchMetadata, isLoading: fetchingMetadata, metadata } = useVimeoMetadata();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [backdropUrl, setBackdropUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [maturityRating, setMaturityRating] = useState("PG-13");
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear().toString());
  const [genre, setGenre] = useState("");
  const [uploading, setUploading] = useState(false);
  const [metadataFetched, setMetadataFetched] = useState(false);

  // Auto-fetch Vimeo metadata when URL changes
  useEffect(() => {
    const fetchVimeoData = async () => {
      if (videoUrl.includes("vimeo")) {
        const data = await fetchMetadata(videoUrl);
        if (data) {
          setMetadataFetched(true);
          if (data.title && !title) setTitle(data.title);
          if (data.description && !description) setDescription(data.description);
          if (data.thumbnail_large) setPosterUrl(data.thumbnail_large);
          if (data.thumbnail_large) setBackdropUrl(data.thumbnail_large);
          if (data.duration) setDuration(data.duration);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      if (videoUrl.length > 10) {
        fetchVimeoData();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [videoUrl]);

  const handleSubmit = async () => {
    if (!title.trim() || !videoUrl.trim()) {
      toast.error("Title and video URL are required");
      return;
    }

    if (currentVideoCount >= maxVideos) {
      toast.error(`You've reached the maximum limit of ${maxVideos} videos`);
      return;
    }

    setUploading(true);

    try {
      const { error } = await (supabase.from("contents") as any).insert([
        {
          title: title.trim(),
          description: description.trim() || null,
          video_url: videoUrl.trim(),
          poster_url: posterUrl.trim() || null,
          backdrop_url: backdropUrl.trim() || null,
          duration: duration.trim() || null,
          maturity_rating: maturityRating,
          release_year: releaseYear ? parseInt(releaseYear) : null,
          genre: genre.trim() || null,
          type: "movie",
          indie_channel_id: channelId,
        },
      ]);

      if (error) {
        console.error("Error uploading:", error);
        toast.error("Failed to upload video");
      } else {
        toast.success("Video uploaded successfully!");
        onSuccess();
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Video URL with Vimeo auto-fetch */}
      <div>
        <Label>Video URL *</Label>
        <div className="relative mt-1">
          <Input
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              setMetadataFetched(false);
            }}
            placeholder="Paste Vimeo URL to auto-fetch metadata..."
            className="pr-10"
          />
          {fetchingMetadata && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
          {metadataFetched && !fetchingMetadata && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Paste a Vimeo URL to automatically fetch title, thumbnail, and duration
        </p>
      </div>

      {/* Title */}
      <div>
        <Label>Title *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Video title"
          className="mt-1"
        />
      </div>

      {/* Description */}
      <div>
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Video description..."
          className="mt-1"
          rows={3}
        />
      </div>

      {/* Two column layout for metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Duration</Label>
          <Input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g., 1h 30m"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Release Year</Label>
          <Input
            type="number"
            value={releaseYear}
            onChange={(e) => setReleaseYear(e.target.value)}
            placeholder="2024"
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Maturity Rating</Label>
          <Select value={maturityRating} onValueChange={setMaturityRating}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {MATURITY_RATINGS.map((rating) => (
                <SelectItem key={rating} value={rating}>
                  {rating}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Genre</Label>
          <Input
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="e.g., Drama, Comedy"
            className="mt-1"
          />
        </div>
      </div>

      {/* Thumbnail URL */}
      <div>
        <Label>Poster/Thumbnail URL</Label>
        <Input
          value={posterUrl}
          onChange={(e) => setPosterUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1"
        />
        {posterUrl && (
          <img
            src={posterUrl}
            alt="Poster preview"
            className="mt-2 h-24 w-auto rounded object-cover"
          />
        )}
      </div>

      {/* Backdrop URL */}
      <div>
        <Label>Backdrop URL</Label>
        <Input
          value={backdropUrl}
          onChange={(e) => setBackdropUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1"
        />
      </div>

      {/* Video count status */}
      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span>Videos uploaded</span>
          <span className="font-medium">
            {currentVideoCount} / {maxVideos}
          </span>
        </div>
        <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{
              width: `${Math.min((currentVideoCount / maxVideos) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={uploading || !title.trim() || !videoUrl.trim()}
          className="flex-1 gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Video
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default IndieVideoUploadForm;
