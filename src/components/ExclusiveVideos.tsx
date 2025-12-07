import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ExclusiveVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
}

interface ExclusiveVideosProps {
  title: string;
  videos: ExclusiveVideo[];
}

const ExclusiveVideos = ({ title, videos }: ExclusiveVideosProps) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
        <Link to="/videos" className="text-secondary hover:text-secondary/80 text-sm font-medium">
          See All
        </Link>
      </div>
      
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {videos.map((video) => (
            <Link
              key={video.id}
              to={`/watch/${video.id}`}
              className="flex-shrink-0 w-64 md:w-80 group"
            >
              <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-card">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Play className="w-5 h-5 text-secondary-foreground ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/70 rounded text-xs text-foreground">
                  {video.duration}
                </div>
              </div>
              
              <h3 className="text-foreground font-medium text-sm group-hover:text-secondary transition-colors line-clamp-1">
                {video.title}
              </h3>
              <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                {video.description}
              </p>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default ExclusiveVideos;
