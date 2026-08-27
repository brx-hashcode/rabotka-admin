import { useDraggable } from "@dnd-kit/core";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { cn } from "#/lib/utils";
import type { AdminClaimItem } from "#/lib/api/claims-controller";

type ClaimCardProps = {
  claim: AdminClaimItem;
  onViewDetail: (claim: AdminClaimItem) => void;
};

const CARD_CLASS =
  "bg-card border rounded-lg p-3 shadow-sm select-none";

function ClaimCardBody({ claim }: Readonly<{ claim: AdminClaimItem }>) {
  const initials = claim.profileName
    ? claim.profileName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <>
      <p className="text-sm font-medium line-clamp-2 mb-2">{claim.title}</p>

      <div className="flex items-center gap-2 mb-2">
        <Avatar className="size-5">
          {claim.profileAvatarUrl && (
            <AvatarImage src={claim.profileAvatarUrl} alt={claim.profileName ?? ""} />
          )}
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        <span className="text-xs text-muted-foreground truncate">
          {claim.profileName ?? "Unknown"}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {claim.assignedUserName ? (
            <span className="text-foreground">{claim.assignedUserName}</span>
          ) : (
            <span className="italic">Unassigned</span>
          )}
        </span>
        <span className="text-xs text-muted-foreground">
          {format(new Date(claim.createdAt), "MMM d")}
        </span>
      </div>
    </>
  );
}

export function ClaimCard({ claim, onViewDetail }: Readonly<ClaimCardProps>) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: claim.id,
    data: { claim },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      // No transform here: the card that follows the cursor is the DragOverlay
      // in `claim-board.tsx`. Moving this one instead would put it under the
      // next column and clip it against its own scrolling panel. What is left
      // in place is the hole the card came out of.
      className={cn(
        CARD_CLASS,
        "shrink-0 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      onClick={() => onViewDetail(claim)}
    >
      <ClaimCardBody claim={claim} />
    </div>
  );
}

/** The card as it looks under the cursor: lifted, and above every column. */
export function ClaimCardOverlay({ claim }: Readonly<{ claim: AdminClaimItem }>) {
  return (
    <div className={cn(CARD_CLASS, "cursor-grabbing shadow-lg rotate-2")}>
      <ClaimCardBody claim={claim} />
    </div>
  );
}
