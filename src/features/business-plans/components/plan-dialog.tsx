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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Button } from "#/components/ui/button";
import {
  createBusinessPlan,
  updateBusinessPlan,
  type BusinessPlan,
} from "#/lib/api/business-plans-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { BUSINESS_PLANS_KEY } from "#/hooks/use-business-plans-list";

/** An empty quota field means unlimited (null). */
const quota = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.coerce.number().int().min(0, "0 or more").nullable(),
);

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  code: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,40}$/, "Lowercase letters, digits and dashes (2–40)"),
  description: z.string().trim().max(1000),
  monthlyPriceFcfa: z.coerce.number().int().min(0, "The price must be 0 or more"),
  annualPriceFcfa: z.coerce.number().int().min(0, "The price must be 0 or more"),
  unlocksPerPeriod: quota,
  activeOffersLimit: quota,
  cvScreeningsPerPeriod: quota,
  cvBatchMax: z.coerce.number().int().min(1, "1 or more").max(100, "100 at most"),
  cvFileMaxMb: z.coerce.number().int().min(1, "1 or more").max(10, "10 at most"),
  cvRetentionDays: z.coerce.number().int().min(1, "1 or more").max(365, "365 at most"),
  includesPreselection: z.boolean(),
  includesFieldAgents: z.boolean(),
  priorityVisibility: z.boolean(),
  sortOrder: z.coerce.number().int(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const FEATURE_OPTIONS = [
  { name: "includesPreselection", label: "Preselection of profiles" },
  { name: "includesFieldAgents", label: "Field agents (recrutement accompagné)" },
  { name: "priorityVisibility", label: "Priority visibility of offers" },
] as const;

const CV_FIELDS = [
  { name: "cvScreeningsPerPeriod", label: "CVs / period", min: 0, max: undefined, placeholder: "Unlimited" },
  { name: "cvBatchMax", label: "CVs per upload", min: 1, max: 100, placeholder: undefined },
  { name: "cvFileMaxMb", label: "Max file size (MB)", min: 1, max: 10, placeholder: undefined },
  { name: "cvRetentionDays", label: "Kept for (days)", min: 1, max: 365, placeholder: undefined },
] as const;

const EMPTY: FormInput = {
  name: "",
  code: "",
  description: "",
  monthlyPriceFcfa: 0,
  annualPriceFcfa: 0,
  unlocksPerPeriod: "",
  activeOffersLimit: "",
  // Not included until set: an empty field would mean unlimited.
  cvScreeningsPerPeriod: 0,
  cvBatchMax: 20,
  cvFileMaxMb: 5,
  cvRetentionDays: 30,
  includesPreselection: false,
  includesFieldAgents: false,
  priorityVisibility: false,
  sortOrder: 0,
};

function submitLabel(isPending: boolean, isEdit: boolean): string {
  if (isPending) return "Saving…";
  return isEdit ? "Save" : "Create";
}

function asInputValue(value: unknown): string | number {
  if (typeof value === "number" || typeof value === "string") return value;
  return "";
}

type PlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: BusinessPlan;
};

/**
 * Create or edit a business plan. New prices and quotas apply to new
 * purchases and renewals; periods already paid keep what they were bought
 * with. The code is fixed once created (the trial setting refers to it).
 */
export function PlanDialog({ open, onOpenChange, plan }: Readonly<PlanDialogProps>) {
  const queryClient = useQueryClient();
  const isEdit = plan != null;

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      isEdit
        ? {
            name: plan.name,
            code: plan.code,
            description: plan.description ?? "",
            monthlyPriceFcfa: plan.monthlyPriceFcfa,
            annualPriceFcfa: plan.annualPriceFcfa,
            unlocksPerPeriod: plan.unlocksPerPeriod ?? "",
            activeOffersLimit: plan.activeOffersLimit ?? "",
            cvScreeningsPerPeriod: plan.cvScreeningsPerPeriod ?? "",
            cvBatchMax: plan.cvBatchMax,
            cvFileMaxMb: plan.cvFileMaxMb,
            cvRetentionDays: plan.cvRetentionDays,
            includesPreselection: plan.includesPreselection,
            includesFieldAgents: plan.includesFieldAgents,
            priorityVisibility: plan.priorityVisibility,
            sortOrder: plan.sortOrder,
          }
        : EMPTY,
    );
  }, [open, plan, isEdit, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        description: values.description || null,
        isActive: plan?.isActive ?? true,
      };
      return isEdit ? updateBusinessPlan(plan.id, payload) : createBusinessPlan(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Plan updated" : "Plan created");
      queryClient.invalidateQueries({ queryKey: BUSINESS_PLANS_KEY });
      onOpenChange(false);
    },
    onError: (err: Error) =>
      toast.error(
        friendlyError(
          err,
          isEdit ? "Couldn't update the plan. Try again." : "Couldn't create the plan. Try again.",
        ),
      ),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>{isEdit ? "Edit Plan" : "New Plan"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutate(v))}>
            <div className="flex flex-col gap-5 px-6 py-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Pro" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                          placeholder="pro"
                          disabled={isEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="What this plan is for" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monthlyPriceFcfa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly price (FCFA)</FormLabel>
                      <FormControl>
                        <Input {...field} value={asInputValue(field.value)} type="number" min={0} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="annualPriceFcfa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual price (FCFA)</FormLabel>
                      <FormControl>
                        <Input {...field} value={asInputValue(field.value)} type="number" min={0} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="unlocksPerPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unlocks / period</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={asInputValue(field.value)}
                          type="number"
                          min={0}
                          placeholder="Unlimited"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="activeOffersLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Active offers</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={asInputValue(field.value)}
                          type="number"
                          min={0}
                          placeholder="Unlimited"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order</FormLabel>
                      <FormControl>
                        <Input {...field} value={asInputValue(field.value)} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription className="-mt-3 text-xs">
                Leave a quota empty for unlimited. Unlocks cover the employer side of a contact unlock.
              </FormDescription>

              <div className="flex flex-col gap-2">
                <FormLabel>CV screening (AI)</FormLabel>
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-3">
                  {CV_FIELDS.map((option) => (
                    <FormField
                      key={option.name}
                      control={form.control}
                      name={option.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-normal text-muted-foreground text-xs">{option.label}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={asInputValue(field.value)}
                              type="number"
                              min={option.min}
                              max={option.max}
                              placeholder={option.placeholder}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <FormDescription className="text-xs">
                  CVs / period: 0 = not in this plan, empty = unlimited. Unreadable CVs are not counted. After the
                  retention, files and contact details are deleted; scores stay.
                </FormDescription>
              </div>

              <div className="flex flex-col gap-2">
                <FormLabel>Included</FormLabel>
                <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
                  {FEATURE_OPTIONS.map((option) => (
                    <FormField
                      key={option.name}
                      control={form.control}
                      name={option.name}
                      render={({ field }) => (
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                          />
                          {option.label}
                        </label>
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
