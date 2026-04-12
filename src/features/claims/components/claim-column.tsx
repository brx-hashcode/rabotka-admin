import { useDroppable } from "@dnd-kit/core";
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
    <div className="flex flex-col gap-3 min-w-[260px] w-full">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn("text-xs font-medium", config.color)}>
          {config.label}
        </Badge>
        <span className="text-xs text-muted-foreground">{claims.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 min-h-[120px] rounded-lg p-2 transition-colors",
          isOver ? config.bgOver : config.bg,
        )}
      >
        {claims.map((claim) => (
          <ClaimCard key={claim.id} claim={claim} onViewDetail={onViewDetail} />
        ))}
      </div>
    </div>
  );
}
