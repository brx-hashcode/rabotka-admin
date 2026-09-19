import { useState } from "react";
import {
  IconBriefcase,
  IconDotsVertical,
  IconPencil,
  IconPhotoOff,
  IconTrash,
} from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { ConfirmDialog } from "#/features/team/components/confirm-dialog";
import { useRole } from "#/hooks/use-role";
import { useProfilePortfolio } from "#/hooks/use-profile-portfolio";
import type { AdminPortfolioItem } from "#/lib/api/portfolio-controller";

import { formatDate } from "../helpers";
import type { ViewerDocument } from "./document-viewer-drawer";

type Props = {
  profileId: string;
  onPreviewDoc: (doc: ViewerDocument) => void;
};

export function ProfilePortfolioContent({
  profileId,
  onPreviewDoc,
}: Readonly<Props>) {
  const { canManageContent } = useRole();
  const {
    items,
    isLoading,
    updateItem,
    isUpdating,
    deleteItem,
    isDeletingItem,
    deleteImage,
    isDeletingImage,
  } = useProfilePortfolio(profileId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <IconBriefcase className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">
            This worker has no portfolio realizations yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {items.map((item) => (
        <PortfolioItemCard
          key={item.id}
          item={item}
          canManage={canManageContent}
          onPreviewDoc={onPreviewDoc}
          onSave={(data) => updateItem({ itemId: item.id, data })}
          isSaving={isUpdating}
          onDeleteItem={() => deleteItem(item.id)}
          isDeletingItem={isDeletingItem}
          onDeleteImage={(imageId) => deleteImage({ itemId: item.id, imageId })}
          isDeletingImage={isDeletingImage}
        />
      ))}
    </div>
  );
}

type CardProps = {
  item: AdminPortfolioItem;
  canManage: boolean;
  onPreviewDoc: (doc: ViewerDocument) => void;
  onSave: (data: { description: string }) => Promise<unknown>;
  isSaving: boolean;
  onDeleteItem: () => Promise<unknown>;
  isDeletingItem: boolean;
  onDeleteImage: (imageId: string) => Promise<unknown>;
  isDeletingImage: boolean;
};

function PortfolioItemCard({
  item,
  canManage,
  onPreviewDoc,
  onSave,
  isSaving,
  onDeleteItem,
  isDeletingItem,
  onDeleteImage,
  isDeletingImage,
}: Readonly<CardProps>) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0">
      <div className="flex items-start justify-between gap-2 border-b p-4">
        <div className="min-w-0">
          {/* The text is the publication now — there is no title to head the
              card with. A publication that is only photos says so, rather
              than rendering an empty line where a title used to be. */}
          {item.description ? (
            <p className="text-sm whitespace-pre-line">{item.description}</p>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              {photoLabel(item.images.length)}
            </p>
          )}
          <p className="text-muted-foreground mt-2 text-[11px]">
            {formatDate(item.createdAt)}
          </p>
        </div>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 shrink-0">
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <IconPencil className="size-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <IconTrash className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="p-4">
        {item.images.length === 0 ? (
          <p className="text-muted-foreground text-xs">No images.</p>
        ) : (
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
            {item.images.map((img, index) => (
              <PortfolioImageTile
                key={img.id}
                url={img.imageUrl}
                index={index}
                canManage={canManage}
                onPreview={() =>
                  onPreviewDoc({
                    url: img.imageUrl,
                    title: postHeading(item),
                    description: `Image ${index + 1}`,
                    fileType: "image",
                  })
                }
                onDelete={() => setImageToDelete(img.id)}
              />
            ))}
          </div>
        )}
      </div>

      <EditItemDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        item={item}
        isSaving={isSaving}
        onSave={async (data) => {
          await onSave(data);
          setEditOpen(false);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete portfolio item"
        description="This permanently deletes this realization and all its images. This action cannot be undone."
        actionLabel="Delete"
        variant="destructive"
        isPending={isDeletingItem}
        onConfirm={() => {
          void onDeleteItem().then(() => setDeleteOpen(false));
        }}
      />

      <ConfirmDialog
        open={imageToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setImageToDelete(null);
        }}
        title="Delete image"
        description="This permanently removes this image from the realization."
        actionLabel="Delete"
        variant="destructive"
        isPending={isDeletingImage}
        onConfirm={() => {
          if (imageToDelete) {
            void onDeleteImage(imageToDelete).then(() =>
              setImageToDelete(null),
            );
          }
        }}
      />
    </Card>
  );
}

/** "3 photos" — what a publication with no text is. */
function photoLabel(count: number): string {
  if (count === 0) return "Empty publication";
  return count === 1 ? "1 photo, no text" : `${count} photos, no text`;
}

/**
 * A line naming a publication, for the viewer's heading and its print title.
 *
 * The title used to serve this. With it gone the first line of the text does,
 * and a publication without text falls back to naming its photos — an empty
 * heading reads as a bug.
 */
function postHeading(item: AdminPortfolioItem): string {
  const firstLine = item.description?.trim().split("\n")[0].trim();
  if (firstLine) {
    return firstLine.length > 60 ? `${firstLine.slice(0, 60).trimEnd()}…` : firstLine;
  }
  return photoLabel(item.images.length);
}

function PortfolioImageTile({
  url,
  index,
  canManage,
  onPreview,
  onDelete,
}: Readonly<{
  url: string;
  index: number;
  canManage: boolean;
  onPreview: () => void;
  onDelete: () => void;
}>) {
  const [broken, setBroken] = useState(false);

  return (
    <div className="group bg-muted relative aspect-square overflow-hidden rounded-lg">
      {broken ? (
        <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-1">
          <IconPhotoOff className="size-6" />
          <span className="text-[10px]">Unavailable</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPreview}
          className="h-full w-full cursor-pointer"
        >
          <img
            src={url}
            alt={`Realization ${index + 1}`}
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
          />
        </button>
      )}
      {canManage && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 size-7 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onDelete}
        >
          <IconTrash className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

function EditItemDialog({
  open,
  onOpenChange,
  item,
  isSaving,
  onSave,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AdminPortfolioItem;
  isSaving: boolean;
  onSave: (data: { description: string }) => Promise<void>;
}>) {
  const [description, setDescription] = useState(item.description ?? "");

  const isDirty = description.trim() !== (item.description ?? "");
  // A publication is text or photos, never neither — so the text may only be
  // emptied while photos remain. Mirrors the rule the API enforces.
  const isValid = description.trim().length > 0 || item.images.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setDescription(item.description ?? "");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit publication</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="portfolio-description">Text</Label>
            <Textarea
              id="portfolio-description"
              value={description}
              maxLength={1000}
              rows={5}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!isDirty || !isValid || isSaving}
            onClick={() =>
              void onSave({ description: description.trim() })
            }
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
