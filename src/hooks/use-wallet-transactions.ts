import { useEffect, useRef } from "react";
import { parseAsInteger, useQueryState, useQueryStates } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getWalletTransactions } from "#/lib/api/wallet-controller";
import {
  defaultWalletTableLimit,
  walletTransactionsParsers,
} from "#/hooks/wallet-query-parsers";

export function useWalletTransactions() {
  const [queryState] = useQueryStates(walletTransactionsParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const { q, tx_type, created_from, created_to } = queryState;

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [q, tx_type, created_from, created_to, setPage]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.q ? { q: queryState.q } : {}),
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
    limit: query.data?.limit ?? defaultWalletTableLimit,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
