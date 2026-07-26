import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminNavbar from "@/components/AdminNavbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Search, ExternalLink, Images, Upload, Trash2, Loader2, ArrowUp } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AssetPointer = {
  url: string;
  original_filename: string;
  size: number;
  content_type: string;
  created_at: string;
  storage_path?: string;
};

const BUCKET = "channel-logos";
const FOLDER = "media-library";

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

// Normalize filenames so punctuation/spacing differences don't break matching
// (e.g. "Cocks-Robbers-copy-1.jpg" matches "Cocks--Robbers-2.jpg" tokens).
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const AdminMediaLibrary = () => {
  const [query, setQuery] = useState("");
  const [uploaded, setUploaded] = useState<AssetPointer[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dupePrompt, setDupePrompt] = useState<{ duplicates: File[]; fresh: File[] } | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const loadUploaded = useCallback(async () => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(FOLDER, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
    if (error) return;
    const items = (data || [])
      .filter((f) => f.id)
      .map((f) => {
        const path = `${FOLDER}/${f.name}`;
        return {
          url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
          original_filename: f.name.replace(/^\d{13}-/, ""),
          size: (f.metadata as any)?.size ?? 0,
          content_type: (f.metadata as any)?.mimetype ?? "",
          created_at: f.created_at ?? "",
          storage_path: path,
        } as AssetPointer;
      });
    setUploaded(items);
  }, []);

  useEffect(() => {
    loadUploaded();
  }, [loadUploaded]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const allAssets = useMemo(() => [...uploaded, ...ASSETS], [uploaded]);

  const doUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setUploading(true);
      let ok = 0;
      for (const file of files) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
        const path = `${FOLDER}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { cacheControl: "31536000", upsert: false });
        if (error) {
          toast.error(`${file.name}: ${error.message}`);
        } else {
          ok++;
        }
      }
      setUploading(false);
      if (ok > 0) toast.success(`Uploaded ${ok} image${ok === 1 ? "" : "s"}`);
      loadUploaded();
    },
    [loadUploaded]
  );

  const uploadFiles = useCallback(
    (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) {
        toast.error("Please select image files");
        return;
      }
      const existing = new Set(
        allAssets.map((a) => a.original_filename.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase())
      );
      const duplicates = images.filter((f) =>
        existing.has(f.name.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase())
      );
      const fresh = images.filter((f) => !duplicates.includes(f));
      if (duplicates.length > 0) {
        setDupePrompt({ duplicates, fresh });
        return;
      }
      doUpload(images);
    },
    [allAssets, doUpload]
  );

  const removeUploaded = async (path: string) => {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      toast.error("Could not delete image");
      return;
    }
    toast.success("Image deleted");
    loadUploaded();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allAssets;
    const direct = allAssets.filter((a) => a.original_filename.toLowerCase().includes(q));
    if (direct.length > 0) return direct;

    // Fallback: token-based match on normalized names, ignoring noise words
    const tokens = normalize(q)
      .split(" ")
      .filter((t) => t.length > 1 && !["copy", "final", "new", "the", "and"].includes(t));
    if (tokens.length === 0) return [];
    return allAssets.filter((a) => {
      const name = normalize(a.original_filename);
      return tokens.some((t) => name.includes(t));
    });
  }, [query, allAssets]);

  const absoluteUrl = (url: string) =>
    url.startsWith("http") || typeof window === "undefined" ? url : `${window.location.origin}${url}`;

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(absoluteUrl(url));
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Could not copy URL");
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });


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

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              uploadFiles(Array.from(e.dataTransfer.files));
            }}
            className={`mb-6 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragging ? "border-primary bg-primary/5" : "border-border bg-card/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                uploadFiles(Array.from(e.target.files || []));
                e.target.value = "";
              }}
            />
            {uploading ? (
              <Loader2 className="h-8 w-8 mx-auto mb-3 text-primary animate-spin" />
            ) : (
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            )}
            <p className="text-sm text-foreground font-medium">
              {uploading ? "Uploading..." : "Drag & drop images here"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">You can upload multiple files at once</p>
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Images
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Showing {filtered.length} of {allAssets.length} images
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
                      {asset.storage_path && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => removeUploaded(asset.storage_path!)}
                          aria-label="Delete image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={!!dupePrompt} onOpenChange={(o) => !o && setDupePrompt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dupePrompt?.duplicates.length} duplicate file
              {dupePrompt?.duplicates.length === 1 ? "" : "s"} detected
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-2">
                  These files have the same name as images already in your library:
                </p>
                <ul className="max-h-40 overflow-y-auto text-xs list-disc pl-5 space-y-1">
                  {dupePrompt?.duplicates.map((f) => (
                    <li key={f.name}>{f.name}</li>
                  ))}
                </ul>
                <p className="mt-3">
                  {dupePrompt?.fresh.length
                    ? `${dupePrompt.fresh.length} other file(s) are new and will be uploaded either way.`
                    : "No other new files were selected."}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDupePrompt(null)}>Cancel</AlertDialogCancel>
            <Button
              variant="secondary"
              onClick={() => {
                const fresh = dupePrompt?.fresh ?? [];
                setDupePrompt(null);
                if (fresh.length) doUpload(fresh);
                else toast.info("Nothing to upload — all files were duplicates");
              }}
            >
              Skip duplicates
            </Button>
            <AlertDialogAction
              onClick={() => {
                const all = [...(dupePrompt?.fresh ?? []), ...(dupePrompt?.duplicates ?? [])];
                setDupePrompt(null);
                doUpload(all);
              }}
            >
              Upload anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );

};

export default AdminMediaLibrary;
