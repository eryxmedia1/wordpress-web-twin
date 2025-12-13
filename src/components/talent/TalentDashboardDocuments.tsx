import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, FileText, Download, Film, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { UserDocument } from "@/types/casting";

interface TalentDashboardDocumentsProps {
  userId: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  script: "Script",
  sides: "Sides",
  call_sheet: "Call Sheet",
  release: "Release Form",
  contract: "Contract",
  other: "Other"
};

const DOCUMENT_TYPE_ICONS: Record<string, string> = {
  script: "📜",
  sides: "📄",
  call_sheet: "📋",
  release: "📝",
  contract: "📃",
  other: "📎"
};

export function TalentDashboardDocuments({ userId }: TalentDashboardDocumentsProps) {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const fetchDocuments = async () => {
    const { data } = await supabase
      .from("user_documents")
      .select("*, casting_shows(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setDocuments((data as any[]) || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  // Group by show
  const groupedDocs = documents.reduce((acc, doc) => {
    const showTitle = doc.casting_shows?.title || "General";
    if (!acc[showTitle]) acc[showTitle] = [];
    acc[showTitle].push(doc);
    return acc;
  }, {} as Record<string, UserDocument[]>);

  return (
    <div className="space-y-6">
      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-2" />
            <p>No documents yet</p>
            <p className="text-sm">Scripts, call sheets, and releases will appear here</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedDocs).map(([showTitle, docs]) => (
          <div key={showTitle}>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Film className="h-5 w-5" />
              {showTitle}
            </h3>
            <div className="space-y-2">
              {docs.map(doc => (
                <Card key={doc.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{DOCUMENT_TYPE_ICONS[doc.document_type]}</span>
                        <div>
                          <h4 className="font-medium">{doc.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{DOCUMENT_TYPE_LABELS[doc.document_type]}</Badge>
                            <span>Added {format(new Date(doc.created_at), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.file_url} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
