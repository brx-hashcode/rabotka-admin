import { useQuery } from "@tanstack/react-query";
import { getProfilesList } from "#/lib/api/profiles-controller";
import type { ICalendarProfile } from "#/features/calendar/interfaces";

export function useCalendarProfiles() {
  return useQuery({
    queryKey: ["admin", "profiles", "calendar"],
    queryFn: () => getProfilesList({ limit: 100 }),
    staleTime: 60_000,
    retry: false,
    select: (res): ICalendarProfile[] =>
      res.data.map((p) => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`.trim(),
        avatarUrl: p.avatarUrl ?? null,
      })),
  });
}
