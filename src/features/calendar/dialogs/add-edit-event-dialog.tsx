import { zodResolver } from "@hookform/resolvers/zod";
import { format, set } from "date-fns";
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
  FormDescription,
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
  DEFAULT_EVENT_DURATION_MINUTES,
  DURATION_UNITS,
  dateToInputValue,
  fromRecurrence,
  mergeDateAndTime,
  msToDuration,
  resolveEventEnd,
  timeToInputValue,
  toRecurrenceParams,
} from "../utils";

type IProps = {
  readonly children: ReactNode;
  readonly startDate?: Date;
  readonly startTime?: { hour: number; minute: number };
  readonly event?: IEvent;
};

/**
 * One group of related fields, on its own raised surface.
 *
 * The form asks about three separate things — what the event is, when it
 * happens, and who hears about it — and reads as a single undifferentiated
 * column without something to break them apart. Grouping is what lets the
 * timing fields carry one shared line of explanation instead of one per field.
 */
function FormSection({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="bg-card shadow-soft flex flex-col gap-4 rounded-lg p-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm leading-none font-medium">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

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

  /**
   * The start, and how long the event runs — the two things the form actually
   * asks for. An existing event's stored end is folded back into a duration
   * here, so the field it came from never has to reappear.
   */
  const initialWhen = useMemo(() => {
    const defaultDuration = {
      value: DEFAULT_EVENT_DURATION_MINUTES,
      unit: "minutes" as const,
    };

    if (!isEditing && !event) {
      if (!startDate) {
        return { startDate: new Date(), duration: defaultDuration };
      }
      const start = startTime
        ? set(new Date(startDate), {
            hours: startTime.hour,
            minutes: startTime.minute,
            seconds: 0,
          })
        : new Date(startDate);
      return { startDate: start, duration: defaultDuration };
    }

    const start = new Date(event.startDate);
    return {
      startDate: start,
      duration: msToDuration(new Date(event.endDate).getTime() - start.getTime()),
    };
  }, [startDate, startTime, event, isEditing]);

  const form = useForm<TEventFormData>({
    // @ts-expect-error - zodResolver is not typed correctly
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title ?? "",
      description: event?.description ?? "",
      startDate: initialWhen.startDate,
      durationValue: initialWhen.duration.value,
      durationUnit: initialWhen.duration.unit,
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
        startDate: initialWhen.startDate,
        durationValue: initialWhen.duration.value,
        durationUnit: initialWhen.duration.unit,
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
      // The API still stores an end date; the form just never asks for one.
      endDate: format(
        resolveEventEnd(values.startDate, {
          value: values.durationValue,
          unit: values.durationUnit,
        }),
        "yyyy-MM-dd'T'HH:mm:ss",
      ),
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
                className="flex flex-col gap-3 py-4"
              >
                <FormSection title="What">
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
                            className={
                              fieldState.invalid ? "border-red-500" : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            className={
                              fieldState.invalid ? "border-red-500" : ""
                            }
                            style={{ scrollbarWidth: "none" }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>
                </FormSection>

                <FormSection title="When">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      // @ts-expect-error - form.control is not typed correctly
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Starts</FormLabel>
                          <div className="flex gap-1.5">
                            <Input
                              type="date"
                              value={dateToInputValue(field.value)}
                              onChange={(e) =>
                                field.onChange(
                                  mergeDateAndTime(
                                    e.target.value,
                                    timeToInputValue(field.value),
                                  ),
                                )
                              }
                              className="flex-1"
                            />
                            <Input
                              type="time"
                              value={timeToInputValue(field.value)}
                              onChange={(e) =>
                                field.onChange(
                                  mergeDateAndTime(
                                    dateToInputValue(field.value),
                                    e.target.value,
                                  ),
                                )
                              }
                              className="w-28"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* A length rather than a second date. The end date was the
                        field people filled with a year from now to mean "this
                        never ends", and an occurrence that long is drawn on
                        every day it covers. */}
                    <FormField
                      // @ts-expect-error - form.control is not typed correctly
                      control={form.control}
                      name="durationValue"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <div className="flex gap-1.5">
                            <Input
                              type="number"
                              min={1}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                )
                              }
                              className={`w-24 ${fieldState.invalid ? "border-red-500" : ""}`}
                            />
                            <FormField
                              // @ts-expect-error - form.control is not typed correctly
                              control={form.control}
                              name="durationUnit"
                              render={({ field: unit }) => (
                                <Select
                                  value={unit.value}
                                  onValueChange={unit.onChange}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DURATION_UNITS.map((option) => (
                                      <SelectItem
                                        value={option.value}
                                        key={option.value}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
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

                    {/* The only "ends" left in the form, and it belongs to the
                        repeat. Its date or count sits on the same row rather
                        than in a field of its own, so there is nothing below to
                        mistake for a second end. */}
                    {repeats && (
                      <FormField
                        // @ts-expect-error - form.control is not typed correctly
                        control={form.control}
                        name="repeatEndMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ends</FormLabel>
                            <div className="flex items-start gap-1.5">
                              <FormControl>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Never" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {RECURRENCE_END_MODES.map((mode) => (
                                      <SelectItem
                                        value={mode.value}
                                        key={mode.value}
                                      >
                                        {mode.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>

                              {endMode === "until" && (
                                <FormField
                                  // @ts-expect-error - form.control is not typed correctly
                                  control={form.control}
                                  name="repeatUntil"
                                  render={({
                                    field: until,
                                    fieldState: untilState,
                                  }) => (
                                    <FormItem className="w-40 gap-1.5">
                                      <Input
                                        type="date"
                                        aria-label="Repeat until"
                                        value={dateToInputValue(until.value)}
                                        onChange={(e) =>
                                          until.onChange(
                                            e.target.value
                                              ? mergeDateAndTime(
                                                  e.target.value,
                                                  "23:59",
                                                )
                                              : undefined,
                                          )
                                        }
                                        className={
                                          untilState.invalid
                                            ? "border-red-500"
                                            : ""
                                        }
                                      />
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}

                              {endMode === "count" && (
                                <FormField
                                  // @ts-expect-error - form.control is not typed correctly
                                  control={form.control}
                                  name="repeatCount"
                                  render={({
                                    field: count,
                                    fieldState: countState,
                                  }) => (
                                    <FormItem className="w-24 gap-1.5">
                                      <Input
                                        type="number"
                                        min={1}
                                        max={MAX_OCCURRENCE_COUNT}
                                        aria-label="Number of occurrences"
                                        placeholder="times"
                                        value={count.value ?? ""}
                                        onChange={(e) =>
                                          count.onChange(
                                            e.target.value
                                              ? Number(e.target.value)
                                              : undefined,
                                          )
                                        }
                                        className={
                                          countState.invalid
                                            ? "border-red-500"
                                            : ""
                                        }
                                      />
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </FormSection>

                <FormSection title="Who">
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
                        <FormDescription>
                          How everyone below is told about this event.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>
                </FormSection>
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
