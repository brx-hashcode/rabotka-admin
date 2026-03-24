import { useEffect, useRef } from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getWalletPayments } from "#/lib/api/wallet-controller";

const defaultLimit = 20;

const paymentsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(defaultLimit),
  q: parseAsString.withDefault(""),
  pay_type: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  pay_status: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  created_from: parseAsString.withDefault(""),
  created_to: parseAsString.withDefault(""),
};

export function useWalletPayments() {
  const [queryState] = useQueryStates(paymentsParsers);
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
    limit: query.data?.limit ?? defaultLimit,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
