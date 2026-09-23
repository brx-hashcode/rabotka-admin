import { useEffect, useRef } from "react";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getConversationsList } from "#/lib/api/conversations-controller";
import { appConfig } from "#/config";

export const conversationsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(appConfig.defaultPaginationLimit),
  q: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  flags: parseAsArrayOf(parseAsString).withDefault([] as string[]),
};

export function useConversationsList() {
  const [queryState] = useQueryStates(conversationsParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const { q, status, flags } = queryState;

  // Changing a filter while on page 5 would otherwise ask for page 5 of a
  // shorter list and render an empty table. Skipped on first mount so a
  // shared URL carrying ?page=3 still opens on page 3.
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [q, status, flags, setPage]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.q ? { q: queryState.q } : {}),
    ...(queryState.status?.length ? { status: queryState.status } : {}),
    ...(queryState.flags?.length ? { flags: queryState.flags } : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "conversations", params],
    queryFn: () => getConversationsList(params),
  });

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    limit: query.data?.limit ?? appConfig.defaultPaginationLimit,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
