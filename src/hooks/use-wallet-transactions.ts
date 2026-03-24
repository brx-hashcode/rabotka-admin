import { useEffect, useRef } from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getWalletTransactions } from "#/lib/api/wallet-controller";

const defaultLimit = 20;

const transactionsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(defaultLimit),
  tx_type: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  created_from: parseAsString.withDefault(""),
  created_to: parseAsString.withDefault(""),
};

export function useWalletTransactions() {
  const [queryState] = useQueryStates(transactionsParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const { tx_type, created_from, created_to } = queryState;

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [tx_type, created_from, created_to, setPage]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.tx_type?.length ? { type: queryState.tx_type } : {}),
    ...(queryState.created_from ? { created_from: queryState.created_from } : {}),
    ...(queryState.created_to ? { created_to: queryState.created_to } : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "wallet", "transactions", params],
    queryFn: () => getWalletTransactions(params),
  });

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    limit: query.data?.limit ?? defaultLimit,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
