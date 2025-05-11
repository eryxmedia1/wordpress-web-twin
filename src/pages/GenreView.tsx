
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ContentRow from "@/components/ContentRow";
import GenresList from "@/components/GenresList";

// Mock data that would come from your backend in production
const genreMoviesMap = {
  action: [
    { 
      id: "1", 
      title: "John Wick 4", 
      posterUrl: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
      rating: "8.2",
      year: "2023",
      category: "Action/Thriller"
    },
    { 
      id: "12", 
      title: "The White House Down", 
      posterUrl: "https://image.tmdb.org/t/p/w500/1jcLMx9U5yChTrMPzGRVF2iw4CL.jpg",
      rating: "7.3",
      year: "2023",
      category: "Action/Thriller"
    },
  ],
  comedy: [
    { 
      id: "3", 
      title: "The White Lotus", 
      posterUrl: "https://image.tmdb.org/t/p/w500/cBl6XTth52P9Rib0cCaPG0r1EGT.jpg",
      rating: "8.7",
      year: "2022",
      category: "Drama/Comedy"
    },
    { 
      id: "10", 
      title: "The Holdovers", 
      posterUrl: "https://image.tmdb.org/t/p/w500/hUu9zyZmDd8VZegKi1iK1Vk0RYS.jpg",
      rating: "8.5",
      year: "2023",
      category: "Drama/Comedy"
    },
  ],
  drama: [
    { 
      id: "4", 
      title: "The Post", 
      posterUrl: "https://image.tmdb.org/t/p/w500/qyRwj5VvuTRdJ76o2grP93grNxt.jpg",
      rating: "7.5",
      year: "2018",
      category: "Drama/Historical"
    },
    { 
      id: "5", 
      title: "In the Air", 
      posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      rating: "8.0",
      year: "2021",
      category: "Drama"
    },
  ],
  horror: [
    { 
      id: "101", 
      title: "The Silent Path", 
      posterUrl: "https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd1.jpg",
      year: "2024",
      category: "Horror/Thriller",
      rating: "7.8"
    },
  ],
  thriller: [
    { 
      id: "14", 
      title: "The Sleeping Angel", 
      posterUrl: "https://image.tmdb.org/t/p/w500/8xV47NDrjdZDpYUtcKYNLvbGTrI.jpg",
      rating: "6.9",
      year: "2023",
      category: "Thriller/Mystery"
    },
  ],
};

// Default genres for all other categories not specified above
const defaultGenreMovies = [
  { 
    id: "22", 
    title: "Oppenheimer", 
    posterUrl: "https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg",
    rating: "9.0",
    year: "2023",
    category: "Drama/Historical"
  },
  { 
    id: "31", 
    title: "Shogun", 
    posterUrl: "https://image.tmdb.org/t/p/w500/x15pCJmxmJ9fK7VwFzXyGbQpVYQ.jpg",
    rating: "9.1",
    year: "2024",
    category: "Drama/Historical"
  },
];

const GenreView = () => {
  const { genreId } = useParams<{ genreId: string }>();
  const [movies, setMovies] = useState<any[]>([]);
  
  useEffect(() => {
    if (genreId && genreId in genreMoviesMap) {
      setMovies(genreMoviesMap[genreId as keyof typeof genreMoviesMap]);
    } else {
      setMovies(defaultGenreMovies);
    }
  }, [genreId]);
  
  return (
    <div className="min-h-screen bg-[#0F0F1F] text-white">
      <Navbar />
      
      <main className="pt-32 pb-16 px-4 md:px-8">
        <h1 className="text-4xl font-bold mb-6 capitalize">
          {genreId || "All Genres"}
        </h1>
        
        <GenresList className="mb-10" />
        
        {movies.length > 0 ? (
          <ContentRow 
            title={`${genreId ? `${genreId.charAt(0).toUpperCase()}${genreId.slice(1)}` : 'Featured'} Movies`}
            contents={movies}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400">No movies found in this genre.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default GenreView;
