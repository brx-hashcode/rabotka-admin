

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Repeat, Text, User } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import { ScrollArea } from "#/components/ui/scroll-area";
import { useCalendar } from "#/features/calendar/contexts/calendar-context";
import { useDeleteEvent } from "#/features/calendar/hooks/use-calendar-events";
import { AddEditEventDialog } from "#/features/calendar/dialogs/add-edit-event-dialog";
import { useRole } from "#/hooks/use-role";
import { formatTime } from "#/features/calendar/helpers";
import type { IEvent } from "#/features/calendar/interfaces";
import type { TEventEditScope } from "#/features/calendar/types";
import { describeRecurrence } from "#/features/calendar/utils";
import { RecurringScopeDialog } from "./recurring-scope-dialog";

type IProps = {
  event: IEvent;
  children: ReactNode;
};

export function EventDetailsDialog({ event, children }: Readonly<IProps>) {
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  const { use24HourFormat } = useCalendar();
  const { canManageContent } = useRole();
  const [open, setOpen] = useState(false);
  const { mutate: remove, isPending } = useDeleteEvent();

  const [scopeOpen, setScopeOpen] = useState(false);

  const deleteEvent = (scope?: TEventEditScope) => {
    remove(
      { id: event.id, scope },
      {
        onSuccess: () => {
          toast.success("Event deleted successfully.");
          setOpen(false);
        },
        onError: () => toast.error("Error deleting event."),
      },
    );
  };

  const repeatSummary = describeRecurrence(event.recurrence);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-4 p-4">
            <div className="flex items-start gap-2">
              <User className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Responsible</p>
                <p className="text-sm text-muted-foreground">
                  {event.user.name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(startDate, "EEEE dd MMMM")}
                  <span className="mx-1">at</span>
                  {formatTime(parseISO(event.startDate), use24HourFormat)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">End Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(endDate, "EEEE dd MMMM")}
                  <span className="mx-1">at</span>
                  {formatTime(parseISO(event.endDate), use24HourFormat)}
                </p>
              </div>
            </div>

            {repeatSummary && (
              <div className="flex items-start gap-2">
                <Repeat className="mt-1 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Repeats</p>
                  <p className="text-sm text-muted-foreground">
                    {repeatSummary}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">
                  {event.description}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
        {canManageContent && (
          <div className="flex justify-end gap-2">
            <AddEditEventDialog event={event}>
              <Button variant="outline" disabled={isPending}>Edit</Button>
            </AddEditEventDialog>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                // A series member asks what to delete; a one-off goes straight
                // through, as it always has.
                if (event.seriesId) setScopeOpen(true);
                else deleteEvent();
              }}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        )}

        <RecurringScopeDialog
          open={scopeOpen}
          onOpenChange={setScopeOpen}
          mode="delete"
          onConfirm={deleteEvent}
        />
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}
