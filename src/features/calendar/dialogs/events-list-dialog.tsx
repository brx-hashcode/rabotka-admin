import { format } from "date-fns";
import { useState, type ReactNode } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "#/components/ui/responsive-modal";
import { cn } from "#/lib/utils";
import { useCalendar } from "#/features/calendar/contexts/calendar-context";
import { formatTime } from "#/features/calendar/helpers";
import type { IEvent } from "#/features/calendar/interfaces";
import { dayCellVariants } from "#/features/calendar/views/month-view/day-cell";
import { EventBullet } from "#/features/calendar/views/month-view/event-bullet";
import { EventDetailsDialog } from "#/features/calendar/dialogs/event-details-dialog";
import { Button } from "#/components/ui/button";

interface EventListDialogProps {
  date: Date;
  events: IEvent[];
  maxVisibleEvents?: number;
  children?: ReactNode;
}

export function EventListDialog({
  date,
  events,
  maxVisibleEvents = 3,
  children,
}: Readonly<EventListDialogProps>) {
  const cellEvents = events;
  const hiddenEventsCount = Math.max(cellEvents.length - maxVisibleEvents, 0);
  const { badgeVariant, use24HourFormat } = useCalendar();

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const defaultTrigger = (
    <span className="cursor-pointer">
      <span className="sm:hidden">+{hiddenEventsCount}</span>
      <span className="hidden sm:inline py-0.5 px-2 my-1 rounded-xl border">
        {hiddenEventsCount}
        <span className="mx-1">more...</span>
      </span>
    </span>
  );

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        {children || defaultTrigger}
      </Button>

      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalContent className="sm:max-w-[425px] space-y-4">
          <ModalHeader>
            <ModalTitle className="my-2">
              <div className="flex items-center gap-2">
                <EventBullet color={cellEvents[0]?.color} className="" />
                <p className="text-sm font-medium">
                  Events on {format(date, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </ModalTitle>
          </ModalHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {cellEvents.length > 0 ? (
              cellEvents.map((event: IEvent) => (
                <EventDetailsDialog event={event} key={event.id}>
                  <div
                    className={cn(
                      "flex items-start gap-2 p-2 border rounded-md hover:bg-muted cursor-pointer",
                      {
                        [dayCellVariants({ color: event.color })]:
                          badgeVariant === "colored",
                      },
                    )}
                  >
                    <EventBullet
                      color={event.color}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="flex flex-col w-full min-w-0">
                      <p className="text-sm font-medium truncate">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>
                          {formatTime(event.startDate, use24HourFormat)} –{" "}
                          {formatTime(event.endDate, use24HourFormat)}
                        </span>
                        {event.location && (
                          <>
                            <span>·</span>
                            <span className="truncate">{event.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </EventDetailsDialog>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No events for this date.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}
