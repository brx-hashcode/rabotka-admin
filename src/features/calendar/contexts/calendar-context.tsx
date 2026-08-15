

import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "#/features/calendar/hooks";
import { getVisibleRange } from "#/features/calendar/helpers";
import { useCalendarEvents } from "#/features/calendar/hooks/use-calendar-events";
import type { IEvent, IUser } from "#/features/calendar/interfaces";
import type { TCalendarView, TEventColor } from "#/features/calendar/types";

interface ICalendarContext {
  selectedDate: Date;
  view: TCalendarView;
  setView: (view: TCalendarView) => void;
  agendaModeGroupBy: "date" | "color";
  setAgendaModeGroupBy: (groupBy: "date" | "color") => void;
  use24HourFormat: boolean;
  toggleTimeFormat: () => void;
  setSelectedDate: (date: Date | undefined) => void;
  selectedUserId: IUser["id"] | "all";
  setSelectedUserId: (userId: IUser["id"] | "all") => void;
  badgeVariant: "dot" | "colored";
  setBadgeVariant: (variant: "dot" | "colored") => void;
  selectedColors: TEventColor[];
  filterEventsBySelectedColors: (colors: TEventColor) => void;
  filterEventsBySelectedUser: (userId: IUser["id"] | "all") => void;
  users: IUser[];
  events: IEvent[];
  isLoading: boolean;
  addEvent: (event: IEvent) => void;
  updateEvent: (event: IEvent) => void;
  removeEvent: (eventId: number) => void;
  clearFilter: () => void;
}

interface CalendarSettings {
  badgeVariant: "dot" | "colored";
  view: TCalendarView;
  use24HourFormat: boolean;
  agendaModeGroupBy: "date" | "color";
}

const DEFAULT_SETTINGS: CalendarSettings = {
  badgeVariant: "colored",
  view: "day",
  use24HourFormat: true,
  agendaModeGroupBy: "date",
};

const CalendarContext = createContext({} as ICalendarContext);

/**
 * Owns the calendar's view state *and* its data.
 *
 * The fetch lives here rather than in `Calendar` because the window to fetch is
 * derived from `selectedDate` + `currentView`, which are declared below — when
 * the query sat above the provider it had no way to see them, so it asked for
 * every event in the table.
 */
export function CalendarProvider({
  children,
  badge = "colored",
  view = "day",
}: Readonly<{
  children: React.ReactNode;
  view?: TCalendarView;
  badge?: "dot" | "colored";
}>) {
  const [settings, setSettings] = useLocalStorage<CalendarSettings>(
    "calendar-settings",
    {
      ...DEFAULT_SETTINGS,
      badgeVariant: badge,
      view: view,
    },
  );

  const [badgeVariant, setBadgeVariantState] = useState<"dot" | "colored">(
    settings.badgeVariant,
  );
  const [currentView, setCurrentViewState] = useState<TCalendarView>(
    settings.view,
  );
  const [use24HourFormat, setUse24HourFormatState] = useState<boolean>(
    settings.use24HourFormat,
  );
  const [agendaModeGroupBy, setAgendaModeGroupByState] = useState<
    "date" | "color"
  >(settings.agendaModeGroupBy);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<IUser["id"] | "all">(
    "all",
  );
  const [selectedColors, setSelectedColors] = useState<TEventColor[]>([]);

  const visibleRange = useMemo(
    () => getVisibleRange(currentView, selectedDate),
    [currentView, selectedDate],
  );
  const { data: fetchedEvents, isLoading } = useCalendarEvents(visibleRange);

  // Local mirror of the fetched window, so the drag/resize handlers can move an
  // event optimistically before the PATCH comes back.
  const [allEvents, setAllEvents] = useState<IEvent[]>([]);

  useEffect(() => {
    setAllEvents(fetchedEvents ?? []);
    // Deliberately no filter reset here. This effect used to clear the colour
    // and user filters whenever `events` changed — harmless when that happened
    // only on invalidation, but now the identity changes every time the user
    // pages to another month, which would drop their filters mid-browse.
  }, [fetchedEvents]);

  const users = useMemo((): IUser[] => {
    const map = new Map<string, IUser>();
    for (const event of allEvents) {
      for (const u of event.assignedUsers) {
        if (!map.has(u.id)) map.set(u.id, u);
      }
    }
    return Array.from(map.values());
  }, [allEvents]);

  // Derived, not stored. As two pieces of state they overwrote each other:
  // picking a colour recomputed from `allEvents` ignoring the selected user,
  // and vice versa, so only the most recent filter ever applied.
  const filteredEvents = useMemo(
    () =>
      allEvents.filter((event) => {
        const colorMatches =
          selectedColors.length === 0 ||
          selectedColors.includes(event.color || "blue");
        const userMatches =
          selectedUserId === "all" || event.user.id === selectedUserId;
        return colorMatches && userMatches;
      }),
    [allEvents, selectedColors, selectedUserId],
  );

  const updateSettings = (newPartialSettings: Partial<CalendarSettings>) => {
    setSettings({
      ...settings,
      ...newPartialSettings,
    });
  };

  const setBadgeVariant = (variant: "dot" | "colored") => {
    setBadgeVariantState(variant);
    updateSettings({ badgeVariant: variant });
  };

  const setView = (newView: TCalendarView) => {
    setCurrentViewState(newView);
    updateSettings({ view: newView });
  };

  const toggleTimeFormat = () => {
    const newValue = !use24HourFormat;
    setUse24HourFormatState(newValue);
    updateSettings({ use24HourFormat: newValue });
  };

  const setAgendaModeGroupBy = (groupBy: "date" | "color") => {
    setAgendaModeGroupByState(groupBy);
    updateSettings({ agendaModeGroupBy: groupBy });
  };

  // Both filters only move state now — `filteredEvents` above recomputes from
  // whichever combination is selected, so they compose instead of clobbering.
  const filterEventsBySelectedColors = (color: TEventColor) => {
    setSelectedColors((prev) =>
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : [...prev, color],
    );
  };

  const filterEventsBySelectedUser = (userId: IUser["id"] | "all") => {
    setSelectedUserId(userId);
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  const addEvent = (event: IEvent) => {
    setAllEvents((prev) => [...prev, event]);
  };

  const updateEvent = (event: IEvent) => {
    const updated = {
      ...event,
      startDate: new Date(event.startDate).toISOString(),
      endDate: new Date(event.endDate).toISOString(),
    };

    setAllEvents((prev) => prev.map((e) => (e.id === event.id ? updated : e)));
  };

  const removeEvent = (eventId: number) => {
    setAllEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const clearFilter = () => {
    setSelectedColors([]);
    setSelectedUserId("all");
  };

  const value = {
    selectedDate,
    setSelectedDate: handleSelectDate,
    selectedUserId,
    setSelectedUserId,
    badgeVariant,
    setBadgeVariant,
    users,
    selectedColors,
    filterEventsBySelectedColors,
    filterEventsBySelectedUser,
    events: filteredEvents,
    isLoading,
    view: currentView,
    use24HourFormat,
    toggleTimeFormat,
    setView,
    agendaModeGroupBy,
    setAgendaModeGroupBy,
    addEvent,
    updateEvent,
    removeEvent,
    clearFilter,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext);
  if (!context)
    throw new Error("useCalendar must be used within a CalendarProvider.");
  return context;
}
