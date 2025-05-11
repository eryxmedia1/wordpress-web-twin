
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Package, Award, Users } from "lucide-react";

// Sample producers data
const producers = [
  {
    id: "1",
    name: "Alex Johnson",
    image: "https://randomuser.me/api/portraits/men/21.jpg",
    coverImage: "https://image.tmdb.org/t/p/original/5bunYe8EL2SH8lQxhC0pXobcaRL.jpg",
    role: "Executive Producer",
    bio: "Alex Johnson is an award-winning producer with over 15 years of experience in the film and television industry. He has worked on numerous blockbuster films and hit TV series.",
    credits: [
      { title: "Ripley", role: "Executive Producer", year: "2023" },
      { title: "The Last of Us", role: "Producer", year: "2023" },
      { title: "Oppenheimer", role: "Co-Producer", year: "2023" },
    ],
    awards: "Emmy Award (2022), Golden Globe (2020)",
    followers: "245K"
  },
  {
    id: "2",
    name: "Sarah Williams",
    image: "https://randomuser.me/api/portraits/women/21.jpg",
    coverImage: "https://image.tmdb.org/t/p/original/h8gHn0OzBoaefsYseUByqsmEDMY.jpg",
    role: "Director & Producer",
    bio: "Sarah Williams is known for her innovative approach to storytelling and visual style. She has directed and produced several critically acclaimed independent films.",
    credits: [
      { title: "John Wick 4", role: "Producer", year: "2023" },
      { title: "Fallout", role: "Executive Producer", year: "2024" },
      { title: "City Hunter", role: "Director & Producer", year: "2023" },
    ],
    awards: "Sundance Film Festival Award (2021), BAFTA (2019)",
    followers: "189K"
  },
  {
    id: "3",
    name: "Michael Chen",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
    coverImage: "https://image.tmdb.org/t/p/original/5bunYe8EL2SH8lQxhC0pXobcaRL.jpg",
    role: "Producer",
    bio: "Michael Chen specializes in action and sci-fi genres. His attention to detail and commitment to practical effects has earned him a devoted following among genre fans.",
    credits: [
      { title: "Shogun", role: "Producer", year: "2024" },
      { title: "The Bikeriders", role: "Executive Producer", year: "2023" },
      { title: "Marvel The Marvels", role: "Co-Producer", year: "2023" },
    ],
    awards: "Producer's Guild Award (2023)",
    followers: "102K"
  },
  {
    id: "4",
    name: "Emily Rodriguez",
    image: "https://randomuser.me/api/portraits/women/22.jpg",
    coverImage: "https://image.tmdb.org/t/p/original/h8gHn0OzBoaefsYseUByqsmEDMY.jpg",
    role: "Executive Producer",
    bio: "Emily Rodriguez has been responsible for some of the most successful drama series in recent years. Her talent for character development has made her one of the most sought-after producers in television.",
    credits: [
      { title: "The White Lotus", role: "Executive Producer", year: "2022" },
      { title: "The Holdovers", role: "Producer", year: "2023" },
      { title: "The Post", role: "Executive Producer", year: "2018" },
    ],
    awards: "Television Critics Association Award (2022), Peabody Award (2021)",
    followers: "176K"
  },
  {
    id: "5",
    name: "David Kim",
    image: "https://randomuser.me/api/portraits/men/23.jpg",
    coverImage: "https://image.tmdb.org/t/p/original/5bunYe8EL2SH8lQxhC0pXobcaRL.jpg",
    role: "Producer & Writer",
    bio: "David Kim began his career as a screenwriter before transitioning to producing. His unique perspective allows him to bridge the gap between creative vision and practical execution.",
    credits: [
      { title: "Gatlopp", role: "Producer & Writer", year: "2022" },
      { title: "In the Air", role: "Producer", year: "2021" },
      { title: "The Sleeping Angel", role: "Executive Producer", year: "2023" },
    ],
    awards: "Writers Guild Award (2021)",
    followers: "93K"
  },
  {
    id: "6",
    name: "Olivia Taylor",
    image: "https://randomuser.me/api/portraits/women/23.jpg",
    coverImage: "https://image.tmdb.org/t/p/original/h8gHn0OzBoaefsYseUByqsmEDMY.jpg",
    role: "Producer",
    bio: "Olivia Taylor specializes in documentaries and reality programming. Her work often explores social issues and real-world stories with compassion and insight.",
    credits: [
      { title: "The White House Down", role: "Producer", year: "2023" },
      { title: "The Last Emperor", role: "Documentary Producer", year: "1987" },
      { title: "Pieces of Her", role: "Executive Producer", year: "2022" },
    ],
    awards: "Documentary Emmy Award (2020)",
    followers: "118K"
  },
  {
    id: "7",
    name: "Robert Wilson",
    image: "https://randomuser.me/api/portraits/men/24.jpg",
    coverImage: "https://image.tmdb.org/t/p/original/5bunYe8EL2SH8lQxhC0pXobcaRL.jpg",
    role: "Executive Producer",
    bio: "Robert Wilson has overseen the development of multiple streaming hits. His ability to identify emerging talent has resulted in numerous successful collaborations.",
    credits: [
      { title: "John Wick 4", role: "Executive Producer", year: "2023" },
      { title: "The Bikeriders", role: "Producer", year: "2023" },
      { title: "Fallout", role: "Co-Executive Producer", year: "2024" },
    ],
    awards: "Streaming Content Award (2023)",
    followers: "87K"
  },
  {
    id: "8",
    name: "Jennifer Park",
    image: "https://randomuser.me/api/portraits/women/24.jpg",
    coverImage: "https://image.tmdb.org/t/p/original/h8gHn0OzBoaefsYseUByqsmEDMY.jpg",
    role: "Producer",
    bio: "Jennifer Park's focus on diverse storytelling has resulted in groundbreaking content that has resonated with audiences worldwide. Her productions consistently push boundaries.",
    credits: [
      { title: "Shogun", role: "Associate Producer", year: "2024" },
      { title: "Ripley", role: "Producer", year: "2023" },
      { title: "The Last of Us", role: "Executive Producer", year: "2023" },
    ],
    awards: "Diversity in Media Award (2022)",
    followers: "132K"
  }
];

