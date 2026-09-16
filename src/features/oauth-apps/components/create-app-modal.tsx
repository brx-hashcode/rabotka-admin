import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "#/components/ui/textarea";
import { Checkbox } from "#/components/ui/checkbox";
import { Switch } from "#/components/ui/switch";
import { Button } from "#/components/ui/button";
import { LogoPicker } from "./logo-picker";
import { appConfig } from "#/config";
import { fetchWithCsrfRetry } from "#/lib/api/csrf-token";
import {
  createOAuthApp,
  type MintedSecret,
} from "#/lib/api/oauth-apps-controller";
import { SCOPE_LABELS, DEFAULT_SCOPES } from "../scopes";
import { webhookUrlProblem, withIdentityCheck } from "../identity-check";

/**
 * Uploads the logo and returns the URL Rabotka will serve it from.
 *
 * Same endpoint and same shape as the advertisement dialog's `uploadImages`.
 * Asking an admin to paste a URL instead would mean the consent screen loads
 * the partner's logo from the partner's own host — a third-party request on
 * every login, an image the partner can swap after approval, and a broken
 * consent screen the day their CDN moves.
 */
async function uploadLogo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("files", file);

  const res = await fetchWithCsrfRetry(
    `${appConfig.apiUrl}/file/upload?is_multipl=true`,
    { method: "POST", body: formData, credentials: "include" },
  );

  if (!res.ok) throw new Error("Logo upload failed");

  const json = (await res.json()) as { files: { file_url: string }[] };
  const url = json.files[0]?.file_url;
  if (!url) throw new Error("Logo upload returned no URL");
  return url;
}


/**
 * One URI per line, which is how people actually paste a list of them.
 *
 * Validated as a string and split at submit rather than through a zod
 * `.transform()`: a transform makes the schema's input and output types
 * diverge, and this repo's `FormField` cannot type a `Control` whose two halves
 * disagree.
 *
 * Only trimming and blank-line removal happen in {@link parseRedirectUris} —
 * deliberately no normalisation beyond that. The server compares these
 * byte-for-byte at authorize time, so anything "helpfully" rewritten here
 * becomes a redirect that mysteriously stops matching, with nothing on the
 * partner's side to explain why.
 */
function parseRedirectUris(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

// Required only for "Login with Rabotka" — see the superRefine below.
const redirectUrisField = z
  .string()
  .refine(
    (value) => parseRedirectUris(value).every((uri) => URL.canParse(uri)),
    "Each line must be a full absolute URL",
  )
  .refine(
    (value) => !parseRedirectUris(value).some((uri) => uri.includes("*")),
    "Wildcards are not supported — write each URI out in full",
  );

const schema = z.object({
  name: z.string().min(2, "Name is required").max(80),
  description: z
    .string()
    .min(10, "Describe the app — users read this on the consent screen")
    .max(500),
  contactEmail: z.string().email("A valid contact email is required"),
  redirectUris: redirectUrisField,
  allowedScopes: z.array(z.string()).min(1, "Select at least one scope"),
  isSandbox: z.boolean(),
  identityCheck: z.boolean(),
  webhookUrl: z.string(),
}).superRefine((values, ctx) => {
  if (!values.identityCheck) {
    if (parseRedirectUris(values.redirectUris).length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["redirectUris"],
        message:
          "At least one redirect URI is required, unless the app is for identity checks only",
      });
    }
    return;
  }
  const problem = webhookUrlProblem(values.webhookUrl, values.isSandbox);
  if (problem) {
    ctx.addIssue({ code: "custom", path: ["webhookUrl"], message: problem });
  }
});

type FormValues = z.infer<typeof schema>;

type CreateAppModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Hands the caller the one-time secret to display. */
  onCreated: (secret: MintedSecret) => void;
};

