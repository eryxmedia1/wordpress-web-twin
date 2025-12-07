import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  category: string;
}

interface TopNewsProps {
  title: string;
  news: NewsItem[];
}

const TopNews = ({ title, news }: TopNewsProps) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
        <Link to="/news" className="text-purple-400 hover:text-purple-300 text-sm font-medium">
          See All
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item) => (
          <Link
            key={item.id}
            to={`/news/${item.id}`}
            className="group bg-[#1a1a2e] rounded-xl overflow-hidden hover:ring-1 hover:ring-purple-500/50 transition-all"
          >
            {/* Image */}
            <div className="relative aspect-video overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded">
                  {item.category}
                </span>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4">
              <h3 className="text-white font-semibold text-sm group-hover:text-purple-400 transition-colors line-clamp-2 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-400 text-xs line-clamp-2 mb-3">
                {item.excerpt}
              </p>
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Calendar className="w-3 h-3" />
                <span>{item.date}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default TopNews;
