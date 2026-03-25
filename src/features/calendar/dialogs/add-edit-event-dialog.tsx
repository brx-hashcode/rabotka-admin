import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, format, set } from "date-fns";
import { type ReactNode, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { DateTimePicker } from "#/components/ui/date-time-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "#/components/ui/responsive-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { COLORS } from "#/features/calendar/constants";
import { useDisclosure } from "#/features/calendar/hooks";
import {
  useCreateEvent,
  useUpdateEvent,
} from "#/features/calendar/hooks/use-calendar-events";
import { useCalendarProfiles } from "#/features/calendar/hooks/use-calendar-profiles";
import { useCalendarUsers } from "#/features/calendar/hooks/use-calendar-users";
import type { IEvent } from "#/features/calendar/interfaces";
import { eventSchema, type TEventFormData } from "#/features/calendar/schemas";

interface IProps {
  children: ReactNode;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
  event?: IEvent;
}

export function AddEditEventDialog({
  children,
  startDate,
  startTime,
  event,
}: IProps) {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const isEditing = !!event;

  const { mutate: create, isPending: isCreating } = useCreateEvent();
  const { mutate: update, isPending: isUpdating } = useUpdateEvent();
  const { data: profiles = [] } = useCalendarProfiles();
  const { data: users = [] } = useCalendarUsers();

  const isPending = isCreating || isUpdating;

  const initialDates = useMemo(() => {
    if (!isEditing) {
      if (!startDate) {
        const now = new Date();
        return { startDate: now, endDate: addMinutes(now, 30) };
      }
      const start = startTime
        ? set(new Date(startDate), {
            hours: startTime.hour,
            minutes: startTime.minute,
            seconds: 0,
          })
        : new Date(startDate);
      return { startDate: start, endDate: addMinutes(start, 30) };
    }
    return {
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
    };
  }, [startDate, startTime, event, isEditing]);

  const form = useForm<TEventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title ?? "",
      description: event?.description ?? "",
      startDate: initialDates.startDate,
      endDate: initialDates.endDate,
      color: event?.color ?? "blue",
      location: event?.location ?? "",
      profileIds: event?.profiles.map((p) => p.id) ?? [],
      userIds: event?.assignedUsers.map((u) => u.id) ?? [],
    },
  });

  useEffect(() => {
    form.reset({
      title: event?.title ?? "",
      description: event?.description ?? "",
      startDate: initialDates.startDate,
      endDate: initialDates.endDate,
      color: event?.color ?? "blue",
      location: event?.location ?? "",
      profileIds: event?.profiles.map((p) => p.id) ?? [],
      userIds: event?.assignedUsers.map((u) => u.id) ?? [],
    });
  }, [event, initialDates, form]);

  const onSubmit = (values: TEventFormData) => {
    const payload = {
      title: values.title,
      description: values.description,
      startDate: format(values.startDate, "yyyy-MM-dd'T'HH:mm:ss"),
      endDate: format(values.endDate, "yyyy-MM-dd'T'HH:mm:ss"),
      color: values.color,
      location: values.location || undefined,
      profileIds: values.profileIds,
      userIds: values.userIds,
    };

    if (isEditing) {
      update(
        { id: event.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Event updated successfully");
            onClose();
            form.reset();
          },
          onError: () => toast.error("Failed to update event"),
        },
      );
    } else {
      create(payload, {
        onSuccess: () => {
          toast.success("Event created successfully");
          onClose();
          form.reset();
        },
        onError: () => toast.error("Failed to create event"),
      });
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onToggle} modal={false}>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{isEditing ? "Edit Event" : "Add New Event"}</ModalTitle>
          <ModalDescription>
            {isEditing
              ? "Modify your existing event."
              : "Create a new event for your calendar."}
          </ModalDescription>
        </ModalHeader>

        <Form {...form}>
          <form
            id="event-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel htmlFor="title" className="required">
                    Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="title"
                      placeholder="Enter a title"
                      {...field}
                      className={fieldState.invalid ? "border-red-500" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <DateTimePicker form={form} field={field} />
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <DateTimePicker form={form} field={field} />
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="required">Variant</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className={`w-full ${fieldState.invalid ? "border-red-500" : ""}`}
                      >
                        <SelectValue placeholder="Select a variant" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLORS.map((color) => (
                          <SelectItem value={color} key={color}>
                            <div className="flex items-center gap-2">
                              <div
                                className={`size-3.5 rounded-full bg-${color}-600 dark:bg-${color}-700`}
                              />
                              {color}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a location (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profileIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profiles</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(val) => {
                        const current = field.value ?? [];
                        field.onChange(
                          current.includes(val)
                            ? current.filter((id) => id !== val)
                            : [...current, val],
                        );
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            field.value?.length
                              ? `${field.value.length} profile(s) selected`
                              : "Select profiles"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <div className="flex items-center gap-2">
                              {field.value?.includes(p.id) && (
                                <span className="text-primary">✓</span>
                              )}
                              {p.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned users</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(val) => {
                        const current = field.value ?? [];
                        field.onChange(
                          current.includes(val)
                            ? current.filter((id) => id !== val)
                            : [...current, val],
                        );
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            field.value?.length
                              ? `${field.value.length} user(s) selected`
                              : "Select users"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            <div className="flex items-center gap-2">
                              {field.value?.includes(u.id) && (
                                <span className="text-primary">✓</span>
                              )}
                              {u.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="required">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter a description"
                      className={fieldState.invalid ? "border-red-500" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <ModalFooter className="flex justify-end gap-2">
          <ModalClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </ModalClose>
          <Button form="event-form" type="submit" disabled={isPending}>
            {isPending
              ? isEditing
                ? "Saving…"
                : "Creating…"
              : isEditing
                ? "Save Changes"
                : "Create Event"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
