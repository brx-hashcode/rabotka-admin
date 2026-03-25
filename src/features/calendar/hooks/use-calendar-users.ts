import { useQuery } from "@tanstack/react-query";
import { getUsersList } from "#/lib/api/users-controller";
import type { IUser } from "#/features/calendar/interfaces";

export function useCalendarUsers() {
  return useQuery({
    queryKey: ["admin", "users", "calendar"],
    queryFn: () => getUsersList({ limit: 200 }),
    staleTime: 60_000,
    select: (res): IUser[] =>
      res.data.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        picturePath: null,
      })),
  });
}
