import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { ImagePlus, Send, Trash2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import {
  listClaimComments,
  addClaimComment,
  deleteClaimComment,
  uploadClaimAttachments,
  type AdminClaimCommentItem,
} from "#/lib/api/claims-controller";
import { useRole } from "#/hooks/use-role";
import { useClaimCommentsSocket } from "#/hooks/use-claim-comments-socket";
import {
  ImageUploadZone,
  type UploadRejection,
} from "#/pages/profile-detail/components/image-upload-zone";
import { compressImage } from "#/lib/media/image-compress";
import { reportUploadRejections } from "#/lib/media/upload-rejection-toast";
import { isLikelyImageAsset } from "#/lib/media/is-likely-image-asset";
import { scrollToBottom } from "#/lib/scroll-to-bottom";
import type { ViewerDocument } from "#/pages/profile-detail/components/document-viewer-drawer";

const MAX_ATTACHMENTS = 3;

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

type ClaimCommentsProps = {
  claimId: string;
  /** Lifted to the sheet so one viewer serves the whole claim. */
  onOpenAttachment: (doc: ViewerDocument) => void;
};

export function ClaimComments({
  claimId,
  onOpenAttachment,
}: Readonly<ClaimCommentsProps>) {
  const queryClient = useQueryClient();
  const { canManageContent } = useRole();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Object URLs live until revoked. A ref so the unmount cleanup can stay
  // mount-only — depending on `previews` would revoke them on every change and
  // blank the thumbnails.
  const previewsRef = useRef<string[]>([]);
  previewsRef.current = previews;
  useEffect(
    () => () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  useClaimCommentsSocket(claimId);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["admin", "claims", claimId, "comments"],
    queryFn: () => listClaimComments(claimId),
    enabled: Boolean(claimId),
  });

  useEffect(() => {
    // The list scrolls inside the claim sheet; `scrollIntoView` would drag
    // the sheet along with it to show the newest comment.
    scrollToBottom(bottomRef.current, "smooth");
  }, [comments.length]);

  const addFiles = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
    setPreviews((prev) => [
      ...prev,
      ...accepted.map((f) => URL.createObjectURL(f)),
    ]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const gone = prev[index];
      if (gone) URL.revokeObjectURL(gone);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleRejections = useCallback((rejections: UploadRejection[]) => {
    reportUploadRejections(rejections, MAX_ATTACHMENTS);
  }, []);

  const { mutate: submit, isPending: isSending } = useMutation({
    mutationFn: async () => {
      const content = text.trim();

      let attachment_urls: string[] | undefined;
      if (files.length > 0) {
        setIsPreparing(true);
        try {
          // Compressed first, as the KYC upload does: 1920px keeps a photo
          // legible and keeps it under the 5 MB the server accepts.
          const compressed = await Promise.all(files.map(compressImage));
          attachment_urls = await uploadClaimAttachments(compressed);
        } finally {
          setIsPreparing(false);
        }
      }

      return addClaimComment(claimId, {
        content: content || undefined,
        attachment_urls,
      });
    },
    onSuccess: (newComment) => {
      setText("");
      previews.forEach((url) => URL.revokeObjectURL(url));
      setFiles([]);
      setPreviews([]);
      setShowAttachments(false);
      queryClient.setQueryData<AdminClaimCommentItem[]>(
        ["admin", "claims", claimId, "comments"],
        (prev = []) => {
          if (prev.some((c) => c.id === newComment.id)) return prev;
          return [...prev, newComment];
        },
      );
    },
    onError: () => toast.error("Failed to add comment"),
  });

  // Either half is enough — a screenshot with no caption is a normal reply,
  // and the server accepts one.
  const canSend = text.trim().length > 0 || files.length > 0;
  const isBusy = isSending || isPreparing;

  const { mutate: remove } = useMutation({
    mutationFn: (commentId: string) => deleteClaimComment(claimId, commentId),
    onSuccess: (_, commentId) =>
      queryClient.setQueryData<AdminClaimCommentItem[]>(
        ["admin", "claims", claimId, "comments"],
        (prev = []) => prev.filter((c) => c.id !== commentId),
      ),
    onError: () => toast.error("Failed to delete comment"),
  });

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // `canSend`, not `text.trim()`: Ctrl+Enter must also work when the comment
    // is a picture with no caption.
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSend && !isBusy) {
      submit();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Comments{comments.length > 0 && ` (${comments.length})`}
      </p>

      {/* List */}
      <div
        className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1"
        style={{ scrollbarWidth: "none" }}
      >
        {isLoading && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Loading…
          </p>
        )}
        {!isLoading && comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet.
          </p>
        )}
        {comments.map((comment: AdminClaimCommentItem) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onDelete={() => remove(comment.id)}
            canDelete={canManageContent}
            onOpenAttachment={onOpenAttachment}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {canManageContent && (
        <div className="flex flex-col gap-2 rounded-md bg-card px-3 py-2 shadow-soft">
          {(showAttachments || files.length > 0) && (
            <ImageUploadZone
              label="Images"
              files={files}
              previews={previews}
              onAdd={addFiles}
              onRemove={removeFile}
              onReject={handleRejections}
              maxFiles={MAX_ATTACHMENTS}
            />
          )}

          <div className="flex items-end gap-2">
            <Textarea
              className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-h-[60px] p-0 text-sm"
              placeholder="Add a comment… (Ctrl+Enter to send)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isBusy}
            />
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground"
              onClick={() => setShowAttachments((open) => !open)}
              disabled={isBusy}
              aria-label="Attach images"
              title="Attach images"
            >
              <ImagePlus className="size-4" />
            </Button>
            <Button
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => submit()}
              disabled={!canSend || isBusy}
            >
              <Send className="size-3.5" />
              {isPreparing ? "Uploading…" : "Send"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  onDelete,
  canDelete,
  onOpenAttachment,
}: Readonly<{
  comment: AdminClaimCommentItem;
  onDelete: () => void;
  canDelete: boolean;
  onOpenAttachment: (doc: ViewerDocument) => void;
}>) {
  const isProfileComment = comment.createdByType === "profile";
  // `?? []` guards a bundle newer than the backend it talks to.
  const attachments = comment.attachmentUrls ?? [];
  const hasText = comment.content.trim().length > 0;
  const displayName = isProfileComment
    ? (comment.profileName ?? "Unknown")
    : (comment.userName ?? "Unknown");
  const initials = displayName ? getInitials(displayName) : "?";

  return (
    <div className="group flex items-start gap-2.5">
      <Avatar className="size-7 shrink-0 mt-0.5">
        <AvatarFallback
          className={`text-[10px] font-semibold text-white ${
            isProfileComment ? "bg-green-500" : "bg-blue-500"
          }`}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-medium">{displayName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
        {hasText && (
          <p className="text-sm whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}

        {attachments.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 ${hasText ? "mt-1.5" : ""}`}>
            {attachments.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                type="button"
                onClick={() =>
                  onOpenAttachment(claimAttachmentToViewerDoc(url, idx))
                }
                className="size-16 overflow-hidden rounded-md bg-muted"
                title={`Attachment ${idx + 1}`}
              >
                <img
                  src={url}
                  alt={`Attachment ${idx + 1}`}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="size-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

/**
 * A claim attachment as the shared viewer wants it.
 *
 * Mirrors `attachmentToViewerDoc` in the chat page. `fileType` comes from
 * `isLikelyImageAsset` rather than being assumed: claims accepted PDF and DOC
 * until recently, so the rows already stored are not all images, and the viewer
 * picks its renderer from this.
 */
export function claimAttachmentToViewerDoc(
  url: string,
  index: number,
): ViewerDocument {
  const name = url.split("/").pop()?.split("?")[0] ?? `attachment-${index + 1}`;
  return {
    url,
    title: decodeURIComponent(name),
    description: isLikelyImageAsset(url) ? "Image" : "File",
  };
}
