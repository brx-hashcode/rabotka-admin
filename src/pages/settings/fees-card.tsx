import { useState, useEffect } from "react";
import { IconCoin } from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";

type FormState = {
  "fees.late_cancellation_penalty_fcfa": string;
  "fees.late_cancellation_score_deduction": string;
  "fees.cancellation_threshold_hours": string;
  "fees.reliability_score_min": string;
  "fees.employer_late_cancel_score_deduction": string;
  "fees.billing_block_threshold": string;
  "fees.max_concurrent_applications": string;
  "fees.contact_unlock_fee_employer": string;
  "fees.contact_unlock_fee_worker": string;
  "fees.contact_unlock_expiry_hours": string;
  "fees.contact_recommendation_fee_employer": string;
  "fees.welcome_credit_worker": string;
  "fees.welcome_credit_employer": string;
  "fees.completion_score_reward": string;
  "fees.rating_score_delta_1": string;
  "fees.rating_score_delta_2": string;
  "fees.rating_score_delta_3": string;
  "fees.rating_score_delta_4": string;
  "fees.rating_score_delta_5": string;
};

const EMPTY: FormState = {
  "fees.late_cancellation_penalty_fcfa": "",
  "fees.late_cancellation_score_deduction": "",
  "fees.cancellation_threshold_hours": "",
  "fees.reliability_score_min": "",
  "fees.employer_late_cancel_score_deduction": "",
  "fees.billing_block_threshold": "",
  "fees.max_concurrent_applications": "",
  "fees.contact_unlock_fee_employer": "",
  "fees.contact_unlock_fee_worker": "",
  "fees.contact_unlock_expiry_hours": "",
  "fees.contact_recommendation_fee_employer": "",
  "fees.welcome_credit_worker": "",
  "fees.welcome_credit_employer": "",
  "fees.completion_score_reward": "",
  "fees.rating_score_delta_1": "",
  "fees.rating_score_delta_2": "",
  "fees.rating_score_delta_3": "",
  "fees.rating_score_delta_4": "",
  "fees.rating_score_delta_5": "",
};

function FieldLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {children}
    </label>
  );
}

