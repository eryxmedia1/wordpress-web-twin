import { useMemo, useState } from "react";
import AdminNavbar from "@/components/AdminNavbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, Search, ExternalLink, Images } from "lucide-react";

type AssetPointer = {
  url: string;
  original_filename: string;
  size: number;
  content_type: string;
  created_at: string;
};

const modules = import.meta.glob("../assets/media-library/*.asset.json", {
  eager: true,
}) as Record<string, { default: AssetPointer } | AssetPointer>;

const ASSETS: AssetPointer[] = Object.values(modules)
  .map((m) => ("default" in (m as any) ? (m as any).default : m) as AssetPointer)
  .filter((a) => a && a.url)
  .sort((a, b) => a.original_filename.localeCompare(b.original_filename, undefined, { numeric: true }));

const formatSize = (bytes: number) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AdminMediaLibrary = () => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ASSETS;
    return ASSETS.filter((a) => a.original_filename.toLowerCase().includes(q));
  }, [query]);

  const absoluteUrl = (url: string) =>
    typeof window !== "undefined" ? `${window.location.origin}${url}` : url;

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(absoluteUrl(url));
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Could not copy URL");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <main className="pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Images className="h-7 w-7 text-primary" />
                Media Library
              </h1>
              <p className="text-muted-foreground mt-1">
                Your private artwork storage — preview any image and copy its URL for use anywhere on the site.
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by filename..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Showing {filtered.length} of {ASSETS.length} images
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No images match your search.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((asset) => (
                <Card key={asset.url} className="bg-card border-border overflow-hidden group">
                  <div className="aspect-video bg-muted/30 flex items-center justify-center overflow-hidden">
                    <img
                      src={asset.url}
                      alt={asset.original_filename}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground truncate" title={asset.original_filename}>
                      {asset.original_filename}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatSize(asset.size)}</p>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 h-8 text-xs"
                        onClick={() => copy(asset.url)}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copy URL
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                        <a href={asset.url} target="_blank" rel="noreferrer" aria-label="Open image in new tab">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminMediaLibrary;
