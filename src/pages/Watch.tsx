import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Pause, Play, Volume2, VolumeX, Star, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Review {
  id: string;
  name: string;
  avatar: string;
  date: string;
  rating: number;
  text: string;
}

// Sample movie data with cast
const moviesData = {
  "1": {
    title: "John Wick 4",
    description: "John Wick uncovers a path to defeating the High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe and forces that turn old friends into foes.",
    heroImage: "https://image.tmdb.org/t/p/original/h8gHn0OzBoaefsYseUByqsmEDMY.jpg",
    posterUrl: "https://image.tmdb.org/t/p/original/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
    rating: "8.2",
    year: "2023",
    length: "2h 49m",
    category: ["Action", "Crime", "Thriller"],
    cast: ["Keanu Reeves", "Donnie Yen", "Bill Skarsgård", "Laurence Fishburne", "Ian McShane"],
    crew: ["Chad Stahelski", "Basil Iwanyk", "Erica Lee"],
    videoSource: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
  },
  "featured-1": {
    title: "John Wick 4",
    description: "John Wick uncovers a path to defeating the High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe and forces that turn old friends into foes.",
    heroImage: "https://image.tmdb.org/t/p/original/h8gHn0OzBoaefsYseUByqsmEDMY.jpg",
    posterUrl: "https://image.tmdb.org/t/p/original/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
    rating: "8.2",
    year: "2023",
    length: "2h 49m",
    category: ["Action", "Crime", "Thriller"],
    cast: ["Keanu Reeves", "Donnie Yen", "Bill Skarsgård", "Laurence Fishburne", "Ian McShane"],
    crew: ["Chad Stahelski", "Basil Iwanyk", "Erica Lee"],
    videoSource: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
  }
};

// Sample recommended movies
const recommendedMovies = [
  {
    id: "20",
    title: "Warlock of Dusk",
    posterUrl: "https://image.tmdb.org/t/p/w500/jOGPnX9Ufb3XyT8YW19G7TLrRRU.jpg",
  },
  {
    id: "21",
    title: "The White House Down",
    posterUrl: "https://image.tmdb.org/t/p/w500/1jcLMx9U5yChTrMPzGRVF2iw4CL.jpg",
  },
  {
    id: "22",
    title: "The Sleeping Angel",
    posterUrl: "https://image.tmdb.org/t/p/w500/8xV47NDrjdZDpYUtcKYNLvbGTrI.jpg",
  },
  {
    id: "23",
    title: "The Post",
    posterUrl: "https://image.tmdb.org/t/p/w500/qyRwj5VvuTRdJ76o2grP93grNxt.jpg",
  },
  {
    id: "24",
    title: "Spider Man Meme",
    posterUrl: "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
  },
  {
    id: "25",
    title: "Man in The Black",
    posterUrl: "https://image.tmdb.org/t/p/w500/6oNm06TPz2vGiPc2I52oXW3JwPS.jpg",
  }
];

