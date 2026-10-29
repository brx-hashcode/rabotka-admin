import { useEffect, type ReactNode } from "react";
import { useForm, useWatch, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconCoin,
  IconFileSearch,
  IconGauge,
  IconId,
  IconCircleCheck,
} from "@tabler/icons-react";
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
import { Switch } from "#/components/ui/switch";
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
import { cn } from "#/lib/utils";

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
  cvBatchMax: z.coerce.number().int().min(1, "1 or more").max(5, "5 at most"),
  cvFileMaxMb: z.coerce.number().int().min(1, "1 or more").max(10, "10 at most"),
  cvRetentionDays: z.coerce.number().int().min(1, "1 or more").max(365, "365 at most"),
  cvChatQuestions: z.coerce.number().int().min(0, "0 or more").max(200, "200 at most"),
  offerDraftsPerPeriod: quota,
  includesPreselection: z.boolean(),
  priorityVisibility: z.boolean(),
  sortOrder: z.coerce.number().int(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const FEATURE_OPTIONS = [
  {
    name: "includesPreselection",
    label: "Preselection of profiles",
    hint: "Our team shortlists candidates for their offers.",
  },
  {
    name: "priorityVisibility",
    label: "Priority visibility",
    hint: "Their offers are shown first to workers.",
  },
] as const;

const CV_FIELDS = [
  {
    name: "cvScreeningsPerPeriod",
    label: "CVs per period",
    suffix: "CVs",
    min: 0,
    max: undefined,
    placeholder: "Unlimited",
    hint: "0 = not in this plan, empty = unlimited. Unreadable CVs are not counted.",
  },
  { name: "cvBatchMax", label: "CVs per upload", suffix: "CVs", min: 1, max: 5, placeholder: undefined, hint: "1 to 5 files at once." },
  { name: "cvFileMaxMb", label: "Max file size", suffix: "MB", min: 1, max: 10, placeholder: undefined, hint: "Per file, 10 MB at most." },
  {
    name: "cvRetentionDays",
    label: "Kept for",
    suffix: "days",
    min: 1,
    max: 365,
    placeholder: undefined,
    hint: "Then files, contact details and chats are deleted; scores stay.",
  },
  {
    name: "cvChatQuestions",
    label: "Questions per CV",
    suffix: "questions",
    min: 0,
    max: 200,
    placeholder: undefined,
    hint: "Questions to the AI about one CV. 0 = no chat.",
  },
] as const;

const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

/** What the annual price comes to per month, and the discount against twelve monthly payments. */
function annualHint(monthly: unknown, annual: unknown): string | null {
  const m = Number(monthly);
  const a = Number(annual);
  if (!(m > 0) || !(a > 0)) return null;
  const off = Math.round((1 - a / (m * 12)) * 100);
  const perMonth = `≈ ${fcfa(a / 12)} / month`;
  if (off > 0) return `${perMonth} · ${off} % off monthly`;
  if (off < 0) return `${perMonth} · more than 12 monthly payments`;
  return `${perMonth} · same as monthly`;
}

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
  cvBatchMax: 5,
  cvFileMaxMb: 5,
  cvRetentionDays: 30,
  cvChatQuestions: 20,
  offerDraftsPerPeriod: 20,
  includesPreselection: false,
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

function Section({
  icon,
  title,
  description,
  children,
}: Readonly<{ icon: ReactNode; title: string; description?: string; children: ReactNode }>) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm leading-9">{title}</h3>
          {description && <p className="-mt-1.5 text-muted-foreground text-xs">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/** A number input with its unit on the right. */
function NumberField({
  control,
  name,
  label,
  suffix,
  hint,
  min,
  max,
  placeholder,
}: Readonly<{
  control: Control<FormInput, unknown, FormValues>;
  name: FieldPath<FormInput>;
  label: string;
  suffix?: string;
  hint?: ReactNode;
  min?: number;
  max?: number;
  placeholder?: string;
}>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="relative">
            <FormControl>
              <Input
                {...field}
                value={asInputValue(field.value)}
                type="number"
                min={min}
                max={max}
                placeholder={placeholder}
                className={cn("tabular-nums", suffix && "pr-20")}
              />
            </FormControl>
            {suffix && (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground text-xs">
                {suffix}
              </span>
            )}
          </div>
          {hint && <FormDescription className="text-xs">{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
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
            cvChatQuestions: plan.cvChatQuestions,
            offerDraftsPerPeriod: plan.offerDraftsPerPeriod ?? "",
            includesPreselection: plan.includesPreselection,
            priorityVisibility: plan.priorityVisibility,
            sortOrder: plan.sortOrder,
          }
        : EMPTY,
    );
  }, [open, plan, isEdit, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const { offerDraftsPerPeriod, ...rest } = values;
      const payload = {
        ...rest,
        description: values.description || null,
        isActive: plan?.isActive ?? true,
        // A backend older than the field neither sends nor accepts it: an
        // empty field there means « unknown », not « unlimited ».
        ...(isEdit && plan.offerDraftsPerPeriod === undefined ? {} : { offerDraftsPerPeriod }),
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

  const [monthly, annual] = useWatch({ control: form.control, name: ["monthlyPriceFcfa", "annualPriceFcfa"] });
  const annualNote = annualHint(monthly, annual);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-full flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle className="text-lg">{isEdit ? `Edit ${plan.name}` : "New plan"}</DialogTitle>
          <DialogDescription>
            New prices and quotas apply to new purchases and renewals; periods already paid keep what they were
            bought with.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutate(v))} className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
              <Section icon={<IconId className="size-5" />} title="Identity" description="How the plan is named and listed.">
                <div className="grid items-start gap-4 sm:grid-cols-[1fr_1fr_8rem]">
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
                            className="font-mono"
                          />
                        </FormControl>
                        {isEdit && <FormDescription className="text-xs">Fixed once created.</FormDescription>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <NumberField control={form.control} name="sortOrder" label="Order" hint="Lower comes first." />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Who this plan is for, shown to businesses" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              <Section icon={<IconCoin className="size-5" />} title="Pricing" description="0 makes the plan free.">
                <div className="grid items-start gap-4 sm:grid-cols-2">
                  <NumberField control={form.control} name="monthlyPriceFcfa" label="Monthly price" suffix="FCFA" min={0} />
                  <NumberField
                    control={form.control}
                    name="annualPriceFcfa"
                    label="Annual price"
                    suffix="FCFA"
                    min={0}
                    hint={annualNote}
                  />
                </div>
              </Section>

              <Section
                icon={<IconGauge className="size-5" />}
                title="Quotas"
                description="Per period. Leave a field empty for unlimited."
              >
                <div className="grid items-start gap-4 sm:grid-cols-2">
                  <NumberField
                    control={form.control}
                    name="unlocksPerPeriod"
                    label="Contact unlocks"
                    suffix="contacts"
                    min={0}
                    placeholder="Unlimited"
                    hint="Covers the employer side of a contact unlock."
                  />
                  <NumberField
                    control={form.control}
                    name="activeOffersLimit"
                    label="Offers per period"
                    suffix="offers"
                    min={0}
                    placeholder="Unlimited"
                    hint="Offers published per period, from 0 each period. Offers already online stay online."
                  />
                  <NumberField
                    control={form.control}
                    name="offerDraftsPerPeriod"
                    label="AI-written offers"
                    suffix="offers"
                    min={0}
                    placeholder="Unlimited"
                    hint="« Rédiger avec l'IA » in the offer form. 0 = not in this plan."
                  />
                </div>
              </Section>

              <Section
                icon={<IconFileSearch className="size-5" />}
                title="CV analysis (AI)"
                description="Businesses upload CVs for a job; the AI scores and ranks them."
              >
                <div className="grid items-start gap-4 sm:grid-cols-2">
                  {CV_FIELDS.map((option) => (
                    <NumberField
                      key={option.name}
                      control={form.control}
                      name={option.name}
                      label={option.label}
                      suffix={option.suffix}
                      min={option.min}
                      max={option.max}
                      placeholder={option.placeholder}
                      hint={option.hint}
                    />
                  ))}
                </div>
              </Section>

              <Section icon={<IconCircleCheck className="size-5" />} title="Included services">
                <div className="grid gap-3 sm:grid-cols-3">
                  {FEATURE_OPTIONS.map((option) => (
                    <FormField
                      key={option.name}
                      control={form.control}
                      name={option.name}
                      render={({ field }) => (
                        <label
                          className={cn(
                            "flex cursor-pointer flex-col gap-2 rounded-lg border bg-background p-3 transition-colors",
                            field.value === true && "border-primary/60 bg-primary/5",
                          )}
                        >
                          <span className="flex items-center justify-between gap-2 font-medium text-sm">
                            {option.label}
                            <Switch
                              checked={field.value === true}
                              onCheckedChange={(checked) => field.onChange(checked === true)}
                            />
                          </span>
                          <span className="text-muted-foreground text-xs">{option.hint}</span>
                        </label>
                      )}
                    />
                  ))}
                </div>
              </Section>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t px-6 py-4">
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
