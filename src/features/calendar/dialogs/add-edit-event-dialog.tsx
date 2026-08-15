import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, format, set } from "date-fns";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import {
  COLORS,
  MAX_OCCURRENCE_COUNT,
  RECURRENCE_END_MODES,
  REPEAT_PRESETS,
} from "#/features/calendar/constants";
import { RecurringScopeDialog } from "./recurring-scope-dialog";
import type { TEventEditScope } from "#/features/calendar/types";
import type { UpdateEventParams } from "#/lib/api/events-controller";
import { useDisclosure } from "#/features/calendar/hooks";
import {
  useCreateEvent,
  useUpdateEvent,
} from "#/features/calendar/hooks/use-calendar-events";
import { useSelectedItems } from "#/features/calendar/hooks/use-selected-items";
import { AvatarPicker } from "#/features/calendar/components/avatar-picker";
import { ProfileSearchDialog } from "./profile-search-dialog";
import { UserSearchDialog } from "./user-search-dialog";
import type {
  IEvent,
  ICalendarProfile,
  IUser,
} from "#/features/calendar/interfaces";
import { eventSchema, type TEventFormData } from "#/features/calendar/schemas";
import {
  dateToInputValue,
  fromRecurrence,
  mergeDateAndTime,
  timeToInputValue,
  toRecurrenceParams,
} from "../utils";

type IProps = {
  readonly children: ReactNode;
  readonly startDate?: Date;
  readonly startTime?: { hour: number; minute: number };
  readonly event?: IEvent;
};

