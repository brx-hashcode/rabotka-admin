import { useEffect, useRef } from "react";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getDemoRequestsList } from "#/lib/api/demo-requests-controller";
import { appConfig } from "#/config";

export const demoRequestsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(appConfig.defaultPaginationLimit),
  q: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsString).withDefault([] as string[]),
};

export function useDemoRequestsList() {
  const [queryState] = useQueryStates(demoRequestsParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const { q, status } = queryState;

  // Back to page 1 when a filter changes; not on first mount, so a shared
  // URL with ?page=3 still opens on page 3.
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [q, status, setPage]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.q ? { q: queryState.q } : {}),
    ...(queryState.status?.length ? { status: queryState.status } : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "demo-requests", params],
    queryFn: () => getDemoRequestsList(params),
  });

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
