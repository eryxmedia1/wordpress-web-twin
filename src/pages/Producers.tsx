
import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Package, Users } from "lucide-react";

// Sample producers data - same as in ProducerProfile
const producers = [
  {
    id: "1",
    name: "Alex Johnson",
    image: "https://randomuser.me/api/portraits/men/21.jpg",
    role: "Executive Producer",
    bio: "Alex Johnson is an award-winning producer with over 15 years of experience in the film and television industry.",
    followers: "245K"
  },
  {
    id: "2",
    name: "Sarah Williams",
    image: "https://randomuser.me/api/portraits/women/21.jpg",
    role: "Director & Producer",
    bio: "Sarah Williams is known for her innovative approach to storytelling and visual style.",
    followers: "189K"
  },
  {
    id: "3",
    name: "Michael Chen",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
    role: "Producer",
    bio: "Michael Chen specializes in action and sci-fi genres.",
    followers: "102K"
  },
  {
    id: "4",
    name: "Emily Rodriguez",
    image: "https://randomuser.me/api/portraits/women/22.jpg",
    role: "Executive Producer",
    bio: "Emily Rodriguez has been responsible for some of the most successful drama series in recent years.",
    followers: "176K"
  },
  {
    id: "5",
    name: "David Kim",
    image: "https://randomuser.me/api/portraits/men/23.jpg",
    role: "Producer & Writer",
    bio: "David Kim began his career as a screenwriter before transitioning to producing.",
    followers: "93K"
  },
  {
    id: "6",
    name: "Olivia Taylor",
    image: "https://randomuser.me/api/portraits/women/23.jpg",
    role: "Producer",
    bio: "Olivia Taylor specializes in documentaries and reality programming.",
    followers: "118K"
  },
  {
    id: "7",
    name: "Robert Wilson",
    image: "https://randomuser.me/api/portraits/men/24.jpg",
    role: "Executive Producer",
    bio: "Robert Wilson has overseen the development of multiple streaming hits.",
    followers: "87K"
  },
  {
    id: "8",
    name: "Jennifer Park",
    image: "https://randomuser.me/api/portraits/women/24.jpg",
    role: "Producer",
    bio: "Jennifer Park's focus on diverse storytelling has resulted in groundbreaking content.",
    followers: "132K"
  }
];

const categories = [
  "All Producers",
  "Executive Producers",
  "Directors",
  "Writers",
  "Rising Stars",
  "Award Winners"
];

const Producers = () => {
  const [activeCategory, setActiveCategory] = useState("All Producers");
  
  return (
    <div className="min-h-screen bg-[#0F0F1F] text-white">
      <Navbar />
      
      <div className="pt-32 pb-16 px-4 md:px-8">
        <h1 className="text-4xl font-bold mb-6">Producers</h1>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl">
          Discover the creative minds behind your favorite shows and movies. 
          These producers shape the entertainment landscape with their vision and expertise.
        </p>
        
        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"} 
              className={activeCategory === category ? "bg-purple-600 hover:bg-purple-700" : "bg-transparent text-white hover:bg-gray-800"}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
        
        {/* Producer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {producers.map((producer) => (
            <Link
              key={producer.id}
              to={`/producer/${producer.id}`}
              className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors group"
            >
              <div className="aspect-[3/2] overflow-hidden">
                <img 
                  src={producer.image}
                  alt={producer.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{producer.name}</h3>
                <p className="text-sm text-purple-400 mb-2">{producer.role}</p>
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">{producer.bio}</p>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>{producer.followers} followers</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Producers;
