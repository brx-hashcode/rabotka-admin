import { useQuery } from "@tanstack/react-query";

import {
  getCollaborationGraph,
  type GraphFilters,
} from "#/lib/api/collaboration-graph-controller";

export function useCollaborationGraph(filters: GraphFilters) {
  return useQuery({
    queryKey: ["admin", "collaboration-graph", filters],
    queryFn: () => getCollaborationGraph(filters),
    // The graph is expensive to lay out; don't refetch it on every tab focus.
    staleTime: 60_000,
  });
}
