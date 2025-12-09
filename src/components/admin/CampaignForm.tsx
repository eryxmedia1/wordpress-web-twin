import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, X, Plus, Search } from "lucide-react";
import type { Campaign } from "./CampaignList";

const POSITIONS = ['pre_roll', 'mid_roll', 'post_roll', 'live_break'];
const MEMBERSHIP_TIERS = ['free', 'standard', 'premium'];
const DEVICE_TYPES = ['mobile', 'desktop', 'tv'];
const COUNTRIES = ['US', 'CA', 'UK', 'AU', 'DE', 'FR', 'JP', 'BR', 'MX', 'IN'];

interface Creative {
  id: string;
  name: string;
  duration_seconds: number;
  position_pre: boolean;
  position_mid: boolean;
  position_post: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: 'live' | 'indie';
}

interface Content {
  id: string;
  title: string;
  type: string;
}

interface CampaignCreative {
  creative_id: string;
  weight: number;
}

interface CampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  onSave: () => void;
}

export function CampaignForm({ open, onOpenChange, campaign, onSave }: CampaignFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [contentSearch, setContentSearch] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    status: 'draft' as 'draft' | 'active' | 'paused' | 'completed',
    priority: 5,
    start_at: null as Date | null,
    end_at: null as Date | null,
    max_impressions: null as number | null,
    max_impressions_per_day: null as number | null,
    max_impressions_per_user_per_day: null as number | null,
    notes: '',
  });

  const [allowedPositions, setAllowedPositions] = useState<string[]>(['pre_roll', 'mid_roll', 'post_roll']);
  const [allowedTiers, setAllowedTiers] = useState<string[]>(['free', 'standard']);
  const [targetDevices, setTargetDevices] = useState<string[]>([]);
  const [targetCountries, setTargetCountries] = useState<string[]>([]);
  const [targetRegions, setTargetRegions] = useState<string>('');
  const [targetCities, setTargetCities] = useState<string>('');
  const [targetPostalCodes, setTargetPostalCodes] = useState<string>('');

  const [selectedCreatives, setSelectedCreatives] = useState<CampaignCreative[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [selectedContentIds, setSelectedContentIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchData();
      if (campaign) {
        loadCampaign(campaign);
      } else {
        resetForm();
      }
    }
  }, [open, campaign]);

  const fetchData = async () => {
    const [creativesRes, liveChannelsRes, indieChannelsRes, contentsRes] = await Promise.all([
      supabase.from('ads').select('id, name, duration_seconds, position_pre, position_mid, position_post').eq('status', 'active'),
      supabase.from('live_channels').select('id, name').order('name'),
      supabase.from('indie_channels').select('id, name').eq('is_active', true).order('name'),
      supabase.from('contents').select('id, title, type').order('title').limit(200),
    ]);

    if (creativesRes.data) setCreatives(creativesRes.data);
    
    const allChannels: Channel[] = [
      ...(liveChannelsRes.data || []).map(c => ({ ...c, type: 'live' as const })),
      ...(indieChannelsRes.data || []).map(c => ({ ...c, type: 'indie' as const })),
    ];
    setChannels(allChannels);
    if (contentsRes.data) setContents(contentsRes.data);
  };

  const loadCampaign = async (c: Campaign) => {
    setFormData({
      name: c.name,
      status: c.status,
      priority: c.priority,
      start_at: c.start_at ? new Date(c.start_at) : null,
      end_at: c.end_at ? new Date(c.end_at) : null,
      max_impressions: c.max_impressions,
      max_impressions_per_day: null,
      max_impressions_per_user_per_day: null,
      notes: '',
    });
    setAllowedPositions(c.allowed_positions || ['pre_roll', 'mid_roll', 'post_roll']);
    setAllowedTiers(c.allowed_membership_tiers || ['free', 'standard']);

    // Load full campaign data
    const { data: fullCampaign } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', c.id)
      .single();

    if (fullCampaign) {
      setFormData(prev => ({
        ...prev,
        max_impressions_per_day: fullCampaign.max_impressions_per_day,
        max_impressions_per_user_per_day: fullCampaign.max_impressions_per_user_per_day,
        notes: fullCampaign.notes || '',
      }));
      setTargetDevices(fullCampaign.target_devices || []);
      setTargetCountries(fullCampaign.target_countries || []);
      setTargetRegions((fullCampaign.target_regions || []).join(', '));
      setTargetCities((fullCampaign.target_cities || []).join(', '));
      setTargetPostalCodes((fullCampaign.target_postal_codes || []).join(', '));
    }

    // Load creatives
    const { data: campaignCreatives } = await supabase
      .from('campaign_creatives')
      .select('creative_id, weight')
      .eq('campaign_id', c.id);
    if (campaignCreatives) setSelectedCreatives(campaignCreatives);

    // Load channels
    const { data: campaignChannels } = await supabase
      .from('campaign_channels')
      .select('channel_id')
      .eq('campaign_id', c.id);
    if (campaignChannels) setSelectedChannelIds(campaignChannels.map(cc => cc.channel_id));

    // Load content items
    const { data: campaignContent } = await supabase
      .from('campaign_content_items')
      .select('content_id')
      .eq('campaign_id', c.id);
    if (campaignContent) setSelectedContentIds(campaignContent.map(cc => cc.content_id));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      status: 'draft',
      priority: 5,
      start_at: null,
      end_at: null,
      max_impressions: null,
      max_impressions_per_day: null,
      max_impressions_per_user_per_day: null,
      notes: '',
    });
    setAllowedPositions(['pre_roll', 'mid_roll', 'post_roll']);
    setAllowedTiers(['free', 'standard']);
    setTargetDevices([]);
    setTargetCountries([]);
    setTargetRegions('');
    setTargetCities('');
    setTargetPostalCodes('');
    setSelectedCreatives([]);
    setSelectedChannelIds([]);
    setSelectedContentIds([]);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    setIsSaving(true);
    try {
      const campaignData = {
        name: formData.name,
        status: formData.status,
        priority: formData.priority,
        start_at: formData.start_at?.toISOString() || null,
        end_at: formData.end_at?.toISOString() || null,
        max_impressions: formData.max_impressions,
        max_impressions_per_day: formData.max_impressions_per_day,
        max_impressions_per_user_per_day: formData.max_impressions_per_user_per_day,
        allowed_positions: allowedPositions,
        allowed_membership_tiers: allowedTiers,
        target_devices: targetDevices,
        target_countries: targetCountries,
        target_regions: targetRegions.split(',').map(s => s.trim()).filter(Boolean),
        target_cities: targetCities.split(',').map(s => s.trim()).filter(Boolean),
        target_postal_codes: targetPostalCodes.split(',').map(s => s.trim()).filter(Boolean),
        notes: formData.notes,
        updated_at: new Date().toISOString(),
      };

      let campaignId: string;

      if (campaign) {
        await supabase.from('ad_campaigns').update(campaignData).eq('id', campaign.id);
        campaignId = campaign.id;
      } else {
        const { data, error } = await supabase.from('ad_campaigns').insert(campaignData).select().single();
        if (error) throw error;
        campaignId = data.id;
      }

      // Update creatives
      await supabase.from('campaign_creatives').delete().eq('campaign_id', campaignId);
      if (selectedCreatives.length > 0) {
        await supabase.from('campaign_creatives').insert(
          selectedCreatives.map(c => ({ campaign_id: campaignId, creative_id: c.creative_id, weight: c.weight }))
        );
      }

      // Update channels
      await supabase.from('campaign_channels').delete().eq('campaign_id', campaignId);
      if (selectedChannelIds.length > 0) {
        const channelInserts = selectedChannelIds.map(channelId => {
          const channel = channels.find(c => c.id === channelId);
          return { campaign_id: campaignId, channel_id: channelId, channel_type: channel?.type || 'live' };
        });
        await supabase.from('campaign_channels').insert(channelInserts);
      }

      // Update content items
      await supabase.from('campaign_content_items').delete().eq('campaign_id', campaignId);
      if (selectedContentIds.length > 0) {
        await supabase.from('campaign_content_items').insert(
          selectedContentIds.map(contentId => ({ campaign_id: campaignId, content_id: contentId }))
        );
      }

      toast.success(campaign ? 'Campaign updated' : 'Campaign created');
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save campaign');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePosition = (pos: string) => {
    setAllowedPositions(prev => 
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    );
  };

  const toggleTier = (tier: string) => {
    setAllowedTiers(prev => 
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    );
  };

  const toggleDevice = (device: string) => {
    setTargetDevices(prev => 
      prev.includes(device) ? prev.filter(d => d !== device) : [...prev, device]
    );
  };

  const toggleCountry = (country: string) => {
    setTargetCountries(prev => 
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
  };

  const addCreative = (creativeId: string) => {
    if (!selectedCreatives.find(c => c.creative_id === creativeId)) {
      setSelectedCreatives(prev => [...prev, { creative_id: creativeId, weight: 1 }]);
    }
  };

  const removeCreative = (creativeId: string) => {
    setSelectedCreatives(prev => prev.filter(c => c.creative_id !== creativeId));
  };

  const updateCreativeWeight = (creativeId: string, weight: number) => {
    setSelectedCreatives(prev => 
      prev.map(c => c.creative_id === creativeId ? { ...c, weight } : c)
    );
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannelIds(prev => 
      prev.includes(channelId) ? prev.filter(id => id !== channelId) : [...prev, channelId]
    );
  };

  const toggleContent = (contentId: string) => {
    setSelectedContentIds(prev => 
      prev.includes(contentId) ? prev.filter(id => id !== contentId) : [...prev, contentId]
    );
  };

  const filteredContents = contents.filter(c => 
    c.title.toLowerCase().includes(contentSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="caps">Caps</TabsTrigger>
            <TabsTrigger value="targeting">Targeting</TabsTrigger>
            <TabsTrigger value="creatives">Creatives</TabsTrigger>
            <TabsTrigger value="placement">Placement</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4">
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Holiday Sale Campaign"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority (1-10)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.priority]}
                      onValueChange={([v]) => setFormData(prev => ({ ...prev, priority: v }))}
                      min={1}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-8 text-center font-mono">{formData.priority}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left", !formData.start_at && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_at ? format(formData.start_at, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.start_at || undefined}
                        onSelect={(date) => setFormData(prev => ({ ...prev, start_at: date || null }))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left", !formData.end_at && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.end_at ? format(formData.end_at, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.end_at || undefined}
                        onSelect={(date) => setFormData(prev => ({ ...prev, end_at: date || null }))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Internal notes about this campaign..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="caps" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Max Total Impressions</Label>
                <Input
                  type="number"
                  value={formData.max_impressions || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_impressions: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="Leave empty for unlimited"
                />
                <p className="text-xs text-muted-foreground">Total impressions across all time. Campaign pauses when reached.</p>
              </div>

              <div className="space-y-2">
                <Label>Max Impressions Per Day</Label>
                <Input
                  type="number"
                  value={formData.max_impressions_per_day || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_impressions_per_day: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="Leave empty for unlimited"
                />
                <p className="text-xs text-muted-foreground">Daily impression cap. Resets at midnight UTC.</p>
              </div>

              <div className="space-y-2">
                <Label>Frequency Cap (Per User Per Day)</Label>
                <Input
                  type="number"
                  value={formData.max_impressions_per_user_per_day || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_impressions_per_user_per_day: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="Leave empty for unlimited"
                />
                <p className="text-xs text-muted-foreground">How many times a single user can see this campaign's ads per day.</p>
              </div>
            </TabsContent>

            <TabsContent value="targeting" className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label>Ad Positions</Label>
                <div className="flex flex-wrap gap-2">
                  {POSITIONS.map((pos) => (
                    <Badge
                      key={pos}
                      variant={allowedPositions.includes(pos) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => togglePosition(pos)}
                    >
                      {pos.replace('_', '-')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Membership Tiers</Label>
                <div className="flex flex-wrap gap-2">
                  {MEMBERSHIP_TIERS.map((tier) => (
                    <Badge
                      key={tier}
                      variant={allowedTiers.includes(tier) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTier(tier)}
                    >
                      {tier}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Select which membership tiers will see these ads.</p>
              </div>

              <div className="space-y-2">
                <Label>Device Types (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {DEVICE_TYPES.map((device) => (
                    <Badge
                      key={device}
                      variant={targetDevices.includes(device) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleDevice(device)}
                    >
                      {device}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Leave empty to target all devices.</p>
              </div>

              <div className="space-y-2">
                <Label>Countries (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map((country) => (
                    <Badge
                      key={country}
                      variant={targetCountries.includes(country) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCountry(country)}
                    >
                      {country}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Leave empty to target all countries.</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Regions/States</Label>
                  <Input
                    value={targetRegions}
                    onChange={(e) => setTargetRegions(e.target.value)}
                    placeholder="NY, CA, TX..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cities</Label>
                  <Input
                    value={targetCities}
                    onChange={(e) => setTargetCities(e.target.value)}
                    placeholder="New York, Los Angeles..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Postal Codes</Label>
                  <Input
                    value={targetPostalCodes}
                    onChange={(e) => setTargetPostalCodes(e.target.value)}
                    placeholder="10001, 90210..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="creatives" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Select Ad Creatives</Label>
                <Select onValueChange={addCreative}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an ad creative to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {creatives.filter(c => !selectedCreatives.find(sc => sc.creative_id === c.id)).map((creative) => (
                      <SelectItem key={creative.id} value={creative.id}>
                        {creative.name} ({creative.duration_seconds}s)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCreatives.length > 0 && (
                <div className="space-y-2">
                  <Label>Attached Creatives</Label>
                  <div className="border rounded-lg divide-y">
                    {selectedCreatives.map((sc) => {
                      const creative = creatives.find(c => c.id === sc.creative_id);
                      if (!creative) return null;
                      return (
                        <div key={sc.creative_id} className="flex items-center justify-between p-3">
                          <div>
                            <p className="font-medium">{creative.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {creative.duration_seconds}s • 
                              {creative.position_pre && ' Pre'}
                              {creative.position_mid && ' Mid'}
                              {creative.position_post && ' Post'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Weight:</Label>
                              <Input
                                type="number"
                                value={sc.weight}
                                onChange={(e) => updateCreativeWeight(sc.creative_id, parseInt(e.target.value) || 1)}
                                className="w-20"
                                min={1}
                              />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeCreative(sc.creative_id)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">Higher weight = more likely to be selected when this campaign runs.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="placement" className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label>Target Channels (optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">Select specific channels or leave empty for all channels.</p>
                <ScrollArea className="h-48 border rounded-lg p-2">
                  {channels.map((channel) => (
                    <div key={channel.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={channel.id}
                        checked={selectedChannelIds.includes(channel.id)}
                        onCheckedChange={() => toggleChannel(channel.id)}
                      />
                      <label htmlFor={channel.id} className="text-sm cursor-pointer">
                        {channel.name}
                        <Badge variant="outline" className="ml-2 text-xs">{channel.type}</Badge>
                      </label>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <Label>Target Content (optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">Select specific videos/shows or leave empty for all content.</p>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search content..."
                    value={contentSearch}
                    onChange={(e) => setContentSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="h-48 border rounded-lg p-2">
                  {filteredContents.map((content) => (
                    <div key={content.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={content.id}
                        checked={selectedContentIds.includes(content.id)}
                        onCheckedChange={() => toggleContent(content.id)}
                      />
                      <label htmlFor={content.id} className="text-sm cursor-pointer">
                        {content.title}
                        <Badge variant="outline" className="ml-2 text-xs">{content.type}</Badge>
                      </label>
                    </div>
                  ))}
                </ScrollArea>
                {selectedContentIds.length > 0 && (
                  <p className="text-sm text-muted-foreground">{selectedContentIds.length} items selected</p>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {campaign ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
