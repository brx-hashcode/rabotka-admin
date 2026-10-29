import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconHistory, IconPlus, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import {
  cancelBusinessSubscription,
  getBusinessSubscription,
  grantBusinessSubscription,
  type BusinessSubscriptionOverview,
  type SubscriptionPeriod,
  type SubscriptionStatus,
} from "#/lib/api/business-plans-controller";
import { useBusinessPlansList } from "#/hooks/use-business-plans-list";
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
import { GeoCombobox } from "#/components/geo-combobox";
import { ConfirmDialog } from "#/features/team/components/confirm-dialog";
import { friendlyError } from "#/lib/api/friendly-error";
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

/**
 * A business's plan on its Business tab: what it has now, what it used, what
 * is queued, and its history. An admin can assign a plan (after the running
 * period or in its place) and end a running period, each behind a
 * confirmation. The business is told of both in-app and by email.
 */
export function BusinessSubscriptionCard({ profileId }: Readonly<{ profileId: string }>) {
  const queryClient = useQueryClient();
  const { canManageContent } = useRole();
  const key = businessSubscriptionKey(profileId);
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => getBusinessSubscription(profileId) });
  const { data: plans } = useBusinessPlansList();
  const [granting, setGranting] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [period, setPeriod] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [startNow, setStartNow] = useState(false);
  const [confirmGrant, setConfirmGrant] = useState(false);
  const [cancelling, setCancelling] = useState<SubscriptionPeriod | null>(null);
  const [reason, setReason] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const onSaved = (next: BusinessSubscriptionOverview) => {
    queryClient.setQueryData(key, next);
    void queryClient.invalidateQueries({ queryKey: ["admin", "profiles", profileId] });
  };

  const grant = useMutation({
    mutationFn: (now: boolean) =>
      grantBusinessSubscription(profileId, { planId: planId!, billingPeriod: period, startNow: now }),
    onSuccess: (next) => {
      onSaved(next);
      setConfirmGrant(false);
      setGranting(false);
      toast.success("Plan assigned. The business is notified by email and in-app.");
    },
    onError: (err: Error) => {
      setConfirmGrant(false);
      toast.error(friendlyError(err, "Couldn't assign the plan. Try again."));
    },
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
  const startNote = !replacing
    ? null
    : upgrade
      ? `Dearer than « ${replacing.planName} »: it starts now and the unused days carry over.`
      : now
        ? `« ${replacing.planName} » ends today; its remaining time and quota are lost.`
        : `Starts on ${formatDate(replacing.endsAt)}, when « ${replacing.planName} » ends.`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Subscription</CardTitle>
        {canManageContent && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setStartNow(false);
              setGranting(true);
            }}
          >
            <IconPlus className="size-4" />
            Assign plan
          </Button>
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
          <Row label="Active offers">{usage(e.activeOffers, e.plan ? e.activeOffersLimit : 0)}</Row>
          {e.plan && (
            <Row label="Includes">
              <div className="flex flex-wrap justify-end gap-1">
                {e.includesPreselection && <Badge variant="outline">Preselection</Badge>}
                {e.includesFieldAgents && <Badge variant="outline">Field agents</Badge>}
                {e.priorityVisibility && <Badge variant="outline">Priority</Badge>}
                {!e.includesPreselection && !e.includesFieldAgents && !e.priorityVisibility && "—"}
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

        {canManageContent && running && (
          <Button size="sm" variant="outline" className="hover:text-destructive w-full" onClick={() => setCancelling(running)}>
            <IconX className="size-4" />
            End current period
          </Button>
        )}

        {data.history.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowHistory((s) => !s)}
              className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-xs"
            >
              <IconHistory className="size-3.5" />
              {showHistory ? "Hide" : "Show"} history ({data.history.length})
            </button>
            {showHistory && (
              <ul className="divide-border mt-2 divide-y rounded border text-xs">
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
          </div>
        )}
      </CardContent>

      <Dialog open={granting} onOpenChange={setGranting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign a plan</DialogTitle>
            <DialogDescription>
              No payment is asked, and a running trial is replaced. The business is notified by email and in-app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <GeoCombobox
              options={plans.filter((p) => p.isActive).map((p) => ({ value: p.id, label: p.name }))}
              value={planId}
              onChange={setPlanId}
              placeholder="Choose a plan"
              searchPlaceholder="Search plans…"
            />
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
            {replacing && (
              <div className="space-y-2">
                <Label>Starts</Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={now ? "now" : "after"}
                  onValueChange={(v) => v && setStartNow(v === "now")}
                  disabled={upgrade}
                  className="w-full"
                >
                  <ToggleGroupItem value="after" className="flex-1">
                    After the current period
                  </ToggleGroupItem>
                  <ToggleGroupItem value="now" className="flex-1">
                    Start now
                  </ToggleGroupItem>
                </ToggleGroup>
                <p className="text-muted-foreground text-xs">{startNote}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGranting(false)}>
              Cancel
            </Button>
            <Button onClick={() => setConfirmGrant(true)} disabled={!planId}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmGrant}
        onOpenChange={setConfirmGrant}
        title={`Assign « ${chosen?.name ?? ""} » for ${period === "ANNUAL" ? "one year" : "one month"}?`}
        description={`${startNote ?? "It starts now."} The business gets the plan's quotas and features without paying. This is logged under your name.`}
        actionLabel="Assign plan"
        onConfirm={() => grant.mutate(!!replacing && startNow)}
        isPending={grant.isPending}
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
              The period stops now: its remaining quota and features are lost, and nothing is refunded from here. The
              business is notified by email and in-app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="end-period-reason">Reason (shown to the business)</Label>
            <Textarea
              id="end-period-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={300}
              placeholder="Optional"
            />
            <p className="text-muted-foreground text-right text-xs">{reason.length} / 300</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelling(null)} disabled={cancel.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelling && cancel.mutate(cancelling)}
              disabled={cancel.isPending}
            >
              End period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
