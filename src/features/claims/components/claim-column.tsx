import { useDroppable } from "@dnd-kit/core";
import { cn } from "#/lib/utils";
import { Badge } from "#/components/ui/badge";
import { ClaimCard } from "./claim-card";
import type { AdminClaimItem, AdminClaimStatus } from "#/lib/api/claims-controller";

const STATUS_CONFIG: Record<AdminClaimStatus, { label: string; color: string }> = {
  CREATED: { label: "Created", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  IN_PROGRESS: { label: "In Progress", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  COMPLETED: { label: "Completed", color: "bg-green-500/10 text-green-600 border-green-200" },
  REJECTED: { label: "Rejected", color: "bg-red-500/10 text-red-600 border-red-200" },
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
          isOver ? "bg-muted/60" : "bg-muted/20",
        )}
      >
        {claims.map((claim) => (
          <ClaimCard key={claim.id} claim={claim} onViewDetail={onViewDetail} />
        ))}
      </div>
    </div>
  );
}
