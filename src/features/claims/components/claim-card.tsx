import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import type { AdminClaimItem } from "#/lib/api/claims-controller";

type ClaimCardProps = {
  claim: AdminClaimItem;
  onViewDetail: (claim: AdminClaimItem) => void;
};

export function ClaimCard({ claim, onViewDetail }: Readonly<ClaimCardProps>) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: claim.id,
    data: { claim },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const initials = claim.profileName
    ? claim.profileName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-card border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing select-none"
      onClick={() => onViewDetail(claim)}
    >
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
    </div>
  );
}
