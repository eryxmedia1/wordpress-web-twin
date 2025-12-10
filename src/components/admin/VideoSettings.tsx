import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VideoUrlInput } from "@/components/VideoUrlInput";
import { VideoMetadata } from "@/hooks/useVideoMetadata";

interface Subtitle {
  language: string;
  vttFile?: string;
  vttUrl?: string;
}

interface CrewMember {
  name: string;
  role: string;
}

interface VideoSource {
  name: string;
  url: string;
  quality: string;
}

interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
}

interface VideoSettingsProps {
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
  trailerUrl: string;
  onTrailerUrlChange: (url: string) => void;
  posterUrl: string;
  onPosterUrlChange: (url: string) => void;
  backdropUrl: string;
  onBackdropUrlChange: (url: string) => void;
  logoUrl: string;
  onLogoUrlChange: (url: string) => void;
  vastAdPreroll: string;
  onVastAdPrerollChange: (url: string) => void;
  vastAdMidroll: string;
  onVastAdMidrollChange: (url: string) => void;
  vastAdPostroll: string;
  onVastAdPostrollChange: (url: string) => void;
  // Extended fields
  subtitles: Subtitle[];
  onSubtitlesChange: (subtitles: Subtitle[]) => void;
  castMembers: string[];
  onCastMembersChange: (cast: string[]) => void;
  crewMembers: CrewMember[];
  onCrewMembersChange: (crew: CrewMember[]) => void;
  videoSources: VideoSource[];
  onVideoSourcesChange: (sources: VideoSource[]) => void;
  isAffiliateUrl: boolean;
  onIsAffiliateUrlChange: (value: boolean) => void;
  downloadEnabled: boolean;
  onDownloadEnabledChange: (value: boolean) => void;
  downloadUrl: string;
  onDownloadUrlChange: (url: string) => void;
  selectedPlans: string[];
  onSelectedPlansChange: (plans: string[]) => void;
  onVimeoMetadataFetched?: (metadata: VideoMetadata) => void;
}

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese",
  "Japanese", "Korean", "Chinese", "Hindi", "Arabic", "Russian"
];

const CREW_ROLES = [
  "Director", "Producer", "Writer", "Cinematographer", "Editor",
  "Composer", "Production Designer", "Costume Designer", "Makeup Artist"
];

const VIDEO_QUALITIES = ["4K", "1080p", "720p", "480p", "360p"];

export const DEFAULT_MIDROLL_URL = "https://servedby.aqua-adserver.com/fc.php?script=apVideo:vast2&zoneid=12154";