export function AddEditEventDialog({
  children,
  startDate,
  startTime,
  event,
}: Readonly<IProps>) {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const { mutate: create, isPending: isCreating } = useCreateEvent();
  const { mutate: update, isPending: isUpdating } = useUpdateEvent();
  const isEditing = !!event;
  const isPending = isCreating || isUpdating;

  const {
    items: selectedProfiles,
    toggle: toggleProfile,
    remove: removeProfile,
    reset: resetProfiles,
    getIds: getProfileIds,
  } = useSelectedItems<ICalendarProfile>(event?.profiles ?? []);

  const {
    items: selectedUsers,
    toggle: toggleUser,
    remove: removeUser,
    reset: resetUsers,
    getIds: getUserIds,
  } = useSelectedItems<IUser>(event?.assignedUsers ?? []);

  const initialDates = useMemo(() => {
    if (!isEditing && !event) {
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
    // @ts-expect-error - zodResolver is not typed correctly
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title ?? "",
      description: event?.description ?? "",
      startDate: initialDates.startDate,
      endDate: initialDates.endDate,
      color: event?.color ?? "blue",
      channel: event?.channel ?? "EMAIL",
      location: event?.location ?? "",
      profileIds: getProfileIds(),
      userIds: getUserIds(),
      ...fromRecurrence(event?.recurrence),
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: event?.title ?? "",
        description: event?.description ?? "",
        startDate: initialDates.startDate,
        endDate: initialDates.endDate,
        color: event?.color ?? "blue",
        channel: event?.channel ?? "EMAIL",
        location: event?.location ?? "",
        profileIds: getProfileIds(),
        userIds: getUserIds(),
        ...fromRecurrence(event?.recurrence),
      });
      resetProfiles(event?.profiles ?? []);
      resetUsers(event?.assignedUsers ?? []);
    }
  }, [isOpen, event?.id]);

  /** Held between the submit and the scope choice, for a series edit. */
  const [pendingEdit, setPendingEdit] = useState<UpdateEventParams | null>(null);

  const submitUpdate = (data: UpdateEventParams) => {
    update(
      { id: event!.id, data },
      {
        onSuccess: () => {
          toast.success("Event updated successfully");
          onClose();
          form.reset();
        },
        onError: () => toast.error("Failed to update event"),
      },
    );
  };

  const onSubmit: SubmitHandler<TEventFormData> = (values) => {
    const payload = {
      title: values.title,
      description: values.description,
      startDate: format(values.startDate, "yyyy-MM-dd'T'HH:mm:ss"),
      endDate: format(values.endDate, "yyyy-MM-dd'T'HH:mm:ss"),
      color: values.color,
      channel: values.channel,
      location: values.location || undefined,
      profileIds: getProfileIds(),
      userIds: getUserIds(),
      recurrence: toRecurrenceParams(values),
    };

    if (!isEditing) {
      create(payload, {
        onSuccess: () => {
          toast.success("Event created successfully");
          onClose();
          form.reset();
        },
        onError: () => toast.error("Failed to create event"),
      });
      return;
    }

    // Editing one occurrence of a series: ask what it should reach before
    // sending anything, the way Google does.
    if (event.seriesId) {
      setPendingEdit(payload);
      return;
    }

    submitUpdate(payload);
  };

  const [profileSearchOpen, setProfileSearchOpen] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);

  // Watched so the end-condition fields appear and disappear with the choice
  // above them.
  const repeats = form.watch("repeatFrequency") !== "NONE";
  const endMode = form.watch("repeatEndMode");

  const handleProfileToggle = (item: ICalendarProfile) => {
    toggleProfile(item);
    form.setValue("profileIds", getProfileIds());
  };

  const handleUserToggle = (item: IUser) => {
    toggleUser(item);
    form.setValue("userIds", getUserIds());
  };

  const handleProfileRemove = (id: string) => {
    removeProfile(id);
    form.setValue("profileIds", getProfileIds());
  };

  const handleUserRemove = (id: string) => {
    removeUser(id);
    form.setValue("userIds", getUserIds());
  };

  return (
    <>
      <ProfileSearchDialog
        open={profileSearchOpen}
        onOpenChange={setProfileSearchOpen}
        selected={selectedProfiles}
        onToggle={handleProfileToggle}
      />
      <UserSearchDialog
        open={userSearchOpen}
        onOpenChange={setUserSearchOpen}
        selected={selectedUsers}
        onToggle={handleUserToggle}
      />

      <RecurringScopeDialog
        open={pendingEdit !== null}
        onOpenChange={(open) => !open && setPendingEdit(null)}
        mode="edit"
        onConfirm={(scope: TEventEditScope) => {
          if (!pendingEdit) return;
          // A single occurrence has no rule of its own, so a repeat change
          // scoped to it would be silently dropped by the server.
          const data =
            scope === "THIS"
              ? { ...pendingEdit, recurrence: undefined }
              : pendingEdit;
          setPendingEdit(null);
          submitUpdate({ ...data, scope });
        }}
      />

      <Dialog open={isOpen} onOpenChange={onToggle}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
            <DialogTitle>
              {isEditing ? "Edit Event" : "Add New Event"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modify your existing event. Update details such as the title, participants, or timing as needed."
                : "Create a new event for your calendar. Fill in the event details, add participants, and set the date and time."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <Form {...form}>
              <form
                id="event-form"
                // @ts-expect-error - form.handleSubmit is not typed correctly
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-4 py-4"
              >
                {/* Title */}
                <FormField
                  // @ts-expect-error - form.control is not typed correctly
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    // @ts-expect-error - form.control is not typed correctly
                    control={form.control}
                    name="color"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="required">Variant</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
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
                    // @ts-expect-error - form.control is not typed correctly
                    control={form.control}
                    name="channel"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="required">
                          Delivery Channel
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger
                              className={`w-full ${fieldState.invalid ? "border-red-500" : ""}`}
                            >
                              <SelectValue placeholder="Select a channel" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EMAIL">EMAIL</SelectItem>
                              <SelectItem value="WHATSAPP">WHATSAPP</SelectItem>
                              <SelectItem value="ALL">ALL</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Location */}
                <FormField
                  // @ts-expect-error - form.control is not typed correctly
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter a location (optional)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    // @ts-expect-error - form.control is not typed correctly
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <div className="flex gap-1.5">
                          <Input
                            type="date"
                            value={dateToInputValue(field.value)}
                            onChange={(e) => {
                              field.onChange(
                                mergeDateAndTime(
                                  e.target.value,
                                  timeToInputValue(field.value),
                                ),
                              );
                            }}
                            className="flex-1"
                          />
                          <Input
                            type="time"
                            value={timeToInputValue(field.value)}
                            onChange={(e) => {
                              field.onChange(
                                mergeDateAndTime(
                                  dateToInputValue(field.value),
                                  e.target.value,
                                ),
                              );
                            }}
                            className="w-28"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    // @ts-expect-error - form.control is not typed correctly
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <div className="flex gap-1.5">
                          <Input
                            type="date"
                            value={dateToInputValue(field.value)}
                            onChange={(e) => {
                              field.onChange(
                                mergeDateAndTime(
                                  e.target.value,
                                  timeToInputValue(field.value),
                                ),
                              );
                            }}
                            className="flex-1"
                          />
                          <Input
                            type="time"
                            value={timeToInputValue(field.value)}
                            onChange={(e) => {
                              field.onChange(
                                mergeDateAndTime(
                                  dateToInputValue(field.value),
                                  e.target.value,
                                ),
                              );
                            }}
                            className="w-28"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Repeat */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    // @ts-expect-error - form.control is not typed correctly
                    control={form.control}
                    name="repeatFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repeat</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Does not repeat" />
                            </SelectTrigger>
                            <SelectContent>
                              {REPEAT_PRESETS.map((preset) => (
                                <SelectItem
                                  value={preset.value}
                                  key={preset.value}
                                >
                                  {preset.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Only meaningful once something repeats — an end condition
                      for a one-off event is a question with no answer. */}
                  {repeats && (
                    <FormField
                      // @ts-expect-error - form.control is not typed correctly
                      control={form.control}
                      name="repeatEndMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ends</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Never" />
                              </SelectTrigger>
                              <SelectContent>
                                {RECURRENCE_END_MODES.map((mode) => (
                                  <SelectItem value={mode.value} key={mode.value}>
                                    {mode.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {repeats && endMode === "until" && (
                  <FormField
                    // @ts-expect-error - form.control is not typed correctly
                    control={form.control}
                    name="repeatUntil"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Repeat until</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={dateToInputValue(field.value)}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? mergeDateAndTime(e.target.value, "23:59")
                                  : undefined,
                              )
                            }
                            className={fieldState.invalid ? "border-red-500" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {repeats && endMode === "count" && (
                  <FormField
                    // @ts-expect-error - form.control is not typed correctly
                    control={form.control}
                    name="repeatCount"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Number of occurrences</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={MAX_OCCURRENCE_COUNT}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                            className={fieldState.invalid ? "border-red-500" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Profiles */}
                <FormField
                  // @ts-expect-error - form.control is not typed correctly
                  control={form.control}
                  name="profileIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Profiles</FormLabel>
                      <FormControl>
                        <AvatarPicker
                          value={selectedProfiles}
                          onRemove={handleProfileRemove}
                          onAdd={() => setProfileSearchOpen(true)}
                          getImage={(p) => p.avatarUrl}
                          label="profiles"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Assigned users */}
                <FormField
                  // @ts-expect-error - form.control is not typed correctly
                  control={form.control}
                  name="userIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Assigned users</FormLabel>
                      <FormControl>
                        <AvatarPicker
                          value={selectedUsers}
                          onRemove={handleUserRemove}
                          onAdd={() => setUserSearchOpen(true)}
                          getImage={(u) => u.picturePath ?? undefined}
                          label="users"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  // @ts-expect-error - form.control is not typed correctly
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
                          style={{ scrollbarWidth: "none" }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          <DialogFooter className="shrink-0 flex justify-end gap-2 px-6 pb-6 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button form="event-form" type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? "Saving…"
                  : "Creating…"
                : isEditing
                  ? "Save Changes"
                  : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
