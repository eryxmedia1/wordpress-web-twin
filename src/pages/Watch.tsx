import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Pause, Play, Volume2, VolumeX, Star, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import 'video.js/dist/video-js.css';
import videojs from 'video.js';
import 'videojs-contrib-ads';
import 'videojs-ima';

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
    videoSource: "https://player.vimeo.com/progressive_redirect/playback/1078125323/rendition/1080p/file.mp4?loc=external&log_user=0&signature=0c9086ba2e6ecff9bfb5faa5bdefe3f237d1f5a2b1fb6ea1ab9970e5e70c2704",
    vastAdUrl: {
      preroll: "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=",
      midroll: "",
      postroll: ""
    }
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
    videoSource: "https://player.vimeo.com/progressive_redirect/playback/1078125323/rendition/1080p/file.mp4?loc=external&log_user=0&signature=0c9086ba2e6ecff9bfb5faa5bdefe3f237d1f5a2b1fb6ea1ab9970e5e70c2704",
    vastAdUrl: {
      preroll: "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=",
      midroll: "",
      postroll: ""
    }
  }
};

// Update the recommended movies to use the same video source
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

// Sample recommended movies
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
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  
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
  
  useEffect(() => {
    // Clean up previous player instance if it exists
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
    
    // Initialize video.js player with VAST ads when showing video
    if (showVideo && videoRef.current) {
      try {
        const playerOptions = {
          controls: true,
          autoplay: true,
          fluid: true,
          sources: [{
            src: movieData.videoSource,
            type: 'video/mp4'
          }],
          html5: {
            vhs: {
              overrideNative: true
            }
          }
        };

        // Initialize the player
        const player = videojs(videoRef.current, playerOptions, function() {
          console.log('Player initialized successfully');
          
          // Setup error handling
          this.on('error', function() {
            const error = this.error();
            console.error('Video playback error:', error && error.message);
            setVideoError(error ? error.message : 'Failed to load video');
            toast.error("Video playback error. Please try again later.");
          });
        });

        playerRef.current = player;

        // Setup IMA plugin for VAST ads
        const adTagUrl = movieData.vastAdUrl?.preroll || '';
        
        if (adTagUrl) {
          try {
            // Import the IMA plugin dynamically
            import('videojs-ima')
              .then((imaModule) => {
                if (playerRef.current) {
                  // Apply IMA plugin to the player
                  imaModule.default(playerRef.current, {
                    adTagUrl: adTagUrl
                  });
                  
                  // Make sure player is ready before initializing IMA
                  if (playerRef.current.ready) {
                    playerRef.current.ready(() => {
                      // Initialize the IMA plugin if it exists
                      if (playerRef.current && playerRef.current.ima) {
                        console.log('Initializing IMA plugin');
                        try {
                          playerRef.current.ima.initializeAdDisplayContainer();
                          playerRef.current.ima.requestAds();
                        } catch (err) {
                          console.error('Error initializing IMA:', err);
                        }
                      } else {
                        console.warn('IMA plugin not available on player');
                      }
                    });
                  }
                }
              })
              .catch(err => {
                console.error('Error loading IMA plugin:', err);
              });
          } catch (error) {
            console.error('Error setting up IMA plugin:', error);
          }
        } else {
          console.log('No ad tag URL provided');
        }

        return () => {
          if (playerRef.current) {
            playerRef.current.dispose();
            playerRef.current = null;
          }
        };
      } catch (error) {
        console.error('Error initializing video player:', error);
        setVideoError('Failed to initialize video player');
        toast.error("Failed to load video player. Please try again later.");
      }
    }
  }, [showVideo, movieData]);
  
  const playVideo = () => {
    setShowVideo(true);
    setIsPlaying(true);
  };
  
  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    if (playerRef.current) {
      playerRef.current.muted(!isMuted);
    }
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
        <div className="h-screen w-full bg-black relative overflow-hidden pt-16">
          <div className="absolute inset-0 bg-black z-0 flex items-center justify-center mt-16">
            <div className="w-full h-full max-h-[calc(100vh-64px)]">
              {videoError ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <AlertTriangle className="h-16 w-16 text-[#F97316] mb-4" />
                  <h3 className="text-xl font-medium mb-2">Video playback error</h3>
                  <p className="text-gray-400 mb-4">{videoError}</p>
                  <Button 
                    onClick={() => {setShowVideo(false); setVideoError(null);}} 
                    className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black"
                  >
                    Go Back
                  </Button>
                </div>
              ) : (
                <div data-vjs-player>
                  <video
                    ref={videoRef}
                    className="video-js vjs-big-play-centered vjs-fluid"
                    playsInline
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Back button */}
          <div className="absolute top-20 left-4 z-20">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white"
              onClick={() => {setShowVideo(false); setVideoError(null);}}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </div>
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
                className="bg-[#FFD700]/80 hover:bg-[#FFD700] text-black h-16 w-16 rounded-full flex items-center justify-center"
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
              {movieData.vastAdUrl?.preroll && (
                <div className="mt-2">
                  <span className="text-gray-400 font-medium">VAST Ad URL: </span>
                  <span className="text-gray-300 text-xs break-all">{movieData.vastAdUrl.preroll}</span>
                </div>
              )}
              <div className="mt-2">
                <span className="text-gray-400 font-medium">Video Source: </span>
                <span className="text-gray-300 text-xs break-all">{movieData.videoSource}</span>
              </div>
            </div>
            
            {/* Recommended movies */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4">Recommended Movies</h3>
              <div className="flex overflow-x-auto gap-4">
                {recommendedMovies.map(movie => (
                  <Link to={`/watch/${movie.id}`} key={movie.id}>
                    <Card
                      className="w-48 min-w-48 bg-[#1A1A2E] border-none cursor-pointer transition-transform transform-gpu hover:scale-105"
                      onMouseEnter={() => setHoveredId(movie.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <div className="relative">
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        {hoveredId === movie.id && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                            <Info className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <h4 className="text-sm font-semibold">{movie.title}</h4>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Reviews section */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4">Reviews</h3>
              
              {/* Review Form */}
              <Card className="mb-6 bg-[#1A1A2E] border-none">
                <form onSubmit={handleSubmitReview} className="p-4">
                  <div className="mb-4">
                    <label htmlFor="reviewText" className="block text-sm font-medium text-gray-300">Your Review:</label>
                    <Textarea 
                      id="reviewText"
                      placeholder="Write your review here..."
                      className="bg-gray-700 text-white rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300">Rating:</label>
                    <div>
                      {[1, 2, 3, 4, 5].map(rating => (
                        <Star
                          key={rating}
                          className={`h-6 w-6 cursor-pointer ${rating <= reviewRating ? "fill-yellow-500 text-yellow-500" : "text-gray-500"}`}
                          onClick={() => handleStarClick(rating)}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="reviewName" className="block text-sm font-medium text-gray-300">Name:</label>
                    <Input 
                      type="text"
                      id="reviewName"
                      placeholder="Your Name"
                      className="bg-gray-700 text-white rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="reviewEmail" className="block text-sm font-medium text-gray-300">Email:</label>
                    <Input 
                      type="email"
                      id="reviewEmail"
                      placeholder="Your Email"
                      className="bg-gray-700 text-white rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                      value={reviewEmail}
                      onChange={(e) => setReviewEmail(e.target.value)}
                    />
                  </div>
                  
                  <Button type="submit" className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black">
                    Submit Review
                  </Button>
                </form>
              </Card>
              
              {/* Display Reviews */}
              {reviews.map(review => (
                <Card key={review.id} className="mb-4 bg-[#1A1A2E] border-none">
                  <div className="flex items-start p-4">
                    <img src={review.avatar} alt={review.name} className="w-10 h-10 rounded-full mr-4" />
                    <div>
                      <div className="flex items-center mb-1">
                        <h5 className="font-semibold mr-2">{review.name}</h5>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star}
                            className={`h-4 w-4 ${star <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-500"}`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{review.date}</p>
                      <p className="text-gray-300">{review.text}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watch;
