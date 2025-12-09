import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, X } from "lucide-react";

interface IndieLimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: "videos" | "rows";
  currentCount: number;
  maxCount: number;
}

const IndieLimitReachedModal = ({
  isOpen,
  onClose,
  limitType,
  currentCount,
  maxCount,
}: IndieLimitReachedModalProps) => {
  const limitText = limitType === "videos" ? "videos" : "content rows";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
          </div>
          <DialogTitle className="text-center text-xl">
            Limit Reached
          </DialogTitle>
          <DialogDescription className="text-center">
            You've reached your maximum limit of {maxCount} {limitText}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Current Usage</span>
              <span className="font-bold text-primary">
                {currentCount} / {maxCount}
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            To upload more {limitText}, please contact support to upgrade your
            channel plan or remove existing content to free up space.
          </p>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full gap-2">
              <a href="mailto:support@zoeratedtv.com">
                <Mail className="w-4 h-4" />
                Contact Support
              </a>
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full gap-2">
              <X className="w-4 h-4" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IndieLimitReachedModal;
