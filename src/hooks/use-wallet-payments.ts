import { useEffect, useRef } from "react";
import { parseAsInteger, useQueryState, useQueryStates } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getWalletPayments } from "#/lib/api/wallet-controller";
import {
  defaultWalletTableLimit,
  walletPaymentsParsers,
} from "#/hooks/wallet-query-parsers";

export function useWalletPayments() {
  const [queryState] = useQueryStates(walletPaymentsParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const { q, pay_type, pay_status, created_from, created_to } = queryState;

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [q, pay_type, pay_status, created_from, created_to, setPage]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.q ? { q: queryState.q } : {}),
    ...(queryState.pay_type?.length ? { type: queryState.pay_type } : {}),
    ...(queryState.pay_status?.length ? { status: queryState.pay_status } : {}),
    ...(queryState.created_from ? { created_from: queryState.created_from } : {}),
    ...(queryState.created_to ? { created_to: queryState.created_to } : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "wallet", "payments", params],
    queryFn: () => getWalletPayments(params),
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
