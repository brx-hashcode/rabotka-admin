import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "#/lib/utils";
import { Badge } from "#/components/ui/badge";
import { ClaimCard } from "./claim-card";
import type { AdminClaimItem, AdminClaimStatus } from "#/lib/api/claims-controller";

const STATUS_CONFIG: Record<AdminClaimStatus, { label: string; color: string; bg: string; bgOver: string }> = {
  CREATED: { label: "CREATED", color: "bg-sky-500 text-white border-transparent", bg: "bg-sky-500/10", bgOver: "bg-sky-500/20" },
  IN_PROGRESS: { label: "IN PROGRESS", color: "bg-amber-500 text-white border-transparent", bg: "bg-amber-500/10", bgOver: "bg-amber-500/20" },
  COMPLETED: { label: "COMPLETED", color: "bg-violet-600 text-white border-transparent", bg: "bg-violet-600/10", bgOver: "bg-violet-600/20" },
  REJECTED: { label: "REJECTED", color: "bg-rose-600 text-white border-transparent", bg: "bg-rose-600/10", bgOver: "bg-rose-600/20" },
};

type ClaimColumnProps = {
  status: AdminClaimStatus;
  claims: AdminClaimItem[];
  onViewDetail: (claim: AdminClaimItem) => void;
};

export function ClaimColumn({ status, claims, onViewDetail }: Readonly<ClaimColumnProps>) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex min-h-0 flex-col gap-3 min-w-[260px] w-full">
      {/* The label stays put while the cards under it scroll — a column you
          have scrolled halfway down should still say which one it is. */}
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="outline" className={cn("text-xs font-medium", config.color)}>
          {config.label}
        </Badge>
        <span className="text-xs text-muted-foreground">{claims.length}</span>
      </div>

      {/* The panel takes the leftover height; the cards are absolutely
          positioned inside it so they contribute nothing to layout height.
          Without that they push the column — and with it the whole page —
          taller, and there is no definite height anywhere up the chain for
          `flex-1 min-h-0` to shrink back from (the sidebar wrapper is
          `min-h-svh`, a floor, not a cap). Same trick as the chat pane. */}
      <div
        ref={setNodeRef}
        className={cn(
          "relative min-h-[120px] flex-1 rounded-lg transition-colors",
          isOver ? config.bgOver : config.bg,
        )}
      >
        <div className="absolute inset-0 flex flex-col gap-2 overflow-y-auto p-2">
          <SortableContext
            items={claims.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {claims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} onViewDetail={onViewDetail} />
            ))}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}
