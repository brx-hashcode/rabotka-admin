import { useEffect, useRef } from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getUsersList } from "#/lib/api/users-controller";
import { appConfig } from "#/config";

const usersParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(appConfig.defaultPaginationLimit),
  q: parseAsString.withDefault(""),
  role: parseAsArrayOf(parseAsString).withDefault([] as string[]),
};

export function useUsersList() {
  const [queryState] = useQueryStates(usersParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const { q, role } = queryState;

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [q, role, setPage]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.q ? { q: queryState.q } : {}),
    ...(queryState.role?.length ? { role: queryState.role } : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => getUsersList(params),
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
