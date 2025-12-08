import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, X, GripVertical, Check } from "lucide-react";

interface Video {
  id: string;
  title: string;
  video_url: string | null;
  poster_url: string | null;
  duration?: string | null;
}

interface SelectedVideo extends Video {
  episodeNumber: number;
  episodeTitle: string;
  description: string;
}

interface VideoSearchSelectorProps {
  availableVideos: Video[];
  selectedVideos: SelectedVideo[];
  onSelectedVideosChange: (videos: SelectedVideo[]) => void;
}

export const VideoSearchSelector = ({
  availableVideos,
  selectedVideos,
  onSelectedVideosChange,
}: VideoSearchSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Filter available videos based on search term
  const filteredVideos = useMemo(() => {
    return availableVideos.filter((video) =>
      video.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableVideos, searchTerm]);

  // Get IDs of already selected videos
  const selectedVideoIds = useMemo(() => {
    return new Set(selectedVideos.map((v) => v.id));
  }, [selectedVideos]);

  // Add a video to the selection
  const handleAddVideo = (video: Video) => {
    const newEpisodeNumber = selectedVideos.length + 1;
    const newSelectedVideo: SelectedVideo = {
      ...video,
      episodeNumber: newEpisodeNumber,
      episodeTitle: video.title,
      description: "",
    };
    onSelectedVideosChange([...selectedVideos, newSelectedVideo]);
  };

  // Remove a video from the selection
  const handleRemoveVideo = (videoId: string) => {
    const updatedVideos = selectedVideos
      .filter((v) => v.id !== videoId)
      .map((v, idx) => ({
        ...v,
        episodeNumber: idx + 1,
      }));
    onSelectedVideosChange(updatedVideos);
  };

  // Update episode title
  const handleUpdateEpisodeTitle = (videoId: string, title: string) => {
    const updatedVideos = selectedVideos.map((v) =>
      v.id === videoId ? { ...v, episodeTitle: title } : v
    );
    onSelectedVideosChange(updatedVideos);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newVideos = [...selectedVideos];
    const draggedItem = newVideos[draggedIndex];
    newVideos.splice(draggedIndex, 1);
    newVideos.splice(index, 0, draggedItem);

    // Update episode numbers
    const reorderedVideos = newVideos.map((v, idx) => ({
      ...v,
      episodeNumber: idx + 1,
    }));

    onSelectedVideosChange(reorderedVideos);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Move up/down
  const moveVideo = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedVideos.length) return;

    const newVideos = [...selectedVideos];
    [newVideos[index], newVideos[newIndex]] = [newVideos[newIndex], newVideos[index]];

    const reorderedVideos = newVideos.map((v, idx) => ({
      ...v,
      episodeNumber: idx + 1,
    }));

    onSelectedVideosChange(reorderedVideos);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Search and Available Videos */}
      <div className="border border-border rounded-lg p-4 bg-card/50">
        <h4 className="text-sm font-medium text-foreground mb-3">Available Videos</h4>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background border-border"
          />
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-4">
            {filteredVideos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No videos found
              </p>
            ) : (
              filteredVideos.map((video) => {
                const isSelected = selectedVideoIds.has(video.id);
                return (
                  <div
                    key={video.id}
                    className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                      isSelected
                        ? "border-primary/50 bg-primary/10 opacity-60"
                        : "border-border hover:border-primary/30 hover:bg-accent/50 cursor-pointer"
                    }`}
                    onClick={() => !isSelected && handleAddVideo(video)}
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                      {video.poster_url ? (
                        <img
                          src={video.poster_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <span className="text-xs">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {video.title}
                      </p>
                      {video.duration && (
                        <p className="text-xs text-muted-foreground">{video.duration}</p>
                      )}
                    </div>

                    {/* Add/Selected Button */}
                    {isSelected ? (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddVideo(video);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Selected Episodes with Reordering */}
      <div className="border border-border rounded-lg p-4 bg-card/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground">
            Selected Episodes ({selectedVideos.length})
          </h4>
          {selectedVideos.length > 0 && (
            <p className="text-xs text-muted-foreground">Drag to reorder</p>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {selectedVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No episodes selected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Search and click videos to add them as episodes
              </p>
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {selectedVideos.map((video, index) => (
                <div
                  key={video.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-lg border border-border bg-background transition-all ${
                    draggedIndex === index ? "opacity-50 border-primary" : ""
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Episode Number */}
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/20 text-primary font-bold text-sm flex-shrink-0">
                    {video.episodeNumber}
                  </div>

                  {/* Thumbnail */}
                  <div className="w-16 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                    {video.poster_url ? (
                      <img
                        src={video.poster_url}
                        alt={video.episodeTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <span className="text-[10px]">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Episode Title Input */}
                  <div className="flex-1 min-w-0">
                    <Input
                      value={video.episodeTitle}
                      onChange={(e) => handleUpdateEpisodeTitle(video.id, e.target.value)}
                      className="h-8 text-sm bg-background border-border"
                      placeholder="Episode title"
                    />
                  </div>

                  {/* Move Buttons */}
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-accent"
                      disabled={index === 0}
                      onClick={() => moveVideo(index, "up")}
                    >
                      <span className="text-xs">▲</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-accent"
                      disabled={index === selectedVideos.length - 1}
                      onClick={() => moveVideo(index, "down")}
                    >
                      <span className="text-xs">▼</span>
                    </Button>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                    onClick={() => handleRemoveVideo(video.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default VideoSearchSelector;