export const VideoSettings = ({
  videoUrl,
  onVideoUrlChange,
  trailerUrl,
  onTrailerUrlChange,
  posterUrl,
  onPosterUrlChange,
  backdropUrl,
  onBackdropUrlChange,
  logoUrl,
  onLogoUrlChange,
  vastAdPreroll,
  onVastAdPrerollChange,
  vastAdMidroll,
  onVastAdMidrollChange,
  vastAdPostroll,
  onVastAdPostrollChange,
  subtitles,
  onSubtitlesChange,
  castMembers,
  onCastMembersChange,
  crewMembers,
  onCrewMembersChange,
  videoSources,
  onVideoSourcesChange,
  isAffiliateUrl,
  onIsAffiliateUrlChange,
  downloadEnabled,
  onDownloadEnabledChange,
  downloadUrl,
  onDownloadUrlChange,
  selectedPlans,
  onSelectedPlansChange,
  onVimeoMetadataFetched,
}: VideoSettingsProps) => {
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [castInput, setCastInput] = useState("");
  const [crewInput, setCrewInput] = useState({ name: "", role: "Director" });
  const [sourceInput, setSourceInput] = useState({ name: "", url: "", quality: "1080p" });
  const [subtitleInput, setSubtitleInput] = useState({ language: "English", vttUrl: "" });

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from("membership_plans")
        .select("id, name, slug")
        .order("sort_order");
      if (data) setMembershipPlans(data);
    };
    fetchPlans();
  }, []);

  const togglePlan = (planId: string) => {
    if (selectedPlans.includes(planId)) {
      onSelectedPlansChange(selectedPlans.filter(id => id !== planId));
    } else {
      onSelectedPlansChange([...selectedPlans, planId]);
    }
  };

  const selectAllPlans = () => {
    onSelectedPlansChange(membershipPlans.map(p => p.id));
  };

  const selectNonePlans = () => {
    onSelectedPlansChange([]);
  };

  const addCastMember = () => {
    if (castInput.trim() && !castMembers.includes(castInput.trim())) {
      onCastMembersChange([...castMembers, castInput.trim()]);
      setCastInput("");
    }
  };

  const removeCastMember = (member: string) => {
    onCastMembersChange(castMembers.filter(m => m !== member));
  };

  const addCrewMember = () => {
    if (crewInput.name.trim()) {
      onCrewMembersChange([...crewMembers, { ...crewInput, name: crewInput.name.trim() }]);
      setCrewInput({ name: "", role: "Director" });
    }
  };

  const removeCrewMember = (index: number) => {
    onCrewMembersChange(crewMembers.filter((_, i) => i !== index));
  };

  const addVideoSource = () => {
    if (sourceInput.name.trim() && sourceInput.url.trim()) {
      onVideoSourcesChange([...videoSources, { ...sourceInput }]);
      setSourceInput({ name: "", url: "", quality: "1080p" });
    }
  };

  const removeVideoSource = (index: number) => {
    onVideoSourcesChange(videoSources.filter((_, i) => i !== index));
  };

  const addSubtitle = () => {
    if (subtitleInput.vttUrl.trim()) {
      onSubtitlesChange([...subtitles, { ...subtitleInput }]);
      setSubtitleInput({ language: "English", vttUrl: "" });
    }
  };

  const removeSubtitle = (index: number) => {
    onSubtitlesChange(subtitles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="main-video" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-gray-800 p-1">
          <TabsTrigger value="main-video" className="text-xs">Main Video</TabsTrigger>
          <TabsTrigger value="trailer" className="text-xs">Trailer</TabsTrigger>
          <TabsTrigger value="info" className="text-xs">Videos Info</TabsTrigger>
          <TabsTrigger value="cast" className="text-xs">Cast</TabsTrigger>
          <TabsTrigger value="crew" className="text-xs">Crew</TabsTrigger>
          <TabsTrigger value="sources" className="text-xs">Sources</TabsTrigger>
          <TabsTrigger value="download" className="text-xs">Download</TabsTrigger>
          <TabsTrigger value="ads" className="text-xs">Videos Ads</TabsTrigger>
          <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
        </TabsList>

        {/* Main Video Tab */}
        <TabsContent value="main-video" className="space-y-4 mt-4">
          <div>
            <Label className="text-white">Video URL (Vimeo or YouTube)</Label>
            <VideoUrlInput
              value={videoUrl}
              onChange={onVideoUrlChange}
              onMetadataFetched={onVimeoMetadataFetched}
              className="mt-1 bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={isAffiliateUrl}
              onCheckedChange={onIsAffiliateUrlChange}
            />
            <Label className="text-white">Is Affiliate URL?</Label>
          </div>

          {/* Subtitles */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-white">Subtitles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {subtitles.length > 0 && (
                <div className="space-y-2">
                  {subtitles.map((sub, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-700 p-2 rounded">
                      <span className="text-sm text-white flex-1">{sub.language}</span>
                      <span className="text-xs text-gray-400 truncate max-w-[200px]">{sub.vttUrl}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubtitle(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <select
                  value={subtitleInput.language}
                  onChange={(e) => setSubtitleInput({ ...subtitleInput, language: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white rounded p-2 text-sm"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <Input
                  placeholder="VTT URL"
                  value={subtitleInput.vttUrl}
                  onChange={(e) => setSubtitleInput({ ...subtitleInput, vttUrl: e.target.value })}
                  className="flex-1 bg-gray-700 border-gray-600 text-white"
                />
                <Button type="button" onClick={addSubtitle} size="sm" className="bg-primary">
                  Add Row
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trailer Tab */}
        <TabsContent value="trailer" className="space-y-4 mt-4">
          <div>
            <Label className="text-white">Trailer URL</Label>
            <Input
              type="url"
              value={trailerUrl}
              onChange={(e) => onTrailerUrlChange(e.target.value)}
              className="mt-1 bg-gray-700 border-gray-600 text-white"
              placeholder="https://example.com/trailer.mp4"
            />
          </div>
        </TabsContent>

        {/* Videos Info Tab */}
        <TabsContent value="info" className="space-y-4 mt-4">
          <div>
            <Label className="text-white">Poster/Thumbnail URL</Label>
            <Input
              type="url"
              value={posterUrl}
              onChange={(e) => onPosterUrlChange(e.target.value)}
              className="mt-1 bg-gray-700 border-gray-600 text-white"
              placeholder="https://example.com/poster.jpg"
            />
          </div>
          <div>
            <Label className="text-white">Backdrop URL (Banner)</Label>
            <Input
              type="url"
              value={backdropUrl}
              onChange={(e) => onBackdropUrlChange(e.target.value)}
              className="mt-1 bg-gray-700 border-gray-600 text-white"
              placeholder="https://example.com/backdrop.jpg"
            />
          </div>
          <div>
            <Label className="text-white">Logo/Title Card URL</Label>
            <Input
              type="url"
              value={logoUrl}
              onChange={(e) => onLogoUrlChange(e.target.value)}
              className="mt-1 bg-gray-700 border-gray-600 text-white"
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-gray-400 mt-1">Title logo image shown in hero and detail views</p>
          </div>
        </TabsContent>

        {/* Cast Tab */}
        <TabsContent value="cast" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {castMembers.map((member) => (
              <Badge
                key={member}
                variant="secondary"
                className="flex items-center gap-1 bg-gray-700"
              >
                {member}
                <button
                  type="button"
                  onClick={() => removeCastMember(member)}
                  className="ml-1 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add cast member name"
              value={castInput}
              onChange={(e) => setCastInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCastMember())}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Button type="button" onClick={addCastMember} className="bg-primary">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        {/* Crew Tab */}
        <TabsContent value="crew" className="space-y-4 mt-4">
          {crewMembers.length > 0 && (
            <div className="space-y-2">
              {crewMembers.map((crew, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-700 p-2 rounded">
                  <span className="text-sm text-white flex-1">{crew.name}</span>
                  <span className="text-xs text-gray-400">{crew.role}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCrewMember(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Crew member name"
              value={crewInput.name}
              onChange={(e) => setCrewInput({ ...crewInput, name: e.target.value })}
              className="flex-1 bg-gray-700 border-gray-600 text-white"
            />
            <select
              value={crewInput.role}
              onChange={(e) => setCrewInput({ ...crewInput, role: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white rounded p-2"
            >
              {CREW_ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <Button type="button" onClick={addCrewMember} className="bg-primary">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4 mt-4">
          {videoSources.length > 0 && (
            <div className="space-y-2">
              {videoSources.map((source, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-700 p-2 rounded">
                  <span className="text-sm text-white">{source.name}</span>
                  <Badge variant="outline" className="text-xs">{source.quality}</Badge>
                  <span className="text-xs text-gray-400 truncate flex-1">{source.url}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVideoSource(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Source name"
              value={sourceInput.name}
              onChange={(e) => setSourceInput({ ...sourceInput, name: e.target.value })}
              className="w-32 bg-gray-700 border-gray-600 text-white"
            />
            <Input
              placeholder="Video URL"
              value={sourceInput.url}
              onChange={(e) => setSourceInput({ ...sourceInput, url: e.target.value })}
              className="flex-1 bg-gray-700 border-gray-600 text-white"
            />
            <select
              value={sourceInput.quality}
              onChange={(e) => setSourceInput({ ...sourceInput, quality: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white rounded p-2"
            >
              {VIDEO_QUALITIES.map(q => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
            <Button type="button" onClick={addVideoSource} className="bg-primary">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        {/* Download Tab */}
        <TabsContent value="download" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={downloadEnabled}
              onCheckedChange={onDownloadEnabledChange}
            />
            <Label className="text-white">Enable Download</Label>
          </div>
          {downloadEnabled && (
            <div>
              <Label className="text-white">Download URL</Label>
              <Input
                type="url"
                value={downloadUrl}
                onChange={(e) => onDownloadUrlChange(e.target.value)}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                placeholder="https://example.com/download.mp4"
              />
            </div>
          )}
        </TabsContent>

        {/* Video Ads Tab */}
        <TabsContent value="ads" className="space-y-4 mt-4">
          <div>
            <Label className="text-white">Pre-roll Ad URL (VAST)</Label>
            <Input
              type="url"
              value={vastAdPreroll}
              onChange={(e) => onVastAdPrerollChange(e.target.value)}
              className="mt-1 bg-gray-700 border-gray-600 text-white"
              placeholder="https://example.com/ads/preroll.xml"
            />
          </div>
          <div>
            <Label className="text-white">Mid-roll Ad URL (VAST)</Label>
            <Input
              type="url"
              value={vastAdMidroll}
              onChange={(e) => onVastAdMidrollChange(e.target.value)}
              className="mt-1 bg-gray-700 border-gray-600 text-white"
              placeholder={DEFAULT_MIDROLL_URL}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 text-xs"
              onClick={() => onVastAdMidrollChange(DEFAULT_MIDROLL_URL)}
            >
              Use Default Midroll URL
            </Button>
          </div>
          <div>
            <Label className="text-white">Post-roll Ad URL (VAST)</Label>
            <Input
              type="url"
              value={vastAdPostroll}
              onChange={(e) => onVastAdPostrollChange(e.target.value)}
              className="mt-1 bg-gray-700 border-gray-600 text-white"
              placeholder="https://example.com/ads/postroll.xml"
            />
          </div>
        </TabsContent>

        {/* Videos Preview Tab */}
        <TabsContent value="preview" className="space-y-4 mt-4">
          <div className="text-center text-gray-400 py-8">
            {videoUrl ? (
              <div className="space-y-4">
                <p>Video URL: {videoUrl}</p>
                {posterUrl && (
                  <img src={posterUrl} alt="Poster preview" className="max-w-xs mx-auto rounded" />
                )}
              </div>
            ) : (
              <p>Add a video URL to preview</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Membership Plans Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="py-3">
          <CardTitle className="text-sm text-white flex items-center justify-between">
            Require Membership
            <div className="flex gap-2 text-xs font-normal">
              <button 
                type="button" 
                onClick={selectAllPlans}
                className="text-primary hover:underline"
              >
                All
              </button>
              <span className="text-gray-500">|</span>
              <button 
                type="button" 
                onClick={selectNonePlans}
                className="text-primary hover:underline"
              >
                None
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {membershipPlans.map((plan) => (
            <div key={plan.id} className="flex items-center gap-3">
              <Checkbox
                id={`plan-${plan.id}`}
                checked={selectedPlans.includes(plan.id)}
                onCheckedChange={() => togglePlan(plan.id)}
              />
              <label 
                htmlFor={`plan-${plan.id}`} 
                className="text-sm text-white cursor-pointer"
              >
                {plan.name}
              </label>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
