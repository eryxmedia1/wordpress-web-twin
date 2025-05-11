
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

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
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {contents.map((content) => (
          <Link 
            key={content.id} 
            to={`/watch/${content.id}`} 
            className="group block"
          >
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
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ContentRow;