function NumericInput({
  value,
  onChange,
  placeholder,
  suffix,
  min = 0,
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  min?: number;
}>) {
  return (
    <div className="relative flex items-center">
      <Input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={suffix ? "pr-14" : undefined}
      />
      {suffix && (
        <span className="text-muted-foreground pointer-events-none absolute right-3 text-xs font-medium">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function FeesCard() {
  const { configs, isLoading, saveChanges, isSaving } =
    useSystemConfigCategory("FEES");

  const [form, setForm] = useState<FormState>(EMPTY);
  const [initial, setInitial] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (configs.length === 0) return;
    const data = { ...EMPTY };
    for (const item of configs) {
      if (item.key in data) {
        (data as Record<string, string>)[item.key] = item.value;
      }
    }
    setForm(data);
    setInitial(data);
  }, [configs]);

  const isDirty = (Object.keys(form) as (keyof FormState)[]).some(
    (k) => form[k] !== initial[k],
  );

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    await saveChanges(form);
    setInitial(form);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <IconCoin className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Fees & Penalties
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Amounts, score deductions and blocking thresholds
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || isSaving || isLoading}
        >
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </CardHeader>

      <Separator />

      <CardContent>
        <p className="pt-6 text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Worker – late cancellation
        </p>
        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <div className="space-y-1.5">
            <FieldLabel>Financial penalty</FieldLabel>
            <NumericInput
              value={form["fees.late_cancellation_penalty_fcfa"]}
              onChange={(v) => set("fees.late_cancellation_penalty_fcfa", v)}
              suffix="FCFA"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Score deduction</FieldLabel>
            <NumericInput
              value={form["fees.late_cancellation_score_deduction"]}
              onChange={(v) => set("fees.late_cancellation_score_deduction", v)}
              suffix="pts"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Penalty-free window</FieldLabel>
            <NumericInput
              value={form["fees.cancellation_threshold_hours"]}
              onChange={(v) => set("fees.cancellation_threshold_hours", v)}
              suffix="h"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Max concurrent applications</FieldLabel>
            <NumericInput
              value={form["fees.max_concurrent_applications"]}
              onChange={(v) => set("fees.max_concurrent_applications", v)}
            />
          </div>
        </div>

        <Separator className="mb-6" />

        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Employer – late cancellation / ghost offer
        </p>
        <p className="text-muted-foreground mb-4 text-xs">
          Applied when an employer cancels an accepted worker within the penalty-free window, or when a filled offer expires without the job being started.
        </p>
        <div className="mb-6">
          <div className="space-y-1.5">
            <FieldLabel>Score deduction</FieldLabel>
            <NumericInput
              value={form["fees.employer_late_cancel_score_deduction"]}
              onChange={(v) => set("fees.employer_late_cancel_score_deduction", v)}
              suffix="pts"
            />
          </div>
        </div>

        <Separator className="mb-6" />

        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Contact unlock
        </p>
        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <div className="space-y-1.5">
            <FieldLabel>Unlock fee – Employer</FieldLabel>
            <NumericInput
              value={form["fees.contact_unlock_fee_employer"]}
              onChange={(v) => set("fees.contact_unlock_fee_employer", v)}
              suffix="FCFA"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Unlock fee – Worker</FieldLabel>
            <NumericInput
              value={form["fees.contact_unlock_fee_worker"]}
              onChange={(v) => set("fees.contact_unlock_fee_worker", v)}
              suffix="FCFA"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Unlock expiry</FieldLabel>
            <NumericInput
              value={form["fees.contact_unlock_expiry_hours"]}
              onChange={(v) => set("fees.contact_unlock_expiry_hours", v)}
              suffix="h"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Recommendation contact fee – Employer</FieldLabel>
            <NumericInput
              value={form["fees.contact_recommendation_fee_employer"]}
              onChange={(v) => set("fees.contact_recommendation_fee_employer", v)}
              suffix="FCFA"
            />
          </div>
        </div>

        <Separator className="mb-6" />

        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Welcome credit
        </p>
        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel>Welcome credit – Worker</FieldLabel>
            <NumericInput
              value={form["fees.welcome_credit_worker"]}
              onChange={(v) => set("fees.welcome_credit_worker", v)}
              suffix="FCFA"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Welcome credit – Employer</FieldLabel>
            <NumericInput
              value={form["fees.welcome_credit_employer"]}
              onChange={(v) => set("fees.welcome_credit_employer", v)}
              suffix="FCFA"
            />
          </div>
        </div>

        <Separator className="mb-6" />

        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Platform thresholds
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel>Minimum reliability score</FieldLabel>
            <NumericInput
              value={form["fees.reliability_score_min"]}
              onChange={(v) => set("fees.reliability_score_min", v)}
              suffix="pts"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Unpaid penalties before block</FieldLabel>
            <NumericInput
              value={form["fees.billing_block_threshold"]}
              onChange={(v) => set("fees.billing_block_threshold", v)}
            />
          </div>
        </div>

        <Separator className="my-6" />

        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Reliability score
        </p>
        <p className="text-muted-foreground mb-4 text-xs">
          Reward for completing a job, plus per-star adjustments applied when the
          employer rates the worker. Values may be negative (e.g. a 1★ rating
          lowers the score). Bounded by the minimum reliability score and 100.
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-6">
          <div className="space-y-1.5">
            <FieldLabel>Completion reward</FieldLabel>
            <NumericInput
              value={form["fees.completion_score_reward"]}
              onChange={(v) => set("fees.completion_score_reward", v)}
              suffix="pts"
              min={-100}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Rating 1★ adjustment</FieldLabel>
            <NumericInput
              value={form["fees.rating_score_delta_1"]}
              onChange={(v) => set("fees.rating_score_delta_1", v)}
              suffix="pts"
              min={-100}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Rating 2★ adjustment</FieldLabel>
            <NumericInput
              value={form["fees.rating_score_delta_2"]}
              onChange={(v) => set("fees.rating_score_delta_2", v)}
              suffix="pts"
              min={-100}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Rating 3★ adjustment</FieldLabel>
            <NumericInput
              value={form["fees.rating_score_delta_3"]}
              onChange={(v) => set("fees.rating_score_delta_3", v)}
              suffix="pts"
              min={-100}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Rating 4★ adjustment</FieldLabel>
            <NumericInput
              value={form["fees.rating_score_delta_4"]}
              onChange={(v) => set("fees.rating_score_delta_4", v)}
              suffix="pts"
              min={-100}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Rating 5★ adjustment</FieldLabel>
            <NumericInput
              value={form["fees.rating_score_delta_5"]}
              onChange={(v) => set("fees.rating_score_delta_5", v)}
              suffix="pts"
              min={-100}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
