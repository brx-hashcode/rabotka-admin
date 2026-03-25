import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, format, set } from "date-fns";
import { Plus, SearchIcon, X } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
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
import { cn } from "#/lib/utils";
import { getProfilesList } from "#/lib/api/profiles-controller";
import { getUsersList } from "#/lib/api/users-controller";
import { COLORS } from "#/features/calendar/constants";
import { useDisclosure } from "#/features/calendar/hooks";
import {
  useCreateEvent,
  useUpdateEvent,
} from "#/features/calendar/hooks/use-calendar-events";
import type {
  IEvent,
  ICalendarProfile,
  IUser,
} from "#/features/calendar/interfaces";
import { eventSchema, type TEventFormData } from "#/features/calendar/schemas";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function dateToInputValue(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function timeToInputValue(d: Date) {
  return format(d, "HH:mm");
}

function mergeDateAndTime(dateStr: string, timeStr: string): Date {
  const [y, mo, day] = dateStr.split("-").map(Number);
  const [h, m] = timeStr.split(":").map(Number);
  return new Date(y, mo - 1, day, h, m, 0);
}

type AvatarPickerProps<T extends { id: string; name: string }> = {
  value: T[];
  onRemove: (id: string) => void;
  onAdd: () => void;
  getImage?: (item: T) => string | null | undefined;
  label: string;
};

function AvatarPicker<T extends { id: string; name: string }>({
  value,
  onRemove,
  onAdd,
  getImage,
  label,
}: Readonly<AvatarPickerProps<T>>) {
  return (
    <div className="flex items-center gap-2 flex-wrap min-h-9">
      {value.length === 0 && <span />}
      {value.map((item) => (
        <div key={item.id} className="relative group/avatar-item">
          <Avatar className="size-8 ring-2 ring-background">
            {getImage?.(item) && (
              <AvatarImage src={getImage(item)!} alt={item.name} />
            )}
            <AvatarFallback className="text-xs bg-muted">
              {initials(item.name)}
            </AvatarFallback>
          </Avatar>
          {/* tooltip */}
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-popover border px-1.5 py-0.5 text-xs whitespace-nowrap opacity-0 group-hover/avatar-item:opacity-100 transition-opacity pointer-events-none z-50">
            {item.name}
          </span>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover/avatar-item:opacity-100 transition-opacity"
          >
            <X className="size-2.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="size-8 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
        title={`Add ${label}`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

type ProfileSearchDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (v: boolean) => void;
  readonly selected: ICalendarProfile[];
  readonly onToggle: (item: ICalendarProfile) => void;
};

function ProfileSearchDialog({
  open,
  onOpenChange,
  selected,
  onToggle,
}: Readonly<ProfileSearchDialogProps>) {
  const [search, setSearch] = useState("");

  const { data: results = [] } = useQuery({
    queryKey: ["admin", "profiles", "event-search", search],
    queryFn: () => getProfilesList({ q: search, limit: 8 }).then((r) => r.data),
    enabled: search.trim().length >= 1,
    staleTime: 10_000,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Profile</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 border rounded-md px-3 py-2">
          <SearchIcon className="size-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search profiles…"
            className="border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {search.trim().length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">
              Type to search profiles.
            </p>
          )}
          {search.trim().length > 0 && results.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">
              No profiles found.
            </p>
          )}
          {results.map((p) => {
            const item: ICalendarProfile = {
              id: p.id,
              name: `${p.firstName} ${p.lastName}`.trim(),
            };
            const isSelected = selected.some((v) => v.id === p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onToggle(item)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-accent transition-colors",
                  isSelected && "bg-accent",
                )}
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {initials(`${p.firstName} ${p.lastName}`)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {p.firstName} {p.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {p.email}
                  </span>
                </div>
                {isSelected && (
                  <X className="size-4 text-muted-foreground ml-auto shrink-0" />
                )}
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── User search modal ───────────────────────────────────────────────────────

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selected: IUser[];
  onToggle: (item: IUser) => void;
}

function UserSearchDialog({
  open,
  onOpenChange,
  selected,
  onToggle,
}: UserSearchDialogProps) {
  const [search, setSearch] = useState("");

  const { data: results = [] } = useQuery({
    queryKey: ["admin", "users", "event-search", search],
    queryFn: () => getUsersList({ q: search, limit: 8 }).then((r) => r.data),
    enabled: search.trim().length >= 1,
    staleTime: 10_000,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 border rounded-md px-3 py-2">
          <SearchIcon className="size-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search users…"
            className="border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {search.trim().length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">
              Type to search users.
            </p>
          )}
          {search.trim().length > 0 && results.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">
              No users found.
            </p>
          )}
          {results.map((u) => {
            const item: IUser = {
              id: u.id,
              name: `${u.firstName} ${u.lastName}`.trim(),
              picturePath: null,
            };
            const isSelected = selected.some((v) => v.id === u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => onToggle(item)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-accent transition-colors",
                  isSelected && "bg-accent",
                )}
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {initials(`${u.firstName} ${u.lastName}`)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {u.firstName} {u.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {u.email}
                  </span>
                </div>
                {isSelected && (
                  <X className="size-4 text-muted-foreground ml-auto shrink-0" />
                )}
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main dialog ─────────────────────────────────────────────────────────────

interface IProps {
  readonly children: ReactNode;
  readonly startDate?: Date;
  readonly startTime?: { hour: number; minute: number };
  readonly event?: IEvent;
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

  const [profileSearchOpen, setProfileSearchOpen] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);

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
      location: event?.location ?? "",
      profileIds: event?.profiles.map((p) => p.id) ?? [],
      userIds: event?.assignedUsers.map((u) => u.id) ?? [],
    },
  });

  const [selectedProfiles, setSelectedProfiles] = useState<ICalendarProfile[]>(
    event?.profiles ?? [],
  );
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>(
    event?.assignedUsers ?? [],
  );

  useEffect(() => {
    if (isOpen) {
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
      setSelectedProfiles(event?.profiles ?? []);
      setSelectedUsers(event?.assignedUsers ?? []);
    }
  }, [isOpen, event, initialDates, form]);

  const onSubmit: SubmitHandler<TEventFormData> = (values) => {
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
    <>
      <ProfileSearchDialog
        open={profileSearchOpen}
        onOpenChange={setProfileSearchOpen}
        selected={selectedProfiles}
        onToggle={(item) => {
          const next = selectedProfiles.some((v) => v.id === item.id)
            ? selectedProfiles.filter((v) => v.id !== item.id)
            : [...selectedProfiles, item];
          setSelectedProfiles(next);
          form.setValue(
            "profileIds",
            next.map((p) => p.id),
          );
        }}
      />
      <UserSearchDialog
        open={userSearchOpen}
        onOpenChange={setUserSearchOpen}
        selected={selectedUsers}
        onToggle={(item) => {
          const next = selectedUsers.some((v) => v.id === item.id)
            ? selectedUsers.filter((v) => v.id !== item.id)
            : [...selectedUsers, item];
          setSelectedUsers(next);
          form.setValue(
            "userIds",
            next.map((u) => u.id),
          );
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
                ? "Modify your existing event."
                : "Create a new event for your calendar."}
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

                {/* Color */}
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
                          onRemove={(id) => {
                            const next = selectedProfiles.filter(
                              (p) => p.id !== id,
                            );
                            setSelectedProfiles(next);
                            form.setValue(
                              "profileIds",
                              next.map((p) => p.id),
                            );
                          }}
                          onAdd={() => setProfileSearchOpen(true)}
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
                          onRemove={(id) => {
                            const next = selectedUsers.filter(
                              (u) => u.id !== id,
                            );
                            setSelectedUsers(next);
                            form.setValue(
                              "userIds",
                              next.map((u) => u.id),
                            );
                          }}
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
