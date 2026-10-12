import { useState, useEffect } from "react";
import { IconCoin } from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";

type FormState = {
  "fees.late_cancellation_penalty_fcfa": string;
  "fees.late_cancellation_score_deduction": string;
  "fees.cancellation_threshold_hours": string;
  "fees.reliability_score_min": string;
  "fees.employer_late_cancel_score_deduction": string;
  "fees.billing_block_threshold": string;
  "fees.penalty_suspension_threshold": string;
  "fees.cancellation_score_deduction": string;
  "fees.cancellation_suspension_count": string;
  "fees.cancellation_suspension_window_days": string;
  "fees.penalty_hard_block_days": string;
  "fees.penalty_max_notifications": string;
  "fees.penalty_notification_interval_hours": string;
  "fees.max_concurrent_applications": string;
  "fees.max_daily_applications": string;
  "fees.contact_unlock_fee_employer": string;
  "fees.contact_unlock_fee_worker": string;
  "fees.contact_unlock_expiry_hours": string;
  "fees.contact_recommendation_fee_employer": string;
  "fees.welcome_credit_worker": string;
  "fees.welcome_credit_employer": string;
  "fees.referral_commission_type": string;
  "fees.referral_credit_referrer": string;
  "fees.referral_credit_referee": string;
  "fees.referral_max_rewarded_per_referrer": string;
  "fees.referral_max_payout_per_referral": string;
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
  "fees.penalty_suspension_threshold": "",
  "fees.cancellation_score_deduction": "",
  "fees.cancellation_suspension_count": "",
  "fees.cancellation_suspension_window_days": "",
  "fees.penalty_hard_block_days": "",
  "fees.penalty_max_notifications": "",
  "fees.penalty_notification_interval_hours": "",
  "fees.max_concurrent_applications": "",
  "fees.max_daily_applications": "",
  "fees.contact_unlock_fee_employer": "",
  "fees.contact_unlock_fee_worker": "",
  "fees.contact_unlock_expiry_hours": "",
  "fees.contact_recommendation_fee_employer": "",
  "fees.welcome_credit_worker": "",
  "fees.welcome_credit_employer": "",
  "fees.referral_commission_type": "FIXED",
  "fees.referral_credit_referrer": "",
  "fees.referral_credit_referee": "",
  "fees.referral_max_rewarded_per_referrer": "",
  "fees.referral_max_payout_per_referral": "",
  "fees.completion_score_reward": "",
  "fees.rating_score_delta_1": "",
  "fees.rating_score_delta_2": "",
  "fees.rating_score_delta_3": "",
  "fees.rating_score_delta_4": "",
  "fees.rating_score_delta_5": "",
};

/**
 * What the current settings actually pay out, in the mode they are in.
 *
 * The consequence is otherwise invisible in either mode, but for opposite
 * reasons. In FIXED the two credits are also the payout floor — the backend
 * never pays out more than the payment that triggered it — so raising them past
 * a connection fee silently stops that fee rewarding anyone. In PERCENTAGE
 * there is no floor at all, and the risk moves to the split: the shares must
 * leave something for the platform.
 */
