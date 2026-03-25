import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Send, Trash2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import {
  listClaimComments,
  addClaimComment,
  deleteClaimComment,
  type AdminClaimCommentItem,
} from "#/lib/api/claims-controller";

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
};

export function ClaimComments({ claimId }: Readonly<ClaimCommentsProps>) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["admin", "claims", claimId, "comments"],
    queryFn: () => listClaimComments(claimId),
    enabled: Boolean(claimId),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  const { mutate: submit, isPending: isSending } = useMutation({
    mutationFn: () => addClaimComment(claimId, text.trim()),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({
        queryKey: ["admin", "claims", claimId, "comments"],
      });
    },
    onError: () => toast.error("Failed to add comment"),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (commentId: string) => deleteClaimComment(claimId, commentId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["admin", "claims", claimId, "comments"],
      }),
    onError: () => toast.error("Failed to delete comment"),
  });

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) submit();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Comments{comments.length > 0 && ` (${comments.length})`}
      </p>

      {/* List */}
      <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1">
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
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 rounded-xl border bg-muted/40 px-3 py-2">
        <Textarea
          className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-h-[60px] p-0 text-sm"
          placeholder="Add a comment… (Ctrl+Enter to send)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />
        <Button
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => submit()}
          disabled={!text.trim() || isSending}
        >
          <Send className="size-3.5" />
          Send
        </Button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  onDelete,
}: Readonly<{
  comment: AdminClaimCommentItem;
  onDelete: () => void;
}>) {
  const initials = comment.userName ? getInitials(comment.userName) : "?";

  return (
    <div className="group flex items-start gap-2.5">
      <Avatar className="size-7 shrink-0 mt-0.5">
        <AvatarFallback className="text-[10px] font-semibold bg-primary text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-medium">
            {comment.userName ?? "Unknown"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
