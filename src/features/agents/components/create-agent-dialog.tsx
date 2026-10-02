import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { agentsQueryKey } from "#/hooks/use-agents";
import {
  createAgent,
  uploadAgentAvatar,
  uploadAgentKycFile,
  type AgentDocumentType,
  type AgentKycCategory,
} from "#/lib/api/agents-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  AVATAR_ACCEPT,
  AVATAR_MAX_BYTES,
  DOCUMENT_TYPE_OPTIONS,
  emptyZone,
  KYC_ACCEPT,
  KYC_MAX_BYTES,
  cameraFor,
  KYC_CATEGORY_LABELS,
  kycRefsFor,
  missingKycCategories,
  requiredKycCategories,
  zonesSchema,
} from "../agent-rules";
import { FileSlot } from "./file-slot";
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
  idDocumentType: z.enum(["IDENTITY_CARD", "PASSPORT", "DRIVER_LICENSE", "NIU_CARD"]),
  idDocumentNumber: z.string().trim().min(1, "Required").max(64),
  zones: zonesSchema,
});

type FormValues = z.infer<typeof schema>;

/** A function, so each reset starts from a fresh zone row. */
const defaults = (): FormValues => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "+242 ",
  idDocumentType: "IDENTITY_CARD",
  idDocumentNumber: "",
  zones: [emptyZone()],
});

type Props = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
};


export function CreateAgentDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(),
  });

  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);
  const [kycKeys, setKycKeys] = useState<
    Partial<Record<AgentKycCategory, string>>
  >({});
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [session, setSession] = useState(0);

  useEffect(() => {
    if (!open) {
      form.reset(defaults());
      setKycKeys({});
      setAvatarKey(null);
      setAttempted(false);
      setSession((s) => s + 1);
    }
  }, [open, form]);

  const documentType = form.watch("idDocumentType") as AgentDocumentType;
  const missing = missingKycCategories(documentType, kycKeys);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createAgent({
        ...values,
        kycDocuments: kycRefsFor(values.idDocumentType, kycKeys),
        ...(avatarKey ? { avatarKey } : {}),
      }),
    onSuccess: (agent) => {
      void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
      toast.success(
        `${agent.firstName} ${agent.lastName} can now sign in with ${agent.email}.`,
      );
      onOpenChange(false);
      void navigate({ to: "/agents/$agentId", params: { agentId: agent.id } });
    },
  });

  const onSubmit = (values: FormValues) => {
    setAttempted(true);
    if (missing.length > 0) return;
    mutation.mutate(values);
  };

  const pending = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={pending ? undefined : onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>New agent</DialogTitle>
          <DialogDescription>
            Agents sign in to the agent app with this email and a one-time code.
            They see only the jobs in their zones, and never an employer's
            contact details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, () => setAttempted(true))}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pb-6">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold">Identity</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-start">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={pending} />
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
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={pending} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} disabled={pending} />
                        </FormControl>
                        <FormDescription>Used to sign in.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} disabled={pending} />
                        </FormControl>
                        <FormDescription>
                          Default Mobile Money number for payouts.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="idDocumentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID document</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={pending}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DOCUMENT_TYPE_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="idDocumentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document number</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={pending} />
                        </FormControl>
                        <FormDescription>
                          As printed. One agent per document.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Documents</h3>
                <div
                  key={session}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <FileSlot
                    label="Photo"
                    hint="Optional. Shown in the agent app."
                    accept={AVATAR_ACCEPT}
                    maxBytes={AVATAR_MAX_BYTES}
                    upload={async (file) => (await uploadAgentAvatar(file)).key}
                    onUploaded={setAvatarKey}
                    camera="user"
                    round
                    disabled={pending}
                  />
                  {requiredKycCategories(documentType).map((category) => (
                    <FileSlot
                      key={category}
                      label={KYC_CATEGORY_LABELS[category]}
                      camera={cameraFor(category)}
                      hint="JPG, PNG, WEBP or PDF, 10 MB max."
                      accept={KYC_ACCEPT}
                      maxBytes={KYC_MAX_BYTES}
                      upload={async (file) =>
                        (await uploadAgentKycFile(file)).key
                      }
                      onUploaded={(key) =>
                        setKycKeys((prev) => {
                          const next = { ...prev };
                          if (key) next[category] = key;
                          else delete next[category];
                          return next;
                        })
                      }
                      disabled={pending}
                    />
                  ))}
                </div>
                {attempted && missing.length > 0 && (
                  <p className="text-destructive text-sm">
                    Still missing:{" "}
                    {missing.map((c) => KYC_CATEGORY_LABELS[c]).join(", ")}.
                  </p>
                )}
              </section>

              <section>
                <ZonesEditor disabled={pending} portalContainer={portalEl} />
              </section>

              {mutation.isError && (
                <p className="text-destructive text-sm">
                  {friendlyError(
                    mutation.error,
                    "Couldn't create this agent. Try again.",
                  )}
                </p>
              )}
            </div>

            <DialogFooter className="bg-muted/40 rounded-b-lg px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <IconLoader2 className="size-4 animate-spin" />}
                Create agent
              </Button>
            </DialogFooter>
          </form>
        </Form>
        {/* Where the zone dropdowns render: inside the dialog, so the modal lets
            them be clicked and typed into, and outside the scrolling body,
            so it does not clip them. */}
        <div ref={setPortalEl} />
      </DialogContent>
    </Dialog>
  );
}
