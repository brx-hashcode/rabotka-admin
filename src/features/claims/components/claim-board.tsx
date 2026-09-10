import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reorderClaim } from "#/lib/api/claims-controller";
import type {
  AdminClaimItem,
  AdminClaimStatus,
} from "#/lib/api/claims-controller";
import { useClaimsBoard, type ClaimsByStatus } from "#/hooks/use-claims-board";
import { useRole } from "#/hooks/use-role";
import { resolveDrop } from "../resolve-drop";
import { ClaimColumn } from "./claim-column";
import { ClaimCardOverlay } from "./claim-card";

type ClaimBoardProps = {
  onViewDetail: (claim: AdminClaimItem) => void;
};

export function ClaimBoard({ onViewDetail }: Readonly<ClaimBoardProps>) {
  const { claimsByStatus, allStatuses, isLoading } = useClaimsBoard();
  const queryClient = useQueryClient();
  // MODERATOR may open this page but not write to it, and the server requires
  // MANAGER on the reorder endpoint. Without this the board happily moved the
  // card, then replaced it with a bare "Failed to move claim".
  const { canManageContent } = useRole();

  // The board renders from this copy, not straight from the query, so a drop
  // shows where the card landed before the server has answered.
  const [board, setBoard] = useState<ClaimsByStatus>(claimsByStatus);
  const [activeClaim, setActiveClaim] = useState<AdminClaimItem | null>(null);

  useEffect(() => setBoard(claimsByStatus), [claimsByStatus]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const { mutate: persistMove } = useMutation({
    mutationFn: ({
      id,
      status,
      index,
    }: {
      id: string;
      status: AdminClaimStatus;
      index: number;
    }) => reorderClaim(id, { status, index }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "claims", "board"] });
    },
    onError: () => {
      toast.error("Failed to move claim");
      // Whatever the server actually holds wins; the optimistic board is
      // dropped rather than guessed back into shape.
      queryClient.invalidateQueries({ queryKey: ["admin", "claims", "board"] });
    },
  });

  function handleDragStart(event: DragStartEvent) {
    setActiveClaim((event.active.data.current?.claim as AdminClaimItem) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveClaim(null);
    if (!over || !canManageContent) return;

    const claimId = String(active.id);
    const drop = resolveDrop(board, allStatuses, claimId, String(over.id));
    if (!drop) return;

    setBoard(drop.board);
    persistMove({ id: claimId, status: drop.status, index: drop.index });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 gap-4">
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveClaim(null)}
    >
      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-1">
        {allStatuses.map((status) => (
          <ClaimColumn
            key={status}
            status={status}
            claims={board[status]}
            onViewDetail={onViewDetail}
            draggable={canManageContent}
          />
        ))}
      </div>

      {/* Rendered outside the columns, so the card in flight is never clipped
          by the panel it is leaving nor painted under the one it is entering. */}
      <DragOverlay dropAnimation={null}>
        {activeClaim ? <ClaimCardOverlay claim={activeClaim} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
