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
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Button } from "#/components/ui/button";
import {
  createBundle,
  updateBundle,
  type AdBundle,
} from "#/lib/api/advertisements-controller";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  maxReach: z.coerce.number().int().min(1, "Max reach must be >= 1"),
  maxFrequencyPerWeek: z.coerce.number().int().min(1, "Frequency must be >= 1"),
  maxDurationDays: z.coerce.number().int().min(1, "Duration must be >= 1 day"),
  channel: z.enum(["EMAIL", "WHATSAPP", "BOTH"], {
    required_error: "Select a channel",
  }),
});

type FormValues = z.infer<typeof schema>;

function resolveChannel(channels: string[]): "EMAIL" | "WHATSAPP" | "BOTH" {
  const has = (v: string) => channels.includes(v);
  if (has("EMAIL") && has("WHATSAPP")) return "BOTH";
  if (has("WHATSAPP")) return "WHATSAPP";
  return "EMAIL";
}

function submitLabel(isPending: boolean, isEdit: boolean): string {
  if (isPending) return "Saving…";
  return isEdit ? "Save" : "Create";
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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      maxReach: 100,
      maxFrequencyPerWeek: 1,
      maxDurationDays: 7,
      channel: undefined,
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
              channel: resolveChannel(bundle.allowed_channels),
            }
          : {
              name: "",
              description: "",
              price: 0,
              maxReach: 100,
              maxFrequencyPerWeek: 1,
              maxDurationDays: 7,
              channel: undefined,
            },
      );
    }
  }, [open, bundle, isEdit, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        name: values.name,
        description: values.description,
        price: values.price,
        currency: "XAF",
        maxReach: values.maxReach,
        maxFrequencyPerWeek: values.maxFrequencyPerWeek,
        maxDurationDays: values.maxDurationDays,
        allowedChannels: [values.channel],
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
        err.message ||
          (isEdit ? "Failed to update bundle" : "Failed to create bundle"),
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
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EMAIL">EMAIL</SelectItem>
                        <SelectItem value="WHATSAPP">WHATSAPP</SelectItem>
                        <SelectItem value="BOTH">BOTH</SelectItem>
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