const ProducerProfile = () => {
  const { id } = useParams();
  const producer = producers.find(p => p.id === id) || producers[0];

  return (
    <div className="min-h-screen bg-[#0F0F1F] text-white">
      <Navbar />
      
      <div className="pt-32 pb-16 px-4 md:px-8">
        {/* Cover Image */}
        <div className="relative h-[250px] w-full overflow-hidden rounded-lg mb-8">
          <div className="absolute inset-0">
            <img 
              src={producer.coverImage} 
              alt={`${producer.name} Cover`} 
              className="w-full h-full object-cover opacity-70"
            />
          </div>
        </div>
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end mb-10">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-600">
            <img 
              src={producer.image}
              alt={producer.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{producer.name}</h1>
            <p className="text-sm text-purple-400 mb-3">{producer.role}</p>
            <div className="flex gap-4 items-center">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Follow
              </Button>
              <div className="flex items-center gap-1 text-sm">
                <Users className="h-4 w-4" />
                <span>{producer.followers} followers</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bio Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Biography</h2>
              <p className="text-gray-300">{producer.bio}</p>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Notable Works</h2>
              <div className="space-y-4">
                {producer.credits.map((credit, index) => (
                  <div key={index} className="flex justify-between border-b border-gray-700 pb-3 last:border-0">
                    <div>
                      <h3 className="font-medium">{credit.title}</h3>
                      <p className="text-sm text-gray-400">{credit.role}</p>
                    </div>
                    <p className="text-sm text-gray-400">{credit.year}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Achievements</h2>
              <div className="flex items-start gap-3 mb-4">
                <Award className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-1" />
                <p className="text-gray-300">{producer.awards}</p>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Productions</h2>
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-purple-500 flex-shrink-0 mt-1" />
                <p className="text-gray-300">
                  Has produced {producer.credits.length} major titles across multiple platforms and genres.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProducerProfile;
