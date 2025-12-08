import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import ContentLockBadge from "@/components/ContentLockBadge";

interface ContentItem {
  id: string;
  title: string;
  posterUrl: string;
  rating?: string;
  year?: string;
  progress?: number;
  requiredPlans?: string[];
}

interface MobileContentRowProps {
  title: string;
  items: ContentItem[];
  onItemClick: (id: string) => void;
  seeAllLink?: string;
  showProgress?: boolean;
  userPlan?: string;
}

const MobileContentRow = ({
  title,
  items,
  onItemClick,
  seeAllLink,
  showProgress = false,
  userPlan = 'free',
}: MobileContentRowProps) => {
  const navigate = useNavigate();
  
  if (items.length === 0) return null;

  const handleSeeAll = () => {
    if (seeAllLink) {
      navigate(seeAllLink);
    }
  };

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {seeAllLink && (
          <button 
            onClick={handleSeeAll}
            className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
          >
            See All
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className="flex-shrink-0 w-[110px] cursor-pointer group"
          >
            {/* Poster Card */}
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card">
              {item.requiredPlans && (
                <ContentLockBadge 
                  requiredPlans={item.requiredPlans} 
                  userPlan={userPlan} 
                  size="sm" 
                />
              )}
              <img
                src={item.posterUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Rating Badge */}
              {item.rating && (
                <div className="absolute top-1.5 left-1.5 bg-background/80 px-1.5 py-0.5 rounded text-[10px] font-medium text-foreground">
                  {item.rating}
                </div>
              )}

              {/* Progress Bar */}
              {showProgress && item.progress !== undefined && item.progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Title */}
            <p className="mt-1.5 text-xs text-foreground line-clamp-2 leading-tight">
              {item.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileContentRow;
