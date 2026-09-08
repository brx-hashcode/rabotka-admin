import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createEvent,
  deleteEvent,
  getEventsList,
  updateEvent,
} from "#/lib/api/events-controller";
import type { CreateEventParams, UpdateEventParams } from "#/lib/api/events-controller";
import type { TEventEditScope } from "#/features/calendar/types";

export const EVENTS_QUERY_KEY = ["admin", "events"] as const;

/**
 * One cache entry per visible window. The mutations below still invalidate the
 * two-element `EVENTS_QUERY_KEY` — TanStack matches keys by prefix, so that
 * clears every range at once and needs no change.
 */
export const eventsRangeKey = (from: string, to: string) =>
  [...EVENTS_QUERY_KEY, from, to] as const;

/**
 * Events for the window currently on screen.
 *
 * This used to fetch the entire table (`limit: 500`, no filter) and slice it in
 * the browser, which silently truncated once the table passed 500 rows — by
 * `start_date asc`, so the newest events were the ones that vanished.
 */
export function useCalendarEvents(range: { from: string; to: string }) {
  return useQuery({
    queryKey: eventsRangeKey(range.from, range.to),
    queryFn: () => getEventsList({ limit: 2000, ...range }),
    select: (res) => res.data,
    // Paging to the next month is navigation, not a reload: without this the
    // key change unmounts the grid into CalendarSkeleton on every arrow press.
    placeholderData: keepPreviousData,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventParams) => createEvent(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENTS_QUERY_KEY }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEventParams }) =>
      updateEvent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENTS_QUERY_KEY }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    // An object rather than a bare id: deleting one occurrence of a series and
    // deleting the series are the same endpoint with different intent.
    mutationFn: ({ id, scope }: { id: number; scope?: TEventEditScope }) =>
      deleteEvent(id, scope),
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENTS_QUERY_KEY }),
  });
}
