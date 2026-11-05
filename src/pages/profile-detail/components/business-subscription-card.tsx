import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconAlertTriangle, IconGift, IconHistory, IconPlayerStop, IconPlus, IconSparkles } from "@tabler/icons-react";
import { toast } from "sonner";

import {
  cancelBusinessSubscription,
  formatFcfa,
  getBusinessSubscription,
  grantBusinessSubscription,
  startBusinessTrial,
  type BusinessPlan,
  type BusinessSubscriptionOverview,
  type SubscriptionPeriod,
  type SubscriptionStatus,
} from "#/lib/api/business-plans-controller";
import { useBusinessPlansList } from "#/hooks/use-business-plans-list";
import { PlanDialog } from "#/features/business-plans/components/plan-dialog";
import { useRole } from "#/hooks/use-role";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Label } from "#/components/ui/label";
import { Skeleton } from "#/components/ui/skeleton";
import { Textarea } from "#/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { friendlyError } from "#/lib/api/friendly-error";
import { cn } from "#/lib/utils";
import { formatDate } from "../helpers";

export const businessSubscriptionKey = (profileId: string) =>
  ["admin", "profiles", profileId, "business-subscription"] as const;

const STATUS: Record<SubscriptionStatus, { label: string; className: string }> = {
  TRIAL: { label: "Trial", className: "bg-sky-500/15 text-sky-600 dark:text-sky-300" },
  ACTIVE: { label: "Active", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  EXPIRED: { label: "Expired", className: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300" },
  CANCELLED: { label: "Cancelled", className: "bg-rose-500/15 text-rose-600 dark:text-rose-300" },
};

const PERIOD_LABEL = { TRIAL: "Trial", MONTHLY: "Monthly", ANNUAL: "Annual" } as const;

const TRIAL_LOCKED_LABEL = { cvAnalysis: "CV analysis", cvChat: "CV questions", offerWriter: "AI drafts" } as const;

/** What a business may be assigned: the catalog's active plans, and its own custom plans. */
export function plansForBusiness(plans: BusinessPlan[], businessId: string): BusinessPlan[] {
  return plans.filter((p) => p.isActive && (!p.businessId || p.businessId === businessId));
}

export function SubscriptionStatusBadge({ status }: Readonly<{ status: SubscriptionStatus }>) {
  return <Badge className={STATUS[status].className}>{STATUS[status].label}</Badge>;
}

/** As profile-general-summary.tsx: one label/value line. */
function Row({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-muted-foreground shrink-0">{label}</div>
      <div className="text-right font-medium">{children}</div>
    </div>
  );
}

const usage = (used: number, limit: number | null) => (limit === null ? `${used} / unlimited` : `${used} / ${limit}`);

const quota = (n: number | null, what: string) => (n === null ? `Unlimited ${what}` : `${n} ${what}`);

/** An AI allowance: « 50 CV analyses », « No CV analysis », « Unlimited CV analyses ». */
const allowance = (n: number | null | undefined, one: string, many: string) =>
  n === undefined ? null : n === null ? `Unlimited ${many}` : n === 0 ? `No ${one}` : `${n} ${n > 1 ? many : one}`;

/** What a plan gives, on one line: « 10 contacts · 10 offers · 50 CV analyses · Preselection ». */
function planFacts(p: BusinessPlan): string {
  return [
    quota(p.unlocksPerPeriod, "contacts"),
    quota(p.activeOffersLimit, "offers"),
    allowance(p.cvScreeningsPerPeriod, "CV analysis", "CV analyses"),
    allowance(p.offerDraftsPerPeriod, "AI draft", "AI drafts"),
    p.includesPreselection && "Preselection",
    p.priorityVisibility && "Priority",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** « 5 Nov 2026 », for the dialog's sentences. */
const day = (d: Date | string) => formatDate(typeof d === "string" ? d : d.toISOString());

/** A numbered step of the assign dialog. */
function Step({ n, title, children }: Readonly<{ n: number; title: string; children: React.ReactNode }>) {
  return (
    <section className="space-y-2.5">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <span className="bg-muted text-muted-foreground flex size-5 items-center justify-center rounded-full text-[11px] tabular-nums">
          {n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** As the server's `periodEnd`: whole months, the day clamped to the month's length. */
function periodEnd(start: Date, period: "MONTHLY" | "ANNUAL"): Date {
  const months = period === "ANNUAL" ? 12 : 1;
  const end = new Date(start);
  const day = end.getDate();
  end.setDate(1);
  end.setMonth(end.getMonth() + months);
  end.setDate(Math.min(day, new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()));
  return end;
}

/** A bordered tile that reads as a radio: the plan and start choices. */
function ChoiceTile({
  selected,
  disabled,
  onSelect,
  children,
}: Readonly<{ selected: boolean; disabled?: boolean; onSelect: () => void; children: React.ReactNode }>) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "w-full cursor-pointer rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        selected ? "border-primary bg-primary/5 ring-primary ring-1" : "hover:bg-muted/50",
      )}
    >
      {children}
    </button>
  );
}

/** One plan to pick: its name, price for the chosen duration and what it gives. */
function PlanChoice({
  plan,
  period,
  selected,
  current,
  onSelect,
}: Readonly<{
  plan: BusinessPlan;
  period: "MONTHLY" | "ANNUAL";
  selected: boolean;
  current: boolean;
  onSelect: () => void;
}>) {
  return (
    <ChoiceTile selected={selected} onSelect={onSelect}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
            selected ? "border-primary" : "border-muted-foreground/40",
          )}
        >
          {selected && <span className="bg-primary size-2 rounded-full" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
              {plan.name}
              {current && <Badge variant="outline">Current</Badge>}
            </p>
            <p className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {formatFcfa(period === "ANNUAL" ? plan.annualPriceFcfa : plan.monthlyPriceFcfa)}
              {period === "ANNUAL" ? " / year" : " / month"}
            </p>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">{planFacts(plan)}</p>
        </div>
      </div>
    </ChoiceTile>
  );
}

/** Ready-made reasons for ending a period, in the business's language. */
const END_REASONS = ["Fin du partenariat convenu", "À la demande de l'entreprise", "Formule attribuée par erreur"];

/**
 * A business's plan on its Business tab: what it has now, what it used, what
 * is queued, and its history. An admin can assign a plan (after the running
 * period or in its place) and end a running period. The business is told of
 * both in-app and by email.
 */
export function BusinessSubscriptionCard({
  profileId,
  business,
}: Readonly<{ profileId: string; business: { id: string; name: string } }>) {
  const queryClient = useQueryClient();
  const { canManageContent } = useRole();
  const key = businessSubscriptionKey(profileId);
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => getBusinessSubscription(profileId) });
  const { data: plans } = useBusinessPlansList();
  const [granting, setGranting] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [period, setPeriod] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [startNow, setStartNow] = useState(false);
  const [cancelling, setCancelling] = useState<SubscriptionPeriod | null>(null);
  const [reason, setReason] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [customFrom, setCustomFrom] = useState<BusinessPlan | null>(null);

  const onSaved = (next: BusinessSubscriptionOverview) => {
    queryClient.setQueryData(key, next);
    void queryClient.invalidateQueries({ queryKey: ["admin", "profiles", profileId] });
  };

  const grant = useMutation({
    mutationFn: (now: boolean) =>
      grantBusinessSubscription(profileId, { planId: planId!, billingPeriod: period, startNow: now }),
    onSuccess: (next) => {
      onSaved(next);
      setGranting(false);
      toast.success("Plan assigned. The business is notified by email and in-app.");
    },
    onError: (err: Error) => toast.error(friendlyError(err, "Couldn't assign the plan. Try again.")),
  });

  const trial = useMutation({
    mutationFn: () => startBusinessTrial(profileId),
    onSuccess: (next) => {
      onSaved(next);
      toast.success("Trial started. The business is notified by email and in-app.");
    },
    onError: (err: Error) => toast.error(friendlyError(err, "Couldn't start the trial. Try again.")),
  });

  const cancel = useMutation({
    mutationFn: (sub: SubscriptionPeriod) => cancelBusinessSubscription(profileId, sub.id, reason),
    onSuccess: (next) => {
      onSaved(next);
      setCancelling(null);
      setReason("");
      toast.success("Period ended. The business is notified by email and in-app.");
    },
    onError: (err: Error) => toast.error(friendlyError(err, "Couldn't end the period. Try again.")),
  });

  if (isLoading || !data) return <Skeleton className="h-56" />;

  const e = data.entitlements;
  const running = data.history.find(
    (p) => (p.status === "TRIAL" || p.status === "ACTIVE") && new Date(p.startsAt) <= new Date() && new Date(p.endsAt) > new Date(),
  );
  const chosen = plans.find((p) => p.id === planId);
  // A running trial is always replaced, so only a paid or assigned period
  // leaves the admin a choice between now and after it.
  const replacing = running?.status === "ACTIVE" ? running : undefined;
  const replacedPlan = replacing && plans.find((p) => p.code === replacing.planCode);
  // As the server: a dearer plan always starts now, carrying the unused days.
  const upgrade = !!chosen && !!replacedPlan && chosen.monthlyPriceFcfa > replacedPlan.monthlyPriceFcfa;
  const now = upgrade || startNow;
  // Without « start now », the plan goes after everything already paid for.
  const queueEnd = [replacing, ...data.upcoming]
    .filter((p): p is SubscriptionPeriod => p?.status === "ACTIVE")
    .reduce<string | null>((latest, p) => (!latest || p.endsAt > latest ? p.endsAt : latest), null);
  const startsAt = now || !queueEnd ? new Date() : new Date(queueEnd);
  const endsAt = periodEnd(startsAt, period);
  const activePlans = plansForBusiness(plans, business.id);
  const catalogPlans = activePlans.filter((p) => !p.businessId);
  const customPlans = activePlans.filter((p) => p.businessId);
  // A new custom plan starts from the plan chosen, else the current one, else the first of the catalog.
  const templatePlan =
    (chosen && !chosen.businessId ? chosen : undefined) ??
    catalogPlans.find((p) => p.id === replacedPlan?.id) ??
    catalogPlans[0];
  const unlocksLeft = e.unlocksQuota === null ? null : Math.max(0, e.unlocksQuota - e.unlocksUsed);

  const openAssign = () => {
    setPlanId(null);
    setStartNow(false);
    setGranting(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Subscription</CardTitle>
        {canManageContent && (
          <div className="flex gap-2">
            {!data.trialUsed && !running && (
              <Button size="sm" variant="outline" onClick={() => trial.mutate()} disabled={trial.isPending}>
                <IconGift className="size-4" />
                {trial.isPending ? "Starting…" : "Start trial"}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={openAssign}>
              <IconPlus className="size-4" />
              Assign plan
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 text-sm">
          <Row label="Plan">{e.plan ? e.plan.name : <span className="text-muted-foreground">No plan</span>}</Row>
          <Row label="Status">
            {e.status ? <SubscriptionStatusBadge status={e.status} /> : <span className="text-muted-foreground">Pay per unlock</span>}
          </Row>
          {e.endsAt && <Row label="Ends">{formatDate(e.endsAt)}</Row>}
          <Row label="Contact unlocks">{e.plan ? usage(e.unlocksUsed, e.unlocksQuota) : "—"}</Row>
          <Row label={e.offersPublished !== undefined ? "Offers published" : "Active offers"}>
            {usage(e.offersPublished ?? e.activeOffers, e.plan ? e.activeOffersLimit : 0)}
          </Row>
          {e.plan && e.cvUsed !== undefined && <Row label="CV analysis">{usage(e.cvUsed, e.cvQuota ?? null)}</Row>}
          {e.plan && e.offerDraftsQuota !== undefined && (
            <Row label="AI drafts">
              {usage(e.offerDraftsQuota === null ? 0 : e.offerDraftsQuota - (e.offerDraftsRemaining ?? 0), e.offerDraftsQuota)}
            </Row>
          )}
          {e.recruiters !== undefined && <Row label="Recruiters">{usage(e.recruiters, e.plan ? (e.recruitersLimit ?? null) : 0)}</Row>}
          {e.reviewers !== undefined && <Row label="Reviewers">{usage(e.reviewers, e.plan ? (e.reviewersLimit ?? null) : 0)}</Row>}
          {e.trialLocked && e.trialLocked.length > 0 && (
            <Row label="Not in the trial">
              <div className="flex flex-wrap justify-end gap-1">
                {e.trialLocked.map((f) => (
                  <Badge key={f} variant="outline">
                    {TRIAL_LOCKED_LABEL[f]}
                  </Badge>
                ))}
              </div>
            </Row>
          )}
          {e.plan && (
            <Row label="Includes">
              <div className="flex flex-wrap justify-end gap-1">
                {e.includesPreselection && <Badge variant="outline">Preselection</Badge>}
                {e.priorityVisibility && <Badge variant="outline">Priority</Badge>}
                {!e.includesPreselection && !e.priorityVisibility && "—"}
              </div>
            </Row>
          )}
        </div>

        {data.upcoming.length > 0 && (
          <div className="rounded border p-3 text-sm">
            <p className="mb-1 font-medium">Queued</p>
            {data.upcoming.map((p) => (
              <p key={p.id} className="text-muted-foreground text-xs">
                {p.planName} · {PERIOD_LABEL[p.billingPeriod]} · {formatDate(p.startsAt)} → {formatDate(p.endsAt)}
              </p>
            ))}
          </div>
        )}

        {(data.history.length > 0 || (canManageContent && running)) && (
          <div className="flex items-center justify-between gap-3 border-t pt-3">
            {data.history.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowHistory((s) => !s)}
                className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-xs"
              >
                <IconHistory className="size-3.5" />
                {showHistory ? "Hide" : "Show"} history ({data.history.length})
              </button>
            ) : (
              <span />
            )}
            {canManageContent && running && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 px-2 text-xs"
                onClick={() => setCancelling(running)}
              >
                <IconPlayerStop className="size-3.5" />
                End period
              </Button>
            )}
          </div>
        )}

        {showHistory && (
          <ul className="divide-border divide-y rounded border text-xs">
            {data.history.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-2">
                <div className="min-w-0">
                  <p className="font-medium">
                    {p.planName} · {PERIOD_LABEL[p.billingPeriod]}
                    {p.granted ? " · granted" : p.paid ? " · paid" : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {formatDate(p.startsAt)} → {formatDate(p.endsAt)} · {p.unlocksUsed} unlocks
                  </p>
                </div>
                <SubscriptionStatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={granting} onOpenChange={setGranting}>
        <DialogContent className="flex max-h-[92vh] flex-col gap-0 p-0 sm:max-w-xl">
          <DialogHeader className="shrink-0 border-b px-6 py-5">
            <DialogTitle>Assign a plan to {business.name}</DialogTitle>
            <DialogDescription>
              {business.name} pays nothing for it: the period is offered, logged under your name. It is told by email
              and in-app.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <Step n={1} title="Which plan?">
              <div role="radiogroup" aria-label="Plan" className="space-y-2">
                {catalogPlans.map((p) => (
                  <PlanChoice
                    key={p.id}
                    plan={p}
                    period={period}
                    selected={planId === p.id}
                    current={replacedPlan?.id === p.id}
                    onSelect={() => setPlanId(p.id)}
                  />
                ))}
                {catalogPlans.length === 0 && <p className="text-muted-foreground text-sm">No active plan in the catalog.</p>}
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Custom plans for {business.name}
                </p>
                {customPlans.map((p) => (
                  <PlanChoice
                    key={p.id}
                    plan={p}
                    period={period}
                    selected={planId === p.id}
                    current={replacedPlan?.id === p.id}
                    onSelect={() => setPlanId(p.id)}
                  />
                ))}
                {templatePlan && (
                  <button
                    type="button"
                    onClick={() => setCustomFrom(templatePlan)}
                    className="hover:bg-muted/50 flex w-full cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-left transition-colors"
                  >
                    <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
                      <IconSparkles className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">New custom plan</span>
                      <span className="text-muted-foreground block text-xs">
                        Its own price and quotas, seen by {business.name} only. Starts from {templatePlan.name}&apos;s
                        values; change any of them.
                      </span>
                    </span>
                  </button>
                )}
              </div>
            </Step>

            <Step n={2} title="For how long?">
              <ToggleGroup
                type="single"
                variant="outline"
                value={period}
                onValueChange={(v) => v && setPeriod(v as "MONTHLY" | "ANNUAL")}
                className="w-full"
              >
                <ToggleGroupItem value="MONTHLY" className="flex-1">
                  One month
                </ToggleGroupItem>
                <ToggleGroupItem value="ANNUAL" className="flex-1">
                  One year
                </ToggleGroupItem>
              </ToggleGroup>
            </Step>

            {replacing && chosen && (
              <Step n={3} title="Starting when?">
                {upgrade ? (
                  <p className="bg-muted/50 rounded-lg p-3 text-sm">
                    <span className="font-medium">Today.</span>{" "}
                    <span className="text-muted-foreground">
                      {chosen.name} costs more than « {replacing.planName} », so it replaces it now; the days left on «{" "}
                      {replacing.planName} » are added to it.
                    </span>
                  </p>
                ) : (
                  <div role="radiogroup" aria-label="Starts" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <ChoiceTile selected={!startNow} onSelect={() => setStartNow(false)}>
                      <p className="text-sm font-medium">When « {replacing.planName} » ends</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">On {day(queueEnd ?? replacing.endsAt)}</p>
                    </ChoiceTile>
                    <ChoiceTile selected={startNow} onSelect={() => setStartNow(true)}>
                      <p className="text-sm font-medium">Today</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">« {replacing.planName} » stops now</p>
                    </ChoiceTile>
                  </div>
                )}
              </Step>
            )}
          </div>

          <div className="shrink-0 space-y-3 border-t px-6 py-4">
            {chosen ? (
              <div className="space-y-1 text-sm">
                <p>
                  {business.name} gets <span className="font-medium">{chosen.name}</span> for{" "}
                  {period === "ANNUAL" ? "one year" : "one month"}: <span className="font-medium">{day(startsAt)}</span> →{" "}
                  <span className="font-medium">{day(endsAt)}</span>
                  {upgrade && ", plus the days left"}.
                </p>
                {replacing && now && !upgrade && (
                  <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <IconAlertTriangle className="mt-px size-3.5 shrink-0" />« {replacing.planName} » stops today: its
                    remaining days and {unlocksLeft === null ? "quotas" : `${unlocksLeft} contacts left`} are lost.
                  </p>
                )}
                {running?.status === "TRIAL" && (
                  <p className="text-muted-foreground text-xs">The running trial ends today and this plan takes over.</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Choose a plan.</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setGranting(false)} disabled={grant.isPending}>
                Cancel
              </Button>
              <Button onClick={() => grant.mutate(!!replacing && startNow)} disabled={!chosen || grant.isPending}>
                {grant.isPending ? "Assigning…" : chosen ? `Assign ${chosen.name}` : "Assign"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <PlanDialog
        open={!!customFrom}
        onOpenChange={(o) => !o && setCustomFrom(null)}
        template={customFrom ?? undefined}
        forBusiness={business}
        onSaved={(saved) => setPlanId(saved.id)}
      />

      <Dialog
        open={!!cancelling}
        onOpenChange={(o) => {
          if (o) return;
          setCancelling(null);
          setReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End « {cancelling?.planName ?? ""} » now?</DialogTitle>
            <DialogDescription>
              Nothing is refunded from here. The business is notified by email and in-app.
            </DialogDescription>
          </DialogHeader>

          <ul className="bg-muted/50 space-y-1.5 rounded-lg p-3 text-sm">
            <li className="flex justify-between gap-4">
              <span className="text-muted-foreground">Ends</span>
              <span className="text-right font-medium">
                Today, instead of {cancelling ? formatDate(cancelling.endsAt) : ""}
              </span>
            </li>
            {unlocksLeft !== null && (
              <li className="flex justify-between gap-4">
                <span className="text-muted-foreground">Contacts lost</span>
                <span className="font-medium">{unlocksLeft}</span>
              </li>
            )}
            {data.upcoming.length > 0 && (
              <li className="flex justify-between gap-4">
                <span className="text-muted-foreground">Also cancelled</span>
                <span className="text-right font-medium">
                  {data.upcoming.map((p) => `${p.planName} (${formatDate(p.startsAt)})`).join(", ")}
                </span>
              </li>
            )}
          </ul>

          <div className="space-y-2">
            <Label htmlFor="end-period-reason">Reason for the business (optional)</Label>
            <div className="flex flex-wrap gap-1.5">
              {END_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={cn(
                    "cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors",
                    reason === r ? "border-primary bg-primary/5" : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <Textarea
              id="end-period-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={300}
              placeholder="Shown as « Motif : … » in the email and the notification"
            />
            <p className="text-muted-foreground text-right text-xs">{reason.length} / 300</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelling(null)} disabled={cancel.isPending}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelling && cancel.mutate(cancelling)}
              disabled={cancel.isPending}
            >
              {cancel.isPending ? "Ending…" : "End period"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
