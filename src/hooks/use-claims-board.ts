import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { listClaims } from "#/lib/api/claims-controller";
import type {
  AdminClaimItem,
  AdminClaimStatus,
} from "#/lib/api/claims-controller";

const ALL_STATUSES: AdminClaimStatus[] = [
  "CREATED",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
];

/** Claims loaded per column. */
const COLUMN_LIMIT = 100;

const EMPTY: AdminClaimItem[] = [];

export type ClaimsByStatus = Record<AdminClaimStatus, AdminClaimItem[]>;

export function useClaimsBoard() {
  // One query per column rather than one for the board. A single limit:100
  // was a budget the four columns shared, so a busy CREATED column could eat
  // it whole and leave REJECTED rendering empty — a board that quietly lies.
  // The keys stay under ["admin", "claims", "board"], so existing prefix
  // invalidation still refreshes all four.
  const [created, inProgress, completed, rejected] = useQueries({
    queries: ALL_STATUSES.map((status) => ({
      queryKey: ["admin", "claims", "board", status],
      queryFn: () => listClaims({ status: [status], limit: COLUMN_LIMIT }),
    })),
  });

  // Memoised on the fetched pages: the board keeps its own copy of this so a
  // drag can reorder optimistically, and it resyncs when this identity
  // changes. Rebuilding the object every render would clobber the drag.
  const claimsByStatus = useMemo<ClaimsByStatus>(
    () => ({
      // Each response already arrives in board order (position asc, createdAt desc).
      CREATED: created.data?.data ?? EMPTY,
      IN_PROGRESS: inProgress.data?.data ?? EMPTY,
      COMPLETED: completed.data?.data ?? EMPTY,
      REJECTED: rejected.data?.data ?? EMPTY,
    }),
    [created.data, inProgress.data, completed.data, rejected.data],
  );

  const results = [created, inProgress, completed, rejected];

  return {
    claimsByStatus,
    allStatuses: ALL_STATUSES,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    refetch: () => Promise.all(results.map((r) => r.refetch())),
  };
}
