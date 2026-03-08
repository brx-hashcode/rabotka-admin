import { useState, useEffect, useCallback, useRef } from "react";
import { IconCheck, IconX, IconBan, IconUpload } from "@tabler/icons-react";

import { getAccountStatusLabel } from "#/lib/status-labels";

import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { Textarea } from "#/components/ui/textarea";
import { Separator } from "#/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "#/components/ui/dialog";

import { statusBadgeVariant } from "../helpers";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: string;
  onSubmit: (status: string) => void;
  isPending: boolean;
};

export function StatusVerificationModal({
  open,
  onOpenChange,
  currentStatus,
  onSubmit,
  isPending,
}: Props) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setSelectedStatus(null);
      setComment("");
      setImageFiles([]);
      setImagePreviews([]);
    }
  }, [open]);

  // Generate previews when files change
  useEffect(() => {
    const urls = imageFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [imageFiles]);

  const handleSubmit = () => {
    if (!selectedStatus) return;
    onSubmit(selectedStatus);
  };

  const addImages = useCallback((files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length > 0) {
      setImageFiles((prev) => [...prev, ...images]);
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      addImages(Array.from(e.dataTransfer.files));
    },
    [addImages],
  );

  const preventDefault = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Status Verification</DialogTitle>
          <DialogDescription>
            Update the account status. Currently:{" "}
            <Badge
              variant={statusBadgeVariant(currentStatus)}
              className="ml-1 align-middle"
            >
              {getAccountStatusLabel(currentStatus)}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status selection */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={selectedStatus === "ACTIVE" ? "default" : "outline"}
              className={
                selectedStatus === "ACTIVE"
                  ? "h-auto flex-col gap-1.5 border-green-600 bg-green-600 py-4 text-white hover:bg-green-700"
                  : "h-auto flex-col gap-1.5 py-4"
              }
              onClick={() => setSelectedStatus("ACTIVE")}
            >
              <IconCheck className="size-5" />
              <span>Activate</span>
            </Button>
            <Button
              type="button"
              variant={selectedStatus === "SUSPENDED" ? "destructive" : "outline"}
              className="h-auto flex-col gap-1.5 py-4"
              onClick={() => setSelectedStatus("SUSPENDED")}
            >
              <IconBan className="size-5" />
              <span>Suspend</span>
            </Button>
          </div>

          <Separator />

          {/* Image upload zone */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Supporting Images
            </label>
            <div
              onDragOver={preventDefault}
              onDrop={handleDrop}
              onClick={() => imageInputRef.current?.click()}
              className="hover:bg-muted/50 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors"
            >
              <IconUpload className="text-muted-foreground size-7" />
              <p className="text-muted-foreground text-sm">
                Drop images here or click to browse
              </p>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addImages(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
            </div>
            {imagePreviews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {imagePreviews.map((url, i) => (
                  <div
                    key={i}
                    className="group relative size-20 overflow-hidden rounded-md border"
                  >
                    <img
                      src={url}
                      alt={imageFiles[i]?.name ?? "upload"}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(i);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <IconX className="size-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Comment (optional)
            </label>
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedStatus || isPending}
          >
            {isPending ? "Submitting..." : "Submit Decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
