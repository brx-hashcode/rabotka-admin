import { useMemo } from "react";
import { CalendarBody } from "#/features/calendar/calendar-body";
import { CalendarProvider } from "#/features/calendar/contexts/calendar-context";
import { DndProvider } from "#/features/calendar/contexts/dnd-context";
import { CalendarHeader } from "#/features/calendar/header/calendar-header";
import { useCalendarEvents } from "#/features/calendar/hooks/use-calendar-events";
import { CalendarSkeleton } from "#/features/calendar/skeletons/calendar-skeleton";
import type { IUser } from "#/features/calendar/interfaces";

export function Calendar() {
  const { data: events = [], isLoading } = useCalendarEvents();

  // Derive unique users from events already fetched — no extra API call needed
  const users = useMemo((): IUser[] => {
    const map = new Map<string, IUser>();
    for (const event of events) {
      for (const u of event.assignedUsers) {
        if (!map.has(u.id)) map.set(u.id, u);
      }
    }
    return Array.from(map.values());
  }, [events]);

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <CalendarProvider events={events} users={users} view="month">
      <DndProvider>
        <div className="w-full border rounded-xl">
          <CalendarHeader />
          <CalendarBody />
        </div>
      </DndProvider>
    </CalendarProvider>
  );
}
