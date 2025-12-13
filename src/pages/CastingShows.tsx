import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import BrowseFooter from '@/components/BrowseFooter';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Calendar, DollarSign, Users, Clapperboard } from 'lucide-react';
import { format } from 'date-fns';

interface CastingShow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  logline: string | null;
  poster_url: string | null;
  filming_location: string | null;
  pay_range_min: number | null;
  pay_range_max: number | null;
  status: string;
  deadline: string | null;
  is_featured: boolean | null;
  talent_roles_count?: number;
  crew_roles_count?: number;
}

export default function CastingShows() {
  const navigate = useNavigate();
  const [shows, setShows] = useState<CastingShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [payFilter, setPayFilter] = useState('all');

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    try {
      const { data: showsData, error } = await supabase
        .from('casting_shows')
        .select('*')
        .eq('status', 'open')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get role counts for each show
      const showsWithCounts = await Promise.all(
        (showsData || []).map(async (show) => {
          const { count: talentCount } = await supabase
            .from('casting_roles')
            .select('*', { count: 'exact', head: true })
            .eq('show_id', show.id)
            .eq('role_type', 'talent')
            .eq('status', 'open');

          const { count: crewCount } = await supabase
            .from('casting_roles')
            .select('*', { count: 'exact', head: true })
            .eq('show_id', show.id)
            .eq('role_type', 'crew')
            .eq('status', 'open');

          return {
            ...show,
            talent_roles_count: talentCount || 0,
            crew_roles_count: crewCount || 0,
          };
        })
      );

      setShows(showsWithCounts);
    } catch (error) {
      console.error('Error fetching shows:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredShows = shows.filter((show) => {
    const matchesSearch = show.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      show.logline?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = locationFilter === 'all' || 
      show.filming_location?.toLowerCase().includes(locationFilter.toLowerCase());
    
    const matchesPay = payFilter === 'all' ||
      (payFilter === 'paid' && (show.pay_range_min || 0) > 0) ||
      (payFilter === 'unpaid' && (!show.pay_range_min || show.pay_range_min === 0));

    return matchesSearch && matchesLocation && matchesPay;
  });

  const featuredShows = filteredShows.filter(s => s.is_featured);
  const regularShows = filteredShows.filter(s => !s.is_featured);

  const formatPayRange = (min: number | null, max: number | null) => {
    if (!min && !max) return 'TBD';
    if (min === 0 && max === 0) return 'Unpaid';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return 'TBD';
  };

  const ShowCard = ({ show, featured = false }: { show: CastingShow; featured?: boolean }) => (
    <div 
      className={`group relative bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${featured ? 'md:col-span-2' : ''}`}
      onClick={() => navigate(`/casting/shows/${show.slug}`)}
    >
      <div className={`relative ${featured ? 'h-64' : 'h-48'} overflow-hidden`}>
        {show.poster_url ? (
          <img 
            src={show.poster_url} 
            alt={show.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Clapperboard className="w-16 h-16 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Pay badge */}
        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
          <DollarSign className="w-3 h-3 mr-1" />
          {formatPayRange(show.pay_range_min, show.pay_range_max)}
        </Badge>

        {featured && (
          <Badge className="absolute top-3 left-3 bg-amber-500 text-black">
            Featured
          </Badge>
        )}
      </div>

      <div className="p-5">
        <h3 className={`font-bold text-foreground mb-2 ${featured ? 'text-2xl' : 'text-lg'}`}>
          {show.title}
        </h3>
        
        {show.logline && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {show.logline}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {show.filming_location && (
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 mr-1" />
              {show.filming_location}
            </div>
          )}
          {show.deadline && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1" />
              Deadline: {format(new Date(show.deadline), 'MMM d, yyyy')}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {(show.talent_roles_count || 0) > 0 && (
            <Badge variant="secondary" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              {show.talent_roles_count} Talent Role{show.talent_roles_count !== 1 ? 's' : ''}
            </Badge>
          )}
          {(show.crew_roles_count || 0) > 0 && (
            <Badge variant="outline" className="text-xs">
              <Clapperboard className="w-3 h-3 mr-1" />
              {show.crew_roles_count} Crew Role{show.crew_roles_count !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8 pt-24">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-3">Shows We're Casting</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Browse open casting opportunities across our productions. Apply to multiple roles and shows.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="atlanta">Atlanta</SelectItem>
              <SelectItem value="los angeles">Los Angeles</SelectItem>
              <SelectItem value="new york">New York</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
            </SelectContent>
          </Select>

          <Select value={payFilter} onValueChange={setPayFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Compensation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid Only</SelectItem>
              <SelectItem value="unpaid">Unpaid/Deferred</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => navigate('/talent/edit')}>
            Create Profile
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredShows.length === 0 ? (
          <div className="text-center py-20">
            <Clapperboard className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No shows found</h3>
            <p className="text-muted-foreground">Check back soon for new casting opportunities.</p>
          </div>
        ) : (
          <>
            {/* Featured Shows */}
            {featuredShows.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-5">Featured Castings</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredShows.map((show) => (
                    <ShowCard key={show.id} show={show} featured />
                  ))}
                </div>
              </div>
            )}

            {/* All Shows */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-5">All Open Castings</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {regularShows.map((show) => (
                  <ShowCard key={show.id} show={show} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <BrowseFooter />
    </div>
  );
}
