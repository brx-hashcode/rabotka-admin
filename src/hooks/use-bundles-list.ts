import { useQuery } from "@tanstack/react-query";
import { listBundles } from "#/lib/api/advertisements-controller";

export function useBundlesList() {
  const query = useQuery({
    queryKey: ["admin", "bundles"],
    queryFn: listBundles,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
