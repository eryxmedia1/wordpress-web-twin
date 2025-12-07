import { Link } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Category {
  id: string;
  name: string;
  imageUrl: string;
  color: string;
}

interface CategoryCirclesProps {
  title: string;
  categories: Category[];
}

const CategoryCircles = ({ title, categories }: CategoryCirclesProps) => {
  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
      
      <ScrollArea className="w-full">
        <div className="flex gap-6 pb-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/browse/genres/${category.id}`}
              className="flex flex-col items-center gap-3 group"
            >
              <div 
                className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-secondary transition-all duration-300 bg-card"
                style={{ 
                  background: `linear-gradient(135deg, ${category.color}40, ${category.color}20)` 
                }}
              >
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
              </div>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors text-center">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default CategoryCircles;