export function CreateAppModal({
  open,
  onOpenChange,
  onCreated,
}: Readonly<CreateAppModalProps>) {
  const queryClient = useQueryClient();

  /**
   * The logo is uploaded the moment it is picked, and what we keep is the URL
   * Rabotka serves it from — not the file.
   *
   * Uploading at submit instead would mean the admin never finds out the upload
   * failed until they have filled in the whole form, and would leave "did that
   * work?" unanswered while they do. Doing it now costs an orphaned file when a
   * dialog is abandoned, which is the cheaper problem by far.
   */
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  /** Local object URL, shown while the upload is in flight. */
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  /**
   * Each object URL holds its blob in memory until released, and this dialog
   * can be opened, filled and abandoned repeatedly in one session.
   */
  function revokeLocalPreview() {
    setLocalPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  function clearLogo() {
    revokeLocalPreview();
    setLogoUrl(null);
  }

  function reset() {
    form.reset();
    clearLogo();
  }

  const { mutate: doUploadLogo, isPending: isUploadingLogo } = useMutation({
    mutationFn: uploadLogo,
    onSuccess: (url) => {
      // Swap the blob preview for the hosted URL, so what is on screen is what
      // the consent screen will actually load.
      setLogoUrl(url);
      revokeLocalPreview();
    },
    onError: () => {
      clearLogo();
      toast.error("Logo upload failed — try again");
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      contactEmail: "",
      redirectUris: "",
      allowedScopes: [...DEFAULT_SCOPES],
      isSandbox: false,
      identityCheck: false,
      webhookUrl: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      createOAuthApp({
        name: values.name,
        description: values.description,
        contactEmail: values.contactEmail,
        // Already a hosted URL by this point — the upload happened on pick.
        logoUrl: logoUrl ?? undefined,
        redirectUris: parseRedirectUris(values.redirectUris),
        allowedScopes: withIdentityCheck(
          values.allowedScopes,
          values.identityCheck,
        ),
        webhookUrl: values.identityCheck ? values.webhookUrl.trim() : undefined,
        isSandbox: values.isSandbox,
      }),
    onSuccess: (secret) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "oauth-apps"] });
      reset();
      onOpenChange(false);
      onCreated(secret);
    },
    onError: (error: unknown) => {
      toast.error(messageFrom(error) ?? "Failed to register the application");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Wider than the default dialog. The redirect-URI box holds full URLs one
        per line and the scope rows carry a label plus an explanation — at
        `max-w-lg` both wrapped constantly.
      */}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Register an application</DialogTitle>
          <DialogDescription>
            The name and description appear on the consent screen users see.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutate(values))}
            className="space-y-4"
          >
            {/*
              At the top, the way a profile screen leads with its photo. The
              picker seeds its placeholder from the name field, so an app with
              no logo previews the initials the consent screen will actually
              fall back to.
            */}
            <LogoPicker
              // The blob while uploading, the hosted URL once it lands.
              preview={localPreview ?? logoUrl}
              uploading={isUploadingLogo}
              name={form.watch("name")}
              disabled={isPending}
              onPick={(file) => {
                clearLogo();
                setLocalPreview(URL.createObjectURL(file));
                doUploadLogo(file);
              }}
              onClear={clearLogo}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Chantier SARL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Recruitment platform for construction firms."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Shown to every user deciding whether to trust this app.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="dev@partner.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="redirectUris"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Redirect URIs</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      className="font-mono text-xs"
                      placeholder={"https://partner.com/auth/callback\nhttp://localhost:3000/callback"}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    One per line, matched exactly. A trailing slash makes it a
                    different URI. No wildcards. Optional when the app only
                    uses the identity check API.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowedScopes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scopes</FormLabel>
                  <FormDescription>
                    The ceiling on what this app may request. Anything not
                    checked is refused outright, not silently dropped.
                  </FormDescription>
                  {/*
                    The one two-column block in this form. Six rows of
                    label-plus-explanation stacked single-file pushed the submit
                    button off the bottom of the dialog; paired up they fit, and
                    the scopes read as one set to choose from rather than a
                    checklist to scroll.
                  */}
                  <div className="grid gap-x-6 gap-y-2.5 pt-1 sm:grid-cols-2">
                    {SCOPE_LABELS.map((scope) => (
                      <label
                        key={scope.value}
                        className="flex items-start gap-2.5 text-sm"
                      >
                        <Checkbox
                          className="mt-0.5"
                          // `openid` carries the subject identifier that every
                          // other claim hangs off. An app without it cannot do
                          // OIDC at all, so it is not a choice to offer.
                          disabled={scope.value === "openid"}
                          checked={field.value?.includes(scope.value)}
                          onCheckedChange={(checked) => {
                            const next = new Set(field.value ?? []);
                            if (checked) next.add(scope.value);
                            else next.delete(scope.value);
                            field.onChange([...next]);
                          }}
                        />
                        <span>
                          <span className="font-medium">{scope.label}</span>
                          <span className="text-muted-foreground block text-xs">
                            {scope.detail}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="identityCheck"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-start justify-between gap-4 text-sm">
                    <span>
                      <span className="font-medium">Identity check API</span>
                      <span className="text-muted-foreground block text-xs">
                        Lets this partner ask Rabotka to confirm a person's
                        identity from their WhatsApp number. The person
                        approves each request; the partner receives a match
                        score, never profile data. Requires a webhook.
                      </span>
                    </span>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </label>
                </FormItem>
              )}
            />

            {form.watch("identityCheck") && (
              <FormField
                control={form.control}
                name="webhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook URL</FormLabel>
                    <FormControl>
                      <Input
                        className="font-mono text-xs"
                        placeholder="https://partner.com/webhooks/rabotka"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Receives each result as a signed JWS. https only —
                      http://localhost is accepted for sandbox apps.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/*
              Last, and on its own, because it is the one answer here that
              cannot be changed afterwards. Everything above is editable from
              the card; this is not, and an admin who ticks it by accident has
              to delete the app and issue new credentials.
            */}
            <FormField
              control={form.control}
              name="isSandbox"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-start gap-2.5 text-sm">
                    <FormControl>
                      <Checkbox
                        className="mt-0.5"
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                    </FormControl>
                    <span>
                      <span className="font-medium">Sandbox application</span>
                      <span className="text-muted-foreground block text-xs">
                        Signs in only the two Rabotka sandbox users, with a
                        fixed code and no WhatsApp message — never a real
                        person. For a partner building their integration.{" "}
                        <strong className="font-medium">
                          Cannot be changed after registration.
                        </strong>
                      </span>
                    </span>
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              {/*
                Blocked during the upload too: submitting mid-flight would
                register the app with no logo and give no hint why.
              */}
              <Button type="submit" disabled={isPending || isUploadingLogo}>
                {isPending ? "Registering…" : "Register"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


function messageFrom(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const body = (error as { body?: { message?: string; error_description?: string } })
    .body;
  return body?.error_description ?? body?.message ?? null;
}
