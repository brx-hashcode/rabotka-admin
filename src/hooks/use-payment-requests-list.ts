import { useEffect, useRef } from "react";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useQuery } from "@tanstack/react-query";
import {
  getPaymentRequestsList,
  type PaymentRequestStatus,
} from "#/lib/api/payment-requests-controller";
import { appConfig } from "#/config";

const paymentRequestsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(appConfig.defaultPaginationLimit),
  status: parseAsString.withDefault(""),
  deleted: parseAsArrayOf(parseAsString).withDefault([] as string[]),
};

export function usePaymentRequestsList() {
  const [queryState] = useQueryStates(paymentRequestsParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const { status, deleted } = queryState;

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [status, deleted, setPage]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.status
      ? { status: queryState.status as PaymentRequestStatus }
      : {}),
    ...(queryState.deleted?.includes("true") ? { deleted: true } : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "payment-requests", params],
    queryFn: () => getPaymentRequestsList(params),
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
