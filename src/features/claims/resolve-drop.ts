import { arrayMove } from "@dnd-kit/sortable";
import type { AdminClaimStatus } from "#/lib/api/claims-controller";
import type { ClaimsByStatus } from "#/hooks/use-claims-board";

export type DropResult = {
  /** The board as it should look immediately, before the server answers. */
  board: ClaimsByStatus;
  /** Column the claim landed in. */
  status: AdminClaimStatus;
  /** Slot it occupies there, counting itself — what the API expects. */
  index: number;
};

/**
 * Work out where a dropped card belongs.
 *
 * `overId` is either another card's id or a column's status: dnd-kit reports
 * the column when the pointer is over the empty space below the last card,
 * which reads as "put it at the end".
 *
 * Returns null when the drop changes nothing, so the caller can skip both the
 * re-render and the request.
 */
export function resolveDrop(
  board: ClaimsByStatus,
  statuses: readonly AdminClaimStatus[],
  activeId: string,
  overId: string,
): DropResult | null {
  const from = locate(board, statuses, activeId);
  if (!from) return null;

  const isColumn = (statuses as readonly string[]).includes(overId);
  const overCard = isColumn ? null : locate(board, statuses, overId);
  if (!isColumn && !overCard) return null;

  const status = isColumn ? (overId as AdminClaimStatus) : overCard!.status;
  const next: ClaimsByStatus = { ...board };

  if (status === from.status) {
    const target = overCard ? overCard.index : board[status].length - 1;
    if (target === from.index) return null;
    next[status] = arrayMove(board[status], from.index, target);
  } else {
    const moved = { ...board[from.status][from.index], status };
    const insertAt = overCard ? overCard.index : board[status].length;
    next[from.status] = board[from.status].filter((c) => c.id !== activeId);
    next[status] = [
      ...board[status].slice(0, insertAt),
      moved,
      ...board[status].slice(insertAt),
    ];
  }

  return {
    board: next,
    status,
    index: next[status].findIndex((c) => c.id === activeId),
  };
}

function locate(
  board: ClaimsByStatus,
  statuses: readonly AdminClaimStatus[],
  claimId: string,
): { status: AdminClaimStatus; index: number } | null {
  for (const status of statuses) {
    const index = board[status].findIndex((c) => c.id === claimId);
    if (index !== -1) return { status, index };
  }
  return null;
}
