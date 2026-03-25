import { CalendarBody } from "#/features/calendar/calendar-body";
import { CalendarProvider } from "#/features/calendar/contexts/calendar-context";
import { DndProvider } from "#/features/calendar/contexts/dnd-context";
import { CalendarHeader } from "#/features/calendar/header/calendar-header";
import { useCalendarEvents } from "#/features/calendar/hooks/use-calendar-events";
import { useCalendarUsers } from "#/features/calendar/hooks/use-calendar-users";
import { CalendarSkeleton } from "#/features/calendar/skeletons/calendar-skeleton";

export function Calendar() {
  const { data: events = [], isLoading: eventsLoading } = useCalendarEvents();
  const { data: users = [], isLoading: usersLoading } = useCalendarUsers();

  if (eventsLoading || usersLoading) {
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
