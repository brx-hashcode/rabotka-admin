import { useEffect, useRef } from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getProfilesList } from "#/lib/api/profiles-controller";

import { appConfig } from "#/config";

export const profilesParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(appConfig.defaultPaginationLimit),
  q: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  profile_type: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  whatsapp_connected: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  verification_status: parseAsArrayOf(parseAsString).withDefault(
    [] as string[],
  ),
  deleted: parseAsArrayOf(parseAsString).withDefault([] as string[]),
};

export function toWhatsappConnected(arr: string[]): boolean | undefined {
  if (arr.length === 0) return undefined;
  const v = arr[0]?.toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return undefined;
}

export function useProfilesList() {
  const [queryState] = useQueryStates(profilesParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const {
    q,
    status,
    profile_type,
    whatsapp_connected: whatsappConnectedArr,
    verification_status,
    deleted,
  } = queryState;

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [
    q,
    status,
    profile_type,
    whatsappConnectedArr,
    verification_status,
    deleted,
    setPage,
  ]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.q ? { q: queryState.q } : {}),
    ...(queryState.status?.length ? { status: queryState.status } : {}),
    ...(queryState.profile_type?.length
      ? { profile_type: queryState.profile_type }
      : {}),
    ...(toWhatsappConnected(queryState.whatsapp_connected ?? []) === undefined
      ? {}
      : {
          whatsapp_connected: toWhatsappConnected(
            queryState.whatsapp_connected ?? [],
          ),
        }),
    ...(queryState.verification_status?.length
      ? { verification_status: queryState.verification_status }
      : {}),
    ...(queryState.deleted?.includes("true") ? { deleted: true } : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "profiles", params],
    queryFn: () => getProfilesList(params),
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
