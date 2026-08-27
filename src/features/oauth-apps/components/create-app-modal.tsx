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
import { Button } from "#/components/ui/button";
import {
  createOAuthApp,
  type MintedSecret,
} from "#/lib/api/oauth-apps-controller";
import { SCOPE_LABELS, DEFAULT_SCOPES } from "../scopes";


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

const redirectUrisField = z
  .string()
  .min(1, "At least one redirect URI is required")
  .refine(
    (value) => parseRedirectUris(value).length > 0,
    "At least one redirect URI is required",
  )
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
  logoUrl: z.string().url("Must be a URL").optional().or(z.literal("")),
  redirectUris: redirectUrisField,
  allowedScopes: z.array(z.string()).min(1, "Select at least one scope"),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      contactEmail: "",
      logoUrl: "",
      redirectUris: "",
      allowedScopes: [...DEFAULT_SCOPES],
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      createOAuthApp({
        name: values.name,
        description: values.description,
        contactEmail: values.contactEmail,
        logoUrl: values.logoUrl || undefined,
        redirectUris: parseRedirectUris(values.redirectUris),
        allowedScopes: values.allowedScopes,
      }),
    onSuccess: (secret) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "oauth-apps"] });
      form.reset();
      onOpenChange(false);
      onCreated(secret);
    },
    onError: (error: unknown) => {
      toast.error(messageFrom(error) ?? "Failed to register the application");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://partner.com/logo.png" {...field} />
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
                    different URI. No wildcards.
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
                  <div className="space-y-2 pt-1">
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

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
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
