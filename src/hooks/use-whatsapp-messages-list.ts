import { useEffect, useRef } from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getWhatsappMessages } from "#/lib/api/whatsapp-controller";
import { appConfig } from "#/config";

// Has to be the same default the table footer paginates with
// (`appConfig.defaultPaginationLimit`): when the two disagree, the page
// numbers and the "showing X-Y of N" range describe a page size the request
// never used.

export const whatsappMessagesParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(appConfig.defaultPaginationLimit),
  q: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  template_key: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  kind: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  provider: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  created_from: parseAsString.withDefault(""),
  created_to: parseAsString.withDefault(""),
};

export function useWhatsappMessagesList() {
  const [queryState] = useQueryStates(whatsappMessagesParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const { q, status, template_key, kind, provider, created_from, created_to } =
    queryState;

  // Changing a filter has to reset to page 1, or a narrowed result set lands
  // the reader on a page that no longer exists and looks empty.
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [
    q,
    status,
    template_key,
    kind,
    provider,
    created_from,
    created_to,
    setPage,
  ]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.q ? { q: queryState.q } : {}),
    ...(queryState.status?.length ? { status: queryState.status } : {}),
    ...(queryState.template_key?.length
      ? { template_key: queryState.template_key }
      : {}),
    ...(queryState.kind?.length ? { kind: queryState.kind } : {}),
    ...(queryState.provider?.length ? { provider: queryState.provider } : {}),
    ...(queryState.created_from ? { created_from: queryState.created_from } : {}),
    ...(queryState.created_to ? { created_to: queryState.created_to } : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "whatsapp", "messages", params],
    queryFn: () => getWhatsappMessages(params),
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
