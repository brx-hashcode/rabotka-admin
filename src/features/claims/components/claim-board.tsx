import { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateClaim } from "#/lib/api/claims-controller";
import type {
  AdminClaimItem,
  AdminClaimStatus,
} from "#/lib/api/claims-controller";
import { useClaimsBoard } from "#/hooks/use-claims-board";
import { ClaimColumn } from "./claim-column";

type ClaimBoardProps = {
  onViewDetail: (claim: AdminClaimItem) => void;
};

export function ClaimBoard({ onViewDetail }: Readonly<ClaimBoardProps>) {
  const { claimsByStatus, allStatuses, isLoading } = useClaimsBoard();
  const queryClient = useQueryClient();
  const [localOverrides, setLocalOverrides] = useState<
    Record<string, AdminClaimStatus>
  >({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminClaimStatus }) =>
      updateClaim(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "claims", "board"] });
    },
    onError: (_err, { id }) => {
      toast.error("Failed to update claim status");
      setLocalOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const claimId = active.id as string;
    const newStatus = over.id as AdminClaimStatus;
    const claim = active.data.current?.claim as AdminClaimItem;

    if (claim.status === newStatus) return;

    setLocalOverrides((prev) => ({ ...prev, [claimId]: newStatus }));
    changeStatus({ id: claimId, status: newStatus });
  }

  const effectiveByStatus: Record<AdminClaimStatus, AdminClaimItem[]> = {
    CREATED: [],
    IN_PROGRESS: [],
    COMPLETED: [],
    REJECTED: [],
  };

  for (const status of allStatuses) {
    for (const claim of claimsByStatus[status]) {
      const override = localOverrides[claim.id];
      const effectiveStatus = override ?? claim.status;
      effectiveByStatus[effectiveStatus].push({
        ...claim,
        status: effectiveStatus,
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="min-w-[260px] w-full h-48 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {allStatuses.map((status) => (
          <ClaimColumn
            key={status}
            status={status}
            claims={effectiveByStatus[status]}
            onViewDetail={onViewDetail}
          />
        ))}
      </div>
    </DndContext>
  );
}
