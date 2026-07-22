import { useState } from "react";
import {
  IconBriefcase,
  IconDotsVertical,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { Input } from "#/components/ui/input";
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
import { isLikelyImageAsset } from "#/lib/media/is-likely-image-asset";
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
  onSave: (data: { title: string; description: string }) => Promise<unknown>;
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
          <p className="truncate text-sm font-semibold">{item.title}</p>
          <p className="text-muted-foreground mt-1 text-xs whitespace-pre-line">
            {item.description}
          </p>
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
                    title: item.title,
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
  const isImage = isLikelyImageAsset(url);

  return (
    <div className="group bg-muted relative aspect-square overflow-hidden rounded-lg">
      {isImage ? (
        <button
          type="button"
          onClick={onPreview}
          className="h-full w-full cursor-pointer"
        >
          <img
            src={url}
            alt={`Realization image ${index + 1}`}
            className="h-full w-full object-cover"
          />
        </button>
      ) : (
        <Badge variant="outline" className="absolute top-2 left-2">
          File
        </Badge>
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
  onSave: (data: { title: string; description: string }) => Promise<void>;
}>) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);

  const isDirty = title.trim() !== item.title || description.trim() !== item.description;
  const isValid = title.trim().length >= 3 && description.trim().length >= 3;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setTitle(item.title);
          setDescription(item.description);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit portfolio item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="portfolio-title">Title</Label>
            <Input
              id="portfolio-title"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio-description">Description</Label>
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
              void onSave({
                title: title.trim(),
                description: description.trim(),
              })
            }
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
