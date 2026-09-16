import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Button } from "#/components/ui/button";
import {
  createBundle,
  updateBundle,
  type AdBundle,
} from "#/lib/api/advertisements-controller";
import { friendlyError } from "#/lib/api/friendly-error";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  maxReach: z.coerce.number().int().min(1, "Max reach must be >= 1"),
  maxFrequencyPerWeek: z.coerce.number().int().min(1, "Frequency must be >= 1"),
  maxDurationDays: z.coerce.number().int().min(1, "Duration must be >= 1 day"),
  channels: z
    .array(z.enum(["EMAIL", "WHATSAPP", "IN_APP"]))
    .min(1, "Select at least one channel"),
  targetAudience: z.enum(["WORKER", "EMPLOYER", "BOTH"], {
    message: "Select a target audience",
  }),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const CHANNEL_OPTIONS = [
  { value: "EMAIL", label: "Email" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "IN_APP", label: "In-app popup" },
] as const;

type BundleChannel = (typeof CHANNEL_OPTIONS)[number]["value"];

/** Legacy bundles stored the catch-all "ALL", which meant email + WhatsApp. */
function resolveChannels(channels: string[]): BundleChannel[] {
  if (channels.includes("ALL")) return ["EMAIL", "WHATSAPP"];
  return CHANNEL_OPTIONS.map((o) => o.value).filter((v) =>
    channels.includes(v),
  );
}

function submitLabel(isPending: boolean, isEdit: boolean): string {
  if (isPending) return "Saving…";
  return isEdit ? "Save" : "Create";
}

function asNumericInputValue(value: unknown): string | number {
  if (typeof value === "number" || typeof value === "string") return value;
  return "";
}

type BundleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle?: AdBundle;
};

export function BundleDialog({
  open,
  onOpenChange,
  bundle,
}: Readonly<BundleDialogProps>) {
  const queryClient = useQueryClient();
  const isEdit = bundle != null;

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      maxReach: 100,
      maxFrequencyPerWeek: 1,
      maxDurationDays: 7,
      channels: [],
      targetAudience: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        isEdit
          ? {
              name: bundle.name,
              description: bundle.description,
              price: Number(bundle.price),
              maxReach: bundle.max_reach,
              maxFrequencyPerWeek: bundle.max_frequency_per_week,
              maxDurationDays: bundle.max_duration_days,
              channels: resolveChannels(bundle.allowed_channels),
              targetAudience: bundle.target_audience,
            }
          : {
              name: "",
              description: "",
              price: 0,
              maxReach: 100,
              maxFrequencyPerWeek: 1,
              maxDurationDays: 7,
              channels: [],
              targetAudience: undefined,
            },
      );
    }
  }, [open, bundle, isEdit, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        name: values.name,
        description: values.description,
        price: values.price,
        currency: "XAF",
        maxReach: values.maxReach,
        maxFrequencyPerWeek: values.maxFrequencyPerWeek,
        maxDurationDays: values.maxDurationDays,
        allowedChannels: values.channels,
        targetAudience: values.targetAudience,
        isActive: true,
      };
      return isEdit ? updateBundle(bundle.id, payload) : createBundle(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Bundle updated" : "Bundle created");
      queryClient.invalidateQueries({ queryKey: ["admin", "bundles"] });
      onOpenChange(false);
    },
    onError: (err: Error) =>
      toast.error(
        friendlyError(
          err,
          isEdit
            ? "Couldn't update the bundle. Try again."
            : "Couldn't create the bundle. Try again.",
        ),
      ),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>{isEdit ? "Edit Bundle" : "New Bundle"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutate(v))}>
            <div className="flex flex-col gap-5 px-6 py-5 max-h-[70vh] overflow-y-auto">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Starter Pack" />
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
                        {...field}
                        placeholder="Brief description of this bundle"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (XAF)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={asNumericInputValue(field.value)}
                        type="number"
                        min={0}
                        placeholder="5000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="maxReach"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Reach</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={asNumericInputValue(field.value)}
                          type="number"
                          min={1}
                          placeholder="500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxFrequencyPerWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Freq / Week</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={asNumericInputValue(field.value)}
                          type="number"
                          min={1}
                          placeholder="3"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxDurationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Days</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={asNumericInputValue(field.value)}
                          type="number"
                          min={1}
                          placeholder="30"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="channels"
                render={({ field }) => {
                  const selected = field.value ?? [];
                  const toggle = (value: BundleChannel, checked: boolean) =>
                    field.onChange(
                      checked
                        ? [...selected, value]
                        : selected.filter((v) => v !== value),
                    );

                  return (
                    <FormItem>
                      <FormLabel>Channels</FormLabel>
                      <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
                        {CHANNEL_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={selected.includes(option.value)}
                              onCheckedChange={(checked) =>
                                toggle(option.value, checked === true)
                              }
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select target audience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="WORKER">Workers only</SelectItem>
                        <SelectItem value="EMPLOYER">Employers only</SelectItem>
                        <SelectItem value="BOTH">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {submitLabel(isPending, isEdit)}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