function ReferralPayoutNote({
  type,
  referrer,
  referee,
}: Readonly<{ type: string; referrer: string; referee: string }>) {
  const total = Number(referrer || 0) + Number(referee || 0);
  if (!Number.isFinite(total) || total <= 0) return null;

  if (type === "PERCENTAGE") {
    const overHundred = total > 100;
    return (
      <div className="bg-muted mb-6 rounded-lg p-3">
        <p className="text-xs">
          <strong>
            {total}&nbsp;% of every qualifying payment is paid out
            {!overHundred && `, ${100 - total} % stays with the platform`}.
          </strong>{" "}
          {overHundred ? (
            <span className="text-destructive font-medium">
              The two shares add up to more than 100&nbsp;%. This will be
              rejected on save — a referral can never pay out more than the
              payment that triggered it.
            </span>
          ) : (
            "There is no minimum payment in this mode: a share fits inside any amount, so small connections reward proportionally rather than not at all."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-muted mb-6 rounded-lg p-3">
      <p className="text-xs">
        <strong>Payout floor: {total.toLocaleString("fr-FR")} FCFA.</strong> A
        referral pays out only when the referred user&apos;s first connection
        payment reaches this amount — the program never pays out more than the
        payment that triggered it. Keep it at or below the connection fees above,
        or those payments will stop rewarding anyone.
      </p>
    </div>
  );
}

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
  max,
  hint,
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** A unit — short enough to sit inside the field. Use `hint` for prose. */
  suffix?: string;
  min?: number;
  max?: number;
  /** Sits under the field, so it survives a narrow column. */
  hint?: string;
}>) {
  return (
    <div>
      <div className="relative flex items-center">
        <Input
          type="number"
          min={min}
          max={max}
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
      {hint && (
        <p className="text-muted-foreground mt-1 text-[11px]">{hint}</p>
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

  const isPercentage = form["fees.referral_commission_type"] === "PERCENTAGE";
  const referralUnit = isPercentage ? "%" : "FCFA";

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
        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
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
        </div>

        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Worker – any cancellation
        </p>
        <p className="text-muted-foreground mb-4 text-xs">
          Reliability points lost every time a worker cancels a mission they
          were accepted on, early or late. A late cancellation also loses the
          score deduction above, so it costs both. Withdrawing an application
          nobody has answered yet costs no points (it still counts toward the
          suspension below). Set to 0 to turn it off.
        </p>
        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <FieldLabel>Score deduction</FieldLabel>
            <NumericInput
              value={form["fees.cancellation_score_deduction"]}
              onChange={(v) => set("fees.cancellation_score_deduction", v)}
              suffix="pts"
              min={0}
            />
          </div>
        </div>

        <Separator className="mb-6" />

        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Application limits
        </p>
        <p className="text-muted-foreground mb-4 text-xs">
          Both caps gate a worker applying, and whichever is lower is what they
          actually hit — the app shows the tighter of the two as their remaining
          count. Concurrent counts still-open applications (pending or accepted)
          on offers that haven&apos;t closed; daily resets at midnight.
        </p>
        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel>Max concurrent applications</FieldLabel>
            <NumericInput
              value={form["fees.max_concurrent_applications"]}
              onChange={(v) => set("fees.max_concurrent_applications", v)}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Max applications per day</FieldLabel>
            <NumericInput
              value={form["fees.max_daily_applications"]}
              onChange={(v) => set("fees.max_daily_applications", v)}
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
          Parrainage
        </p>
        <p className="text-muted-foreground mb-4 text-xs">
          Paid when a referred user makes their <strong>first mobile-money
          payment for a connection</strong> — never at signup, which would be
          farmable with throwaway accounts.
        </p>
        {/* Five across on a wide screen, collapsing to two and then one. The
            commission type leads because it decides the unit of the two fields
            after it — reading left to right is reading the sentence. */}
        <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="space-y-1.5">
            <FieldLabel>Commission type</FieldLabel>
            <Select
              value={form["fees.referral_commission_type"] || "FIXED"}
              onValueChange={(v) => set("fees.referral_commission_type", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED">Fixed (FCFA)</SelectItem>
                <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Referral credit – Referrer</FieldLabel>
            <NumericInput
              value={form["fees.referral_credit_referrer"]}
              onChange={(v) => set("fees.referral_credit_referrer", v)}
              suffix={referralUnit}
              max={isPercentage ? 100 : undefined}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Referral credit – Referee</FieldLabel>
            <NumericInput
              value={form["fees.referral_credit_referee"]}
              onChange={(v) => set("fees.referral_credit_referee", v)}
              suffix={referralUnit}
              max={isPercentage ? 100 : undefined}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Max rewarded per referrer</FieldLabel>
            <NumericInput
              value={form["fees.referral_max_rewarded_per_referrer"]}
              onChange={(v) =>
                set("fees.referral_max_rewarded_per_referrer", v)
              }
              hint="0 = unlimited"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Max payout per referral</FieldLabel>
            <NumericInput
              value={form["fees.referral_max_payout_per_referral"]}
              onChange={(v) => set("fees.referral_max_payout_per_referral", v)}
              suffix="FCFA"
              hint="0 = no ceiling"
            />
          </div>
        </div>
        <ReferralPayoutNote
          type={form["fees.referral_commission_type"]}
          referrer={form["fees.referral_credit_referrer"]}
          referee={form["fees.referral_credit_referee"]}
        />

        <Separator className="mb-6" />

        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Unpaid penalties – what happens next
        </p>
        <p className="text-muted-foreground mb-4 text-xs">
          Three steps, in this order. <strong>Block</strong>: the person's
          WhatsApp chat only offers to pay the penalty.{" "}
          <strong>Suspend</strong>: the account is turned off. It is the
          stronger step, so it never happens before the block. The{" "}
          <strong>hard block</strong> depends on time, not on the number of
          penalties: one penalty unpaid for this long stops the person from
          applying, posting jobs or unlocking contacts, and they no longer get
          job alerts.
        </p>
        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <FieldLabel>Unpaid penalties before block</FieldLabel>
            <NumericInput
              value={form["fees.billing_block_threshold"]}
              onChange={(v) => set("fees.billing_block_threshold", v)}
              min={1}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Unpaid penalties before suspension</FieldLabel>
            <NumericInput
              value={form["fees.penalty_suspension_threshold"]}
              onChange={(v) => set("fees.penalty_suspension_threshold", v)}
              min={1}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Hard block after</FieldLabel>
            <NumericInput
              value={form["fees.penalty_hard_block_days"]}
              onChange={(v) => set("fees.penalty_hard_block_days", v)}
              suffix="days"
              min={1}
            />
          </div>
        </div>

        <Separator className="mb-6" />

        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Repeated cancellations
        </p>
        <p className="text-muted-foreground mb-4 text-xs">
          A worker who cancels this many times within the period is
          suspended, early or late alike, penalty or not. Every cancellation
          counts: a mission they were accepted on, and withdrawing an
          application still waiting for an answer too. The worker is warned
          before the last one. Paying penalties does not lift this
          suspension; only an admin can.
        </p>
        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <FieldLabel>Cancellations before suspension</FieldLabel>
            <NumericInput
              value={form["fees.cancellation_suspension_count"]}
              onChange={(v) => set("fees.cancellation_suspension_count", v)}
              min={1}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Counted over</FieldLabel>
            <NumericInput
              value={form["fees.cancellation_suspension_window_days"]}
              onChange={(v) =>
                set("fees.cancellation_suspension_window_days", v)
              }
              suffix="days"
              min={1}
            />
          </div>
        </div>

        <Separator className="mb-6" />

        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Unpaid penalties – reminders
        </p>
        <p className="text-muted-foreground mb-4 text-xs">
          WhatsApp reminders for an unpaid penalty. The run stops at the hard
          block above — past that the block itself is the message — so raising
          the reminder count beyond that window has no effect. Keep the interval
          just under 24h so a daily reminder does not drift later each day.
        </p>
        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel>Max reminders per penalty</FieldLabel>
            <NumericInput
              value={form["fees.penalty_max_notifications"]}
              onChange={(v) => set("fees.penalty_max_notifications", v)}
              min={1}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Minimum gap between reminders</FieldLabel>
            <NumericInput
              value={form["fees.penalty_notification_interval_hours"]}
              onChange={(v) =>
                set("fees.penalty_notification_interval_hours", v)
              }
              suffix="h"
              min={1}
            />
          </div>
        </div>

        <Separator className="mb-6" />

        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Platform thresholds
        </p>
        {/* No grid: this section has one field, and a two-column grid around a
            single item just leaves half the row empty. */}
        <div className="space-y-1.5">
          <FieldLabel>Minimum reliability score</FieldLabel>
          <NumericInput
            value={form["fees.reliability_score_min"]}
            onChange={(v) => set("fees.reliability_score_min", v)}
            suffix="pts"
          />
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
