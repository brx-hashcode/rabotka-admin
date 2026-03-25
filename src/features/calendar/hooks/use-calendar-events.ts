import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEvent,
  deleteEvent,
  getEventsList,
  updateEvent,
} from "#/lib/api/events-controller";
import type { CreateEventParams, UpdateEventParams } from "#/lib/api/events-controller";

export const EVENTS_QUERY_KEY = ["admin", "events"] as const;

export function useCalendarEvents() {
  return useQuery({
    queryKey: EVENTS_QUERY_KEY,
    queryFn: () => getEventsList({ limit: 500 }),
    select: (res) => res.data,
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
    mutationFn: (id: number) => deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENTS_QUERY_KEY }),
  });
}
