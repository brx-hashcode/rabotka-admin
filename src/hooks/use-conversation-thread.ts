import { useInfiniteQuery } from "@tanstack/react-query";
import { getConversationMessages } from "#/lib/api/conversations-controller";

const PAGE_SIZE = 50;

export const conversationKeys = {
  thread: (id: string) => ["admin", "conversations", "thread", id] as const,
};

/**
 * The messages of one conversation, oldest first, a page at a time.
 *
 * `enabled` is the role gate and it is not a courtesy: without it every
 * MODERATOR opening a detail page fires a request that 403s, filling the server
 * log with refusals — and, worse, asking the server to do a read whose audit
 * row would be written a line after the role check. The page decides; the
 * server still refuses independently.
 *
 * The API paginates newest-first for the same reason the end-user one does: the
 * newest page is the one worth having first. A thread READS oldest-first, so
 * the flattened pages are reversed here, once.
 */
export function useConversationThread(id: string, enabled: boolean) {
  const query = useInfiniteQuery({
    queryKey: conversationKeys.thread(id),
    queryFn: ({ pageParam }) =>
      getConversationMessages(id, { page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, page) => n + page.data.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled: enabled && Boolean(id),
    // Each fetch writes an audit row, so refetching on a window focus would
    // record reads nobody performed.
    refetchOnWindowFocus: false,
  });

  const pages = query.data?.pages ?? [];

  return {
    // Pages arrive newest-first and each page is newest-first within itself, so
    // the whole run reverses into reading order.
    messages: pages.flatMap((page) => page.data).reverse(),
    total: pages[0]?.total ?? 0,
    hasOlder: Boolean(query.hasNextPage),
    loadOlder: query.fetchNextPage,
    isLoadingOlder: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
