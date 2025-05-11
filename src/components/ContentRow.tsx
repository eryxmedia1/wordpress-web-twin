
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

interface Content {
  id: string;
  title: string;
  posterUrl: string;
  rating?: string;
  year?: string;
  category?: string;
}

interface ContentRowProps {
  title: string;
  contents: Content[];
  seeAllLink?: string;
}

const ContentRow = ({ title, contents, seeAllLink }: ContentRowProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {seeAllLink && (
          <Link 
            to={seeAllLink} 
            className="flex items-center text-sm text-purple-400 hover:text-purple-300"
          >
            See All <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      
      <div className="relative">
        <div className="flex overflow-x-auto scrollbar-hide pb-4 gap-4">
          {contents.map((content) => (
            <div 
              key={content.id}
              className={`flex-none transition-all duration-300 ease-in-out ${
                hoveredId === content.id ? "w-[350px]" : "w-[180px]"
              }`}
              onMouseEnter={() => setHoveredId(content.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {hoveredId === content.id ? (
                <div className="h-full w-full bg-black/90 rounded-lg overflow-hidden border border-gray-800 shadow-xl animate-fade-in">
                  <div className="relative">
                    <img 
                      src={content.posterUrl}
                      alt={content.title}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-bold text-white truncate mb-1">{content.title}</h3>
                      <div className="text-xs text-gray-300 mb-3 flex items-center">
                        {content.year} {content.category && `• ${content.category}`}
                        {content.rating && 
                          <span className="ml-auto bg-purple-600 text-white px-1.5 py-0.5 rounded-sm">
                            {content.rating}
                          </span>
                        }
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link to={`/watch/${content.id}?trailer=true`}>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 rounded-full px-4">
                            <Play className="h-4 w-4 mr-1" />
                            Trailer
                          </Button>
                        </Link>
                        <Link to={`/watch/${content.id}`}>
                          <Button variant="outline" size="sm" className="rounded-full border-white/40 hover:bg-white/10 px-4">
                            <Info className="h-4 w-4 mr-1" />
                            Detail
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="group block relative cursor-pointer overflow-hidden">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-md mb-2">
                    <img 
                      src={content.posterUrl}
                      alt={content.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {content.rating && (
                      <div className="absolute top-2 right-2 bg-purple-600 text-white px-1.5 py-0.5 text-xs rounded-sm">
                        {content.rating}
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium truncate">{content.title}</h3>
                  <div className="text-xs text-gray-400">
                    {content.year} {content.category && `• ${content.category}`}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContentRow;
