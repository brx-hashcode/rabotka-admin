

import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
  useMemo,
} from "react";
import { toast } from "sonner";
import { useCalendar } from "#/features/calendar/contexts/calendar-context";
import { useUpdateEvent } from "#/features/calendar/hooks/use-calendar-events";
import type { IEvent } from "#/features/calendar/interfaces";
import type { TEventEditScope } from "#/features/calendar/types";
import { RecurringScopeDialog } from "#/features/calendar/dialogs/recurring-scope-dialog";

interface DragDropContextType {
  draggedEvent: IEvent | null;
  isDragging: boolean;
  startDrag: (event: IEvent) => void;
  endDrag: () => void;
  handleEventDrop: (date: Date, hour?: number, minute?: number) => void;
}

interface DndProviderProps {
  children: ReactNode;
}

const DragDropContext = createContext<DragDropContextType | undefined>(
  undefined,
);

export function DndProvider({ children }: DndProviderProps) {
  const { updateEvent } = useCalendar();
  const { mutate: persistUpdate } = useUpdateEvent();
  const [dragState, setDragState] = useState<{
    draggedEvent: IEvent | null;
    isDragging: boolean;
  }>({ draggedEvent: null, isDragging: false });

  const onEventDroppedRef = useRef<
    ((event: IEvent, newStartDate: Date, newEndDate: Date) => void) | null
  >(null);

  const startDrag = useCallback((event: IEvent) => {
    setDragState({ draggedEvent: event, isDragging: true });
  }, []);

  const endDrag = useCallback(() => {
    setDragState({ draggedEvent: null, isDragging: false });
  }, []);

  const calculateNewDates = useCallback(
    (event: IEvent, targetDate: Date, hour?: number, minute?: number) => {
      const originalStart = new Date(event.startDate);
      const originalEnd = new Date(event.endDate);
      const duration = originalEnd.getTime() - originalStart.getTime();

      const newStart = new Date(targetDate);
      if (hour !== undefined) {
        newStart.setHours(hour, minute || 0, 0, 0);
      } else {
        newStart.setHours(
          originalStart.getHours(),
          originalStart.getMinutes(),
          0,
          0,
        );
      }

      return {
        newStart,
        newEnd: new Date(newStart.getTime() + duration),
      };
    },
    [],
  );

  const isSamePosition = useCallback((date1: Date, date2: Date) => {
    return date1.getTime() === date2.getTime();
  }, []);

  const handleEventDrop = useCallback(
    (targetDate: Date, hour?: number, minute?: number) => {
      const { draggedEvent } = dragState;
      if (!draggedEvent) return;

      const { newStart, newEnd } = calculateNewDates(
        draggedEvent,
        targetDate,
        hour,
        minute,
      );
      const originalStart = new Date(draggedEvent.startDate);

      // Check if dropped in same position
      if (isSamePosition(originalStart, newStart)) {
        endDrag();
        return;
      }

      // Instantly update event
      const callback = onEventDroppedRef.current;
      if (callback) {
        callback(draggedEvent, newStart, newEnd);
      }
      endDrag();
    },
    [dragState, calculateNewDates, isSamePosition, endDrag],
  );

  /** A drop on a series member, waiting for the user to say what it should move. */
  const [pendingDrop, setPendingDrop] = useState<{
    event: IEvent;
    startDate: string;
    endDate: string;
  } | null>(null);

  const persistMove = useCallback(
    (event: IEvent, startDate: string, endDate: string, scope?: TEventEditScope) => {
      persistUpdate(
        { id: event.id, data: { startDate, endDate, scope } },
        {
          onSuccess: () => toast.success("Event updated"),
          onError: () => toast.error("Failed to update event"),
        },
      );
    },
    [persistUpdate],
  );

  // Default event update handler
  const handleEventUpdate = useCallback(
    (event: IEvent, newStartDate: Date, newEndDate: Date) => {
      const startDate = newStartDate.toISOString();
      const endDate = newEndDate.toISOString();

      // A series member cannot move optimistically: until the user picks a
      // scope we do not know whether one occurrence moves or all of them, and
      // showing the wrong answer then correcting it is worse than a short wait.
      // Nothing was applied, so cancelling needs no undo.
      if (event.seriesId) {
        setPendingDrop({ event, startDate, endDate });
        return;
      }

      updateEvent({ ...event, startDate, endDate });
      persistMove(event, startDate, endDate);
    },
    [updateEvent, persistMove],
  );

  // Set default callback
  React.useEffect(() => {
    onEventDroppedRef.current = handleEventUpdate;
  }, [handleEventUpdate]);

  const contextValue = useMemo(
    () => ({
      draggedEvent: dragState.draggedEvent,
      isDragging: dragState.isDragging,
      startDrag,
      endDrag,
      handleEventDrop,
    }),
    [dragState, startDrag, endDrag, handleEventDrop],
  );

  return (
    <DragDropContext.Provider value={contextValue}>
      {children}
      <RecurringScopeDialog
        open={pendingDrop !== null}
        onOpenChange={(open) => !open && setPendingDrop(null)}
        mode="edit"
        onConfirm={(scope) => {
          if (!pendingDrop) return;
          const { event, startDate, endDate } = pendingDrop;
          setPendingDrop(null);
          persistMove(event, startDate, endDate, scope);
        }}
      />
    </DragDropContext.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error("useDragDrop must be used within a DragDropProvider");
  }
  return context;
}
