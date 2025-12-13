import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MapPin, Mail, Phone, Globe, Instagram, CheckCircle, AlertCircle } from "lucide-react";

interface TalentDashboardProfileProps {
  talent: any;
  onUpdate: () => void;
}

export function TalentDashboardProfile({ talent, onUpdate }: TalentDashboardProfileProps) {
  const completeness = talent?.profile_completeness || 0;
  const isCrew = talent?.applicant_type === "crew";

  const missingFields = [];
  if (!talent?.primary_photo_url) missingFields.push("Primary Photo");
  if (!talent?.bio) missingFields.push("Bio");
  if (!talent?.video_reel_url) missingFields.push("Video Reel");
  if (isCrew && !talent?.crew_primary_role) missingFields.push("Primary Role");
  if (!isCrew && !talent?.height) missingFields.push("Physical Attributes");

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left - Profile Overview */}
      <div className="lg:col-span-2 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-6">
              <div className="relative">
                {talent?.primary_photo_url ? (
                  <img
                    src={talent.primary_photo_url}
                    alt={talent.name}
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center">
                    <span className="text-4xl">{talent?.name?.[0]}</span>
                  </div>
                )}
                {talent?.is_approved && (
                  <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{talent?.name}</h2>
                  {talent?.is_featured && <Badge variant="secondary">Featured</Badge>}
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                  {talent?.city && talent?.state && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {talent.city}, {talent.state}
                    </div>
                  )}
                  {talent?.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {talent.email}
                    </div>
                  )}
                  {talent?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {talent.phone}
                    </div>
                  )}
                </div>

                <p className="text-muted-foreground line-clamp-3">{talent?.bio}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {isCrew ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Primary Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{talent?.crew_primary_role || "Not set"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{talent?.crew_years_experience || 0} years</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Secondary Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {talent?.crew_secondary_roles?.length > 0 ? (
                      talent.crew_secondary_roles.map((role: string) => (
                        <Badge key={role} variant="outline">{role}</Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">None specified</span>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Software</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {talent?.crew_software?.length > 0 ? (
                      talent.crew_software.map((sw: string) => (
                        <Badge key={sw} variant="outline">{sw}</Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">None specified</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Physical</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Height:</span> {talent?.height || "-"}</div>
                  <div><span className="text-muted-foreground">Weight:</span> {talent?.weight || "-"}</div>
                  <div><span className="text-muted-foreground">Hair:</span> {talent?.hair_color || "-"}</div>
                  <div><span className="text-muted-foreground">Eyes:</span> {talent?.eye_color || "-"}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Age Range</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{talent?.age_range || "Not set"}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Skills */}
        {talent?.skills_tags?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Skills & Specialties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {talent.skills_tags.map((skill: string) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social & Portfolio Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {talent?.website_url && (
                <a href={talent.website_url} target="_blank" rel="noopener" className="flex items-center gap-2 text-primary hover:underline">
                  <Globe className="h-4 w-4" /> Website
                </a>
              )}
              {talent?.instagram_url && (
                <a href={talent.instagram_url} target="_blank" rel="noopener" className="flex items-center gap-2 text-primary hover:underline">
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              )}
              {talent?.imdb_url && (
                <a href={talent.imdb_url} target="_blank" rel="noopener" className="flex items-center gap-2 text-primary hover:underline">
                  IMDb
                </a>
              )}
              {talent?.portfolio_url && (
                <a href={talent.portfolio_url} target="_blank" rel="noopener" className="flex items-center gap-2 text-primary hover:underline">
                  Portfolio
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right - Profile Completeness */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Completeness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-2xl font-bold">{completeness}%</span>
                <span className="text-muted-foreground">
                  {completeness >= 80 ? "Great!" : completeness >= 50 ? "Getting there" : "Needs work"}
                </span>
              </div>
              <Progress value={completeness} className="h-3" />
            </div>

            {missingFields.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Missing Information
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {missingFields.map(field => (
                    <li key={field}>• {field}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Approval Status</span>
              <Badge variant={talent?.is_approved ? "default" : "secondary"}>
                {talent?.is_approved ? "Approved" : "Pending Review"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Profile Active</span>
              <Badge variant={talent?.is_active ? "default" : "secondary"}>
                {talent?.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Member Since</span>
              <span className="text-sm">{new Date(talent?.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {talent?.willing_to_travel ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                Willing to Travel
              </div>
              <div className="flex items-center gap-2">
                {talent?.has_passport ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                Has Passport
              </div>
              <div className="flex items-center gap-2">
                {talent?.has_drivers_license ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                Has Driver's License
              </div>
            </div>
            {talent?.availability_notes && (
              <p className="mt-3 text-muted-foreground text-sm">{talent.availability_notes}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
