import { useEffect, useRef } from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getContactRecordsList } from "#/lib/api/contact-records-controller";
import { appConfig } from "#/config";

export const contactRecordsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(appConfig.defaultPaginationLimit),
  q: parseAsString.withDefault(""),
  origin: parseAsArrayOf(parseAsString).withDefault([] as string[]),
};

export function useContactRecordsList() {
  const [queryState] = useQueryStates(contactRecordsParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const { q, origin } = queryState;

  // Changing a filter while on page 5 would otherwise ask for page 5 of a
  // shorter list and render an empty table. Skipped on first mount so a
  // shared URL carrying ?page=3 still opens on page 3.
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [q, origin, setPage]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.q ? { q: queryState.q } : {}),
    ...(queryState.origin?.length ? { origin: queryState.origin } : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "contact-records", params],
    queryFn: () => getContactRecordsList(params),
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
