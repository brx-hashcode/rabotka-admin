import { useQuery } from "@tanstack/react-query";
import { getProfilesList } from "#/lib/api/profiles-controller";
import type { ICalendarProfile } from "#/features/calendar/interfaces";

export function useCalendarProfiles() {
  return useQuery({
    queryKey: ["admin", "profiles", "calendar"],
    queryFn: () => getProfilesList({ limit: 200 }),
    staleTime: 60_000,
    select: (res): ICalendarProfile[] =>
      res.data.map((p) => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`.trim(),
      })),
  });
}
