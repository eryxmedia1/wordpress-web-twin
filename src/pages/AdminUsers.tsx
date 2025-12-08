import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminNavbar from '@/components/AdminNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Crown, Users, Loader2, Check } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: string | null;
  created_at: string;
  is_admin: boolean | null;
  email?: string;
}

const TIERS = ['free', 'standard', 'premium'];

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateSubscriptionTier = async (userId: string, newTier: string) => {
    setSavingUserId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: newTier })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, subscription_tier: newTier } : user
      ));
      toast.success(`Subscription updated to ${newTier}`);
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    } finally {
      setSavingUserId(null);
    }
  };

  const getTierBadgeColor = (tier: string | null) => {
    switch (tier) {
      case 'premium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'standard':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTierIcon = (tier: string | null) => {
    if (tier === 'premium') return <Crown className="h-3 w-3" />;
    return null;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      !searchQuery || 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTier = filterTier === 'all' || user.subscription_tier === filterTier;
    
    return matchesSearch && matchesTier;
  });

  const stats = {
    total: users.length,
    free: users.filter(u => !u.subscription_tier || u.subscription_tier === 'free').length,
    standard: users.filter(u => u.subscription_tier === 'standard').length,
    premium: users.filter(u => u.subscription_tier === 'premium').length,
  };

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              User Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage user subscriptions and membership tiers
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-400">{stats.free}</div>
              <div className="text-sm text-muted-foreground">Free Tier</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.standard}</div>
              <div className="text-sm text-muted-foreground">Standard</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-amber-400">{stats.premium}</div>
              <div className="text-sm text-muted-foreground">Premium</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-[180px] bg-card border-border">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">User ID</TableHead>
                  <TableHead className="text-muted-foreground">Current Tier</TableHead>
                  <TableHead className="text-muted-foreground">Joined</TableHead>
                  <TableHead className="text-muted-foreground">Change Tier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            {user.avatar_url ? (
                              <img 
                                src={user.avatar_url} 
                                alt="" 
                                className="w-10 h-10 rounded-full object-cover" 
                              />
                            ) : (
                              <span className="text-primary font-medium">
                                {user.full_name?.[0]?.toUpperCase() || 'U'}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {user.full_name || 'Unknown User'}
                            </div>
                            {user.is_admin && (
                              <Badge variant="outline" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                                Admin
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {user.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`${getTierBadgeColor(user.subscription_tier)} flex items-center gap-1 w-fit`}
                        >
                          {getTierIcon(user.subscription_tier)}
                          {user.subscription_tier || 'free'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select 
                            value={user.subscription_tier || 'free'} 
                            onValueChange={(value) => updateSubscriptionTier(user.id, value)}
                            disabled={savingUserId === user.id}
                          >
                            <SelectTrigger className="w-[130px] bg-background border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIERS.map((tier) => (
                                <SelectItem key={tier} value={tier}>
                                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {savingUserId === user.id && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminUsers;
