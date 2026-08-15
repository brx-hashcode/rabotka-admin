import { CalendarBody } from "#/features/calendar/calendar-body";
import {
  CalendarProvider,
  useCalendar,
} from "#/features/calendar/contexts/calendar-context";
import { DndProvider } from "#/features/calendar/contexts/dnd-context";
import { CalendarHeader } from "#/features/calendar/header/calendar-header";
import { CalendarSkeleton } from "#/features/calendar/skeletons/calendar-skeleton";

export function Calendar() {
  return (
    <CalendarProvider view="month">
      <CalendarShell />
    </CalendarProvider>
  );
}

/**
 * Split from `Calendar` only so it can sit *inside* the provider and read
 * `isLoading` from it — the fetch moved down there, because the window it asks
 * for depends on the provider's own `selectedDate` and `view`.
 *
 * Only the first load reaches the skeleton: paging to another month keeps the
 * previous window on screen (`placeholderData` in `useCalendarEvents`).
 */
function CalendarShell() {
  const { isLoading } = useCalendar();

  if (isLoading) return <CalendarSkeleton />;

  return (
    <DndProvider>
      <div className="w-full border rounded-xl">
        <CalendarHeader />
        <CalendarBody />
      </div>
    </DndProvider>
  );
}
