import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconCamera,
  IconLoader2,
  IconPhotoUp,
  IconUser,
  IconZoomIn,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Separator } from "#/components/ui/separator";
import { agentsQueryKey } from "#/hooks/use-agents";
import {
  replaceAgentAvatar,
  updateAgent,
  uploadAgentAvatar,
  type AdminAgentDetail,
  type UpdateAgentPayload,
} from "#/lib/api/agents-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import type { ViewerDocument } from "#/pages/profile-detail/components/document-viewer-drawer";
import { AVATAR_ACCEPT, AVATAR_MAX_BYTES, zonesSchema } from "../agent-rules";
import { CameraCaptureDialog, canUseLiveCamera } from "./camera-capture-dialog";
import { ZonesEditor } from "./zones-editor";

const schema = z.object({
  firstName: z.string().trim().min(1, "Required").max(100),
  lastName: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(
      /^\+\d[\d\s().-]{7,19}$/,
      "Include the country code, e.g. +242 06 123 45 67",
    ),
  zones: zonesSchema,
});

type FormValues = z.infer<typeof schema>;

const toValues = (agent: AdminAgentDetail): FormValues => ({
  firstName: agent.firstName,
  lastName: agent.lastName,
  email: agent.email,
  phone: agent.phone,
  // Copies: the field array edits these rows in place.
  zones: agent.zones.map((z) => ({ ...z })),
});

type Props = {
  readonly agent: AdminAgentDetail;
  readonly readOnly: boolean;
  readonly onPreviewDoc: (doc: ViewerDocument) => void;
};

/**
 * The agent's details, edited in place — the same shape as the profile's
 * "Profile Information" card.
 *
 * Only the fields that changed are sent, so the activity timeline lists what
 * was actually edited. The identity document is not here: it is what was
 * checked at creation, and lives on the Identity tab.
 */
export function AgentForm({ agent, readOnly, onPreviewDoc }: Props) {
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toValues(agent),
  });

  useEffect(() => {
    form.reset(toValues(agent));
  }, [agent, form]);

  const save = useMutation({
    mutationFn: (payload: UpdateAgentPayload) => updateAgent(agent.id, payload),
    onSuccess: () => {
      toast.success("Agent updated.");
      void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
    },
    onError: (err) => toast.error(friendlyError(err, "Couldn't save. Try again.")),
  });

  const onSubmit = (values: FormValues) => {
    const dirty = form.formState.dirtyFields;
    const payload: UpdateAgentPayload = {};
    if (dirty.firstName) payload.firstName = values.firstName;
    if (dirty.lastName) payload.lastName = values.lastName;
    if (dirty.email) payload.email = values.email;
    if (dirty.phone) payload.phone = values.phone;
    // Any touch inside the array marks it; the whole list is what the API
    // replaces anyway.
    if (dirty.zones) payload.zones = values.zones;
    if (Object.keys(payload).length === 0) return;
    save.mutate(payload);
  };

  const pending = save.isPending;
  const disabled = readOnly || pending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase">
          Agent Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <AvatarHeader
          agent={agent}
          readOnly={readOnly}
          onPreviewDoc={onPreviewDoc}
        />

        <Separator />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input {...field} disabled={disabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Last Name
                    </FormLabel>
                    <FormControl>
                      <Input {...field} disabled={disabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Email (sign-in)
                    </FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled={disabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Phone (Mobile Money)
                    </FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} disabled={disabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <ZonesEditor disabled={disabled} />

            {!readOnly && (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => form.reset(toValues(agent))}
                  disabled={!form.formState.isDirty || pending}
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  disabled={!form.formState.isDirty || pending}
                >
                  {pending && <IconLoader2 className="size-4 animate-spin" />}
                  Save
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

/**
 * Photo, name and contacts. Clicking the photo enlarges it; changing it is the
 * badge, with an upload or a capture from the device camera — as on the
 * profile page, the two gestures do not share one click.
 */
function AvatarHeader({
  agent,
  readOnly,
  onPreviewDoc,
}: Readonly<{
  agent: AdminAgentDetail;
  readOnly: boolean;
  onPreviewDoc: (doc: ViewerDocument) => void;
}>) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const name = `${agent.firstName} ${agent.lastName}`;
  const initials =
    `${agent.firstName.charAt(0)}${agent.lastName.charAt(0)}`.toUpperCase();

  const replace = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > AVATAR_MAX_BYTES) {
        throw new Error("Photo too large (max 5 MB).");
      }
      const { key } = await uploadAgentAvatar(file);
      return replaceAgentAvatar(agent.id, key);
    },
    onSuccess: () => {
      toast.success("Photo updated.");
      void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
    },
    onError: (err) =>
      toast.error(friendlyError(err, "Couldn't update the photo.")),
  });

  const takePhoto = () => {
    if (canUseLiveCamera()) setCameraOpen(true);
    else captureRef.current?.click();
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() =>
            agent.avatarUrl &&
            onPreviewDoc({
              url: agent.avatarUrl,
              title: name,
              description: "Agent photo",
              fileType: "image",
            })
          }
          disabled={!agent.avatarUrl}
          aria-label={agent.avatarUrl ? `View photo of ${name}` : undefined}
          className="group relative block rounded-full enabled:cursor-zoom-in"
        >
          <Avatar className="border-border size-20 border-4 shadow-md">
            {agent.avatarUrl && (
              <AvatarImage
                src={agent.avatarUrl}
                alt={name}
                className="object-cover"
              />
            )}
            <AvatarFallback className="text-xl">
              {initials || <IconUser className="size-8" />}
            </AvatarFallback>
          </Avatar>
          {agent.avatarUrl && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <IconZoomIn className="size-6 text-white" />
            </span>
          )}
        </button>

        {!readOnly && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={replace.isPending}
                  aria-label="Change photo"
                  className="bg-background border-border hover:bg-accent absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border shadow-md transition-colors disabled:opacity-60"
                >
                  {replace.isPending ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : (
                    <IconCamera className="size-4" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                  <IconPhotoUp className="size-4" />
                  Upload a photo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={takePhoto}>
                  <IconCamera className="size-4" />
                  Take a photo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {[fileRef, captureRef].map((ref, i) => (
              <input
                key={i === 0 ? "file" : "capture"}
                ref={ref}
                type="file"
                accept={AVATAR_ACCEPT}
                capture={i === 1 ? "user" : undefined}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) replace.mutate(file);
                  e.target.value = "";
                }}
              />
            ))}
            <CameraCaptureDialog
              open={cameraOpen}
              onOpenChange={setCameraOpen}
              title="Agent photo"
              facing="user"
              onCapture={(file) => replace.mutate(file)}
            />
          </>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-lg font-semibold">{name}</p>
        <p className="text-muted-foreground truncate text-sm">{agent.email}</p>
        <p className="text-muted-foreground truncate text-xs">{agent.phone}</p>
      </div>
    </div>
  );
}