const sampleReviews: Review[] = [
  {
    id: "1",
    name: "Jane Doe",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    date: "September 20, 2024",
    rating: 5,
    text: "John Wick: Chapter 4 is a non-stop thrill ride, packed with jaw-dropping action, breathtaking visuals, and hard-earned heart in parts. The film masterfully expands the Wick universe while maintaining relentless intensity. With stunning choreography and standout performances, it's a must-see for action fans."
  }
];

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviews, setReviews] = useState<Review[]>(sampleReviews);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  // Get movie data based on ID
  const movieData = id && moviesData[id as keyof typeof moviesData] 
    ? moviesData[id as keyof typeof moviesData] 
    : moviesData["1"];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const playVideo = () => {
    setShowVideo(true);
    setIsPlaying(true);
  };
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (reviewText && reviewName && reviewRating > 0) {
      const newReview: Review = {
        id: Date.now().toString(),
        name: reviewName,
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        rating: reviewRating,
        text: reviewText
      };
      
      setReviews([newReview, ...reviews]);
      setReviewText("");
      setReviewName("");
      setReviewEmail("");
      setReviewRating(0);
      
      toast.success("Your review has been submitted!");
    } else {
      toast.error("Please fill in all required fields");
    }
  };
  
  const handleStarClick = (rating: number) => {
    setReviewRating(rating);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0A0A1B] text-white">
      <Navbar />
      
      {showVideo ? (
        <div className="h-screen w-full bg-black relative overflow-hidden">
          {/* Video Element */}
          <div className="absolute inset-0 bg-black z-0">
            <video 
              className="w-full h-full object-contain"
              autoPlay={isPlaying}
              muted={isMuted}
              controls={false}
            >
              <source src={movieData.videoSource} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          
          {/* Video Controls */}
          {showControls && (
            <div className="absolute inset-0 z-10 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-black/80 transition-opacity duration-300">
              <div className="p-4 flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white"
                  onClick={() => setShowVideo(false)}
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="ml-4 text-white text-xl">{movieData.title}</h1>
              </div>
              
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white"
                      onClick={togglePlay}
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6" />
                      )}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white"
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <VolumeX className="h-6 w-6" />
                      ) : (
                        <Volume2 className="h-6 w-6" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="pt-24 pb-16">
          {/* Hero section */}
          <div className="relative h-[500px] w-full">
            <img 
              src={movieData.heroImage}
              alt={movieData.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A1B] via-transparent to-transparent" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <Button 
                onClick={playVideo} 
                className="bg-purple-600/80 hover:bg-purple-600 h-16 w-16 rounded-full flex items-center justify-center"
              >
                <Play className="h-8 w-8" />
              </Button>
            </div>
            
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm">Change Source</Button>
                <Button variant="outline" size="sm" className="bg-transparent border-gray-500 text-gray-300">
                  HD 1:1
                </Button>
              </div>
            </div>
          </div>
          
          {/* Movie info */}
          <div className="container mx-auto px-4 md:px-6 mt-6">
            <h1 className="text-4xl font-bold mb-4">{movieData.title}</h1>
            
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star}
                  className={`h-4 w-4 ${star <= parseFloat(movieData.rating) / 2 ? "fill-yellow-500 text-yellow-500" : "text-gray-500"}`}
                />
              ))}
              <span className="ml-2 text-sm">{movieData.rating}</span>
              <span className="ml-2 text-sm text-gray-400">334k Views</span>
              <span className="ml-2 text-xs bg-gray-700 px-1 rounded">L+1</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-6">
              <span>{movieData.year}</span>
              <span>•</span>
              <span>{movieData.length}</span>
              <span>•</span>
              {movieData.category.map((cat, index) => (
                <span key={cat} className={index < movieData.category.length - 1 ? "mr-1" : ""}>
                  {cat}{index < movieData.category.length - 1 ? "," : ""}
                </span>
              ))}
              <span>•</span>
              <span className="bg-gray-800 px-2 py-0.5 rounded">TV-MA</span>
            </div>
            
            <p className="text-gray-300 mb-8">
              {movieData.description}
            </p>
            
            <div className="mb-8">
              <div className="mb-2">
                <span className="text-gray-400 font-medium">Cast: </span>
                <span>{movieData.cast.join(", ")}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Crew: </span>
                <span>{movieData.crew.join(", ")}</span>
              </div>
            </div>
            
            {/* Recommended movies */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Recommended For You</h2>
              <div className="relative">
                <div className="flex overflow-x-auto scrollbar-hide pb-4 gap-4">
                  {recommendedMovies.map((movie) => (
                    <div 
                      key={movie.id}
                      className={`flex-none transition-all duration-300 ease-in-out ${
                        hoveredId === movie.id ? "w-[350px]" : "w-[180px]"
                      }`}
                      onMouseEnter={() => setHoveredId(movie.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {hoveredId === movie.id ? (
                        <div className="h-full w-full bg-black/90 rounded-lg overflow-hidden border border-gray-800 shadow-xl animate-fade-in">
                          <div className="relative">
                            <img 
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="w-full aspect-video object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                            
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <h3 className="font-bold text-white truncate mb-3">{movie.title}</h3>
                              
                              <div className="flex space-x-2">
                                <Link to={`/watch/${movie.id}?trailer=true`}>
                                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 rounded-full px-4">
                                    <Play className="h-4 w-4 mr-1" />
                                    Trailer
                                  </Button>
                                </Link>
                                <Link to={`/watch/${movie.id}`}>
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
                        <div className="block relative cursor-pointer overflow-hidden">
                          <div className="aspect-[2/3] overflow-hidden rounded-md">
                            <img 
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="w-full h-full object-cover hover:scale-105 transition duration-300"
                            />
                          </div>
                          <h3 className="mt-2 text-sm font-medium truncate">{movie.title}</h3>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Reviews section */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Add a review</h2>
              <p className="text-sm text-gray-400 mb-4">Your email address will not be published. Required fields are marked *</p>
              
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <div className="text-sm mb-2">Your rating</div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className="focus:outline-none"
                        onClick={() => handleStarClick(star)}
                      >
                        <Star 
                          className={`h-5 w-5 ${star <= reviewRating ? "fill-yellow-500 text-yellow-500" : "text-gray-500"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm mb-2">Your review *</div>
                  <Textarea 
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="h-32 bg-[#1a1a2e] border-gray-700 text-white"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm mb-2">Name *</div>
                    <Input 
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="bg-[#1a1a2e] border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <div className="text-sm mb-2">Email *</div>
                    <Input 
                      value={reviewEmail}
                      onChange={(e) => setReviewEmail(e.target.value)}
                      type="email"
                      className="bg-[#1a1a2e] border-gray-700 text-white"
                    />
                  </div>
                </div>
                
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Submit</Button>
              </form>
            </div>
            
            {/* Display reviews */}
            {reviews.length > 0 && (
              <div className="mb-12">
                {reviews.map(review => (
                  <Card key={review.id} className="bg-[#1a1a2e] border-gray-700 mb-4 p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-full overflow-hidden">
                        <img 
                          src={review.avatar} 
                          alt={review.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{review.name}</div>
                        <div className="text-xs text-gray-400">{review.date}</div>
                      </div>
                    </div>
                    
                    <div className="flex mb-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star}
                          className={`h-4 w-4 ${star <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-500"}`}
                        />
                      ))}
                    </div>
                    
                    <p className="text-gray-300">{review.text}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Watch;
