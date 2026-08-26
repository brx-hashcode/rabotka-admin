import { useEffect, useRef } from "react";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getReferrals } from "#/lib/api/referral-controller";
import { appConfig } from "#/config";

export const defaultReferralTableLimit = appConfig.defaultPaginationLimit;

export const referralsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(defaultReferralTableLimit),
  q: parseAsString.withDefault(""),
  ref_status: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  created_from: parseAsString.withDefault(""),
  created_to: parseAsString.withDefault(""),
};

type UseReferralsOptions = {
  /** Restricts to one profile in either role, for the profile detail pane. */
  profileId?: string;
};

export function useReferrals({ profileId }: UseReferralsOptions = {}) {
  const [queryState] = useQueryStates(referralsParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const { q, ref_status, created_from, created_to } = queryState;

  // Any filter change resets to page 1 — staying on page 4 of a result set
  // that now has one page shows an empty table that looks like a bug.
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [q, ref_status, created_from, created_to, setPage]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.q ? { q: queryState.q } : {}),
    ...(queryState.ref_status?.length ? { status: queryState.ref_status } : {}),
    ...(queryState.created_from
      ? { created_from: queryState.created_from }
      : {}),
    ...(queryState.created_to ? { created_to: queryState.created_to } : {}),
    ...(profileId ? { profileId } : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "referrals", params],
    queryFn: () => getReferrals(params),
  });

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    limit: query.data?.limit ?? defaultReferralTableLimit,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
