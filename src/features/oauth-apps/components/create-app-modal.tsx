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
    "Each line must be a full web address, starting with https://",
  )
  .refine(
    (value) => !parseRedirectUris(value).some((uri) => uri.includes("*")),
    "Write each address in full — the * sign isn't allowed",
  );

const schema = z.object({
  name: z.string().min(2, "Enter the app's name").max(80, "Keep the name under 80 characters"),
  description: z
    .string()
    .min(10, "Describe the app in a sentence — people read this before giving permission")
    .max(500, "Keep the description under 500 characters"),
  contactEmail: z.string().email("Enter a valid email address"),
  redirectUris: redirectUrisField,
  allowedScopes: z.array(z.string()).min(1, "Choose at least one thing this app may see"),
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
          "Add at least one sign-in return address, or turn on Identity check if the app only checks identities",
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
      toast.error("The logo couldn't be uploaded. Try again.");
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
      toast.error(messageFrom(error) ?? "Couldn't add this partner app. Try again.");
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
          <DialogTitle>Add a partner app</DialogTitle>
          <DialogDescription>
            People see this name and description when the app asks for their permission.
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
                    Shown to people deciding whether to trust this app.
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
                  <FormLabel>Sign-in return addresses</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      className="font-mono text-xs"
                      placeholder={"https://partner.com/auth/callback\nhttp://localhost:3000/callback"}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The pages people come back to after signing in with
                    Rabotka, given by the partner. One per line, written
                    exactly — a "/" at the end makes it a different address.
                    Leave empty if the app only uses Identity check.
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
                  <FormLabel>What this app may see</FormLabel>
                  <FormDescription>
                    When someone signs in, the app can only ask for what's
                    ticked here.
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
                      <span className="font-medium">Identity check</span>
                      <span className="text-muted-foreground block text-xs">
                        Lets this partner ask us to confirm who someone is,
                        using their WhatsApp number. The person agrees to each
                        request, and the partner only learns whether its
                        details match — never the person's profile. Needs a
                        results address.
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
                    <FormLabel>Results address</FormLabel>
                    <FormControl>
                      <Input
                        className="font-mono text-xs"
                        placeholder="https://partner.com/webhooks/rabotka"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Where we send each result, given by the partner. It must
                      start with https://. Rabotka signs each result so the
                      partner knows it came from us.
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
                      <span className="font-medium">Test app</span>
                      <span className="text-muted-foreground block text-xs">
                        Works only with two fake Rabotka accounts, never with
                        real people, and sends no WhatsApp messages. For a
                        partner who is still building their connection.{" "}
                        <strong className="font-medium">
                          You can't change this later.
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
                {isPending ? "Adding…" : "Add app"}
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
