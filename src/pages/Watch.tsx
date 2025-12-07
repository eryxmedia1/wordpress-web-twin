import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Star, Info, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import ReactPlayer from "react-player";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";

interface Review {
  id: string;
  name: string;
  avatar: string;
  date: string;
  rating: number;
  text: string;
}

interface ContentData {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  video_url: string | null;
  trailer_url: string | null;
  rating: string | null;
  release_year: number | null;
  duration: string | null;
  genre: string | null;
  maturity_rating: string | null;
  cast_members: string[] | null;
  creator: string | null;
  vast_ad_preroll: string | null;
  vast_ad_midroll: string | null;
  vast_ad_postroll: string | null;
}

const sampleReviews: Review[] = [
  {
    id: "1",
    name: "Jane Doe",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    date: "September 20, 2024",
    rating: 5,
    text: "Amazing content! The production quality is top-notch and the storytelling is captivating. Highly recommend watching this."
  }
];

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProfile } = useProfile();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [content, setContent] = useState<ContentData | null>(null);
  const [recommendedContent, setRecommendedContent] = useState<ContentData[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviews, setReviews] = useState<Review[]>(sampleReviews);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  // Progress tracking state
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const lastSavedProgress = useRef(0);
  const playerRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return;

      setIsLoading(true);
      
      // Fetch main content
      const { data: contentData, error } = await supabase
        .from("contents")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !contentData) {
        console.error("Error fetching content:", error);
        toast.error("Content not found");
        navigate("/browse");
        return;
      }

      setContent(contentData as ContentData);

      // Fetch existing watch progress if user is logged in
      if (currentProfile?.id) {
        const { data: watchHistory } = await supabase
          .from("watch_history")
          .select("progress_percent")
          .eq("profile_id", currentProfile.id)
          .eq("content_id", id)
          .single();
        
        if (watchHistory) {
          setProgress(watchHistory.progress_percent || 0);
          lastSavedProgress.current = watchHistory.progress_percent || 0;
        }
      }

      // Fetch recommended content (same genre or type)
      const { data: recommended } = await supabase
        .from("contents")
        .select("*")
        .neq("id", id)
        .limit(6);

      if (recommended) {
        setRecommendedContent(recommended as ContentData[]);
      }

      setIsLoading(false);
    };

    fetchContent();
  }, [id, navigate, currentProfile?.id]);

  // Save progress to database
  const saveProgress = useCallback(async (progressPercent: number) => {
    if (!currentProfile?.id || !id) return;
    
    // Only save if progress changed by at least 2%
    if (Math.abs(progressPercent - lastSavedProgress.current) < 2) return;
    
    lastSavedProgress.current = progressPercent;
    
    const { data: existing } = await supabase
      .from("watch_history")
      .select("id")
      .eq("profile_id", currentProfile.id)
      .eq("content_id", id)
      .single();

    if (existing) {
      await supabase
        .from("watch_history")
        .update({ 
          progress_percent: Math.round(progressPercent),
          last_watched_at: new Date().toISOString()
        })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("watch_history")
        .insert({
          profile_id: currentProfile.id,
          content_id: id,
          progress_percent: Math.round(progressPercent),
          last_watched_at: new Date().toISOString()
        });
    }
  }, [currentProfile?.id, id]);

  // Handle video progress updates
  const handleProgress = useCallback((state: { played: number; playedSeconds: number }) => {
    const progressPercent = state.played * 100;
    setProgress(progressPercent);
    
    // Save progress every 5 seconds worth of progress or significant jumps
    saveProgress(progressPercent);
  }, [saveProgress]);

  const handleDuration = useCallback((dur: number) => {
    setDuration(dur);
  }, []);

  // Save progress when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (progress > 0) {
        saveProgress(progress);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Save progress when component unmounts
      if (progress > 0) {
        saveProgress(progress);
      }
    };
  }, [progress, saveProgress]);

  const playVideo = () => {
    setShowVideo(true);
    setIsPlaying(true);
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

  // Format time for display
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Content not found</p>
      </div>
    );
  }

  const videoUrl = content.video_url || content.trailer_url;
  const categories = content.genre?.split(",").map(g => g.trim()) || [];
  const currentTime = (progress / 100) * duration;
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      {showVideo ? (
        <div className="h-screen w-full bg-black relative overflow-hidden pt-16">
          <div className="absolute inset-0 bg-black z-0 flex items-center justify-center mt-16">
            <div className="w-full h-full max-h-[calc(100vh-64px)]">
              <ReactPlayer
                ref={playerRef}
                url={videoUrl || ""}
                playing={isPlaying}
                controls
                width="100%"
                height="100%"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onProgress={handleProgress}
                onDuration={handleDuration}
                progressInterval={1000}
                config={{
                  vimeo: {
                    playerOptions: {
                      quality: '1080p',
                    }
                  }
                }}
              />
            </div>
          </div>
          
          {/* Back button */}
          <div className="absolute top-20 left-4 z-20">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-foreground bg-background/50 hover:bg-background/70"
              onClick={() => {
                saveProgress(progress);
                setShowVideo(false);
              }}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </div>

          {/* Progress Bar Overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <span>{formatTime(currentTime)}</span>
              <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {Math.round(progress)}% watched • Progress saved automatically
            </p>
          </div>
        </div>
      ) : (
        <div className="pt-24 pb-16">
          {/* Hero section */}
          <div className="relative h-[500px] w-full">
            <img 
              src={content.backdrop_url || content.poster_url || "/placeholder.svg"}
              alt={content.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <Button 
                onClick={playVideo} 
                className="bg-primary/80 hover:bg-primary h-16 w-16 rounded-full flex items-center justify-center"
              >
                <Play className="h-8 w-8 fill-current" />
              </Button>
            </div>

            {/* Resume progress indicator */}
            {progress > 0 && progress < 100 && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-background/90 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Resume watching</span>
                    <span className="text-xs text-muted-foreground">{Math.round(progress)}% complete</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Movie info */}
          <div className="container mx-auto px-4 md:px-6 mt-6">
            <h1 className="text-4xl font-bold mb-4">{content.title}</h1>
            
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star}
                  className={`h-4 w-4 ${star <= (parseFloat(content.rating || "0") / 2) ? "fill-primary text-primary" : "text-muted-foreground"}`}
                />
              ))}
              <span className="ml-2 text-sm">{content.rating || "N/A"}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-6">
              {content.release_year && <span>{content.release_year}</span>}
              {content.duration && (
                <>
                  <span>•</span>
                  <span>{content.duration}</span>
                </>
              )}
              {categories.length > 0 && (
                <>
                  <span>•</span>
                  {categories.map((cat, index) => (
                    <span key={cat}>
                      {cat}{index < categories.length - 1 ? "," : ""}
                    </span>
                  ))}
                </>
              )}
              {content.maturity_rating && (
                <>
                  <span>•</span>
                  <span className="bg-muted px-2 py-0.5 rounded">{content.maturity_rating}</span>
                </>
              )}
            </div>
            
            <p className="text-muted-foreground mb-8">
              {content.description || "No description available."}
            </p>
            
            {(content.cast_members || content.creator) && (
              <div className="mb-8">
                {content.cast_members && content.cast_members.length > 0 && (
                  <div className="mb-2">
                    <span className="text-muted-foreground font-medium">Cast: </span>
                    <span>{content.cast_members.join(", ")}</span>
                  </div>
                )}
                {content.creator && (
                  <div>
                    <span className="text-muted-foreground font-medium">Creator: </span>
                    <span>{content.creator}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Recommended content */}
            {recommendedContent.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">Recommended For You</h2>
                <div className="relative">
                  <div className="flex overflow-x-auto scrollbar-hide pb-4 gap-4">
                    {recommendedContent.map((rec) => (
                      <div 
                        key={rec.id}
                        className={`flex-none transition-all duration-300 ease-in-out ${
                          hoveredId === rec.id ? "w-[350px]" : "w-[180px]"
                        }`}
                        onMouseEnter={() => setHoveredId(rec.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {hoveredId === rec.id ? (
                          <div className="h-full w-full bg-card rounded-lg overflow-hidden border border-border shadow-xl animate-fade-in">
                            <div className="relative">
                              {rec.trailer_url || rec.video_url ? (
                                <ReactPlayer
                                  url={rec.trailer_url || rec.video_url || ""}
                                  playing
                                  muted
                                  loop
                                  width="100%"
                                  height="200px"
                                  config={{
                                    vimeo: {
                                      playerOptions: {
                                        background: true,
                                      }
                                    }
                                  }}
                                />
                              ) : (
                                <img 
                                  src={rec.poster_url || "/placeholder.svg"}
                                  alt={rec.title}
                                  className="w-full aspect-video object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                              
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <h3 className="font-bold text-foreground truncate mb-3">{rec.title}</h3>
                                
                                <div className="flex space-x-2">
                                  <Link to={`/watch/${rec.id}`}>
                                    <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-full px-4">
                                      <Play className="h-4 w-4 mr-1 fill-current" />
                                      Watch
                                    </Button>
                                  </Link>
                                  <Link to={`/watch/${rec.id}`}>
                                    <Button variant="outline" size="sm" className="rounded-full border-muted-foreground/50 hover:bg-muted px-4">
                                      <Info className="h-4 w-4 mr-1" />
                                      Detail
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Link to={`/watch/${rec.id}`} className="block relative cursor-pointer overflow-hidden">
                            <div className="aspect-[2/3] overflow-hidden rounded-md">
                              <img 
                                src={rec.poster_url || "/placeholder.svg"}
                                alt={rec.title}
                                className="w-full h-full object-cover hover:scale-105 transition duration-300"
                              />
                            </div>
                            <h3 className="mt-2 text-sm font-medium truncate">{rec.title}</h3>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Reviews section */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Add a review</h2>
              <p className="text-sm text-muted-foreground mb-4">Your email address will not be published. Required fields are marked *</p>
              
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
                          className={`h-5 w-5 ${star <= reviewRating ? "fill-primary text-primary" : "text-muted-foreground"}`}
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
                    className="h-32 bg-muted border-border text-foreground"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm mb-2">Name *</div>
                    <Input 
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="bg-muted border-border text-foreground"
                    />
                  </div>
                  <div>
                    <div className="text-sm mb-2">Email *</div>
                    <Input 
                      value={reviewEmail}
                      onChange={(e) => setReviewEmail(e.target.value)}
                      type="email"
                      className="bg-muted border-border text-foreground"
                    />
                  </div>
                </div>
                
                <Button type="submit" className="bg-primary hover:bg-primary/90">Submit</Button>
              </form>
            </div>
            
            {/* Display reviews */}
            {reviews.length > 0 && (
              <div className="mb-12">
                {reviews.map(review => (
                  <Card key={review.id} className="bg-card border-border mb-4 p-4">
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
                        <div className="text-xs text-muted-foreground">{review.date}</div>
                      </div>
                    </div>
                    
                    <div className="flex mb-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star}
                          className={`h-4 w-4 ${star <= review.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                    
                    <p className="text-muted-foreground">{review.text}</p>
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