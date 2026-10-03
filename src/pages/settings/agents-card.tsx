import { useState, useEffect } from "react";
import { IconUsersGroup } from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Label } from "#/components/ui/label";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Switch } from "#/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { toast } from "sonner";

type FormState = {
  revealDailyCap: string;
  leadClaimHours: string;
  inviteExpiryHours: string;
  commissionAmount: string;
  releaseEvent: string;
  confirmationHours: string;
  requiresMomoWorker: string;
  requiresMomoEmployer: string;
  multiSeatMode: string;
};

const EMPTY: FormState = {
  revealDailyCap: "30",
  leadClaimHours: "24",
  inviteExpiryHours: "48",
  commissionAmount: "400",
  releaseEvent: "UNLOCKED",
  confirmationHours: "72",
  requiresMomoWorker: "true",
  requiresMomoEmployer: "true",
  multiSeatMode: "PER_PLACEMENT",
};

const KEYS: Record<keyof FormState, string> = {
  revealDailyCap: "agent.phone_reveal_daily_cap",
  leadClaimHours: "agent.lead_claim_hours",
  inviteExpiryHours: "agent.invite_expiry_hours",
  commissionAmount: "agent.commission_per_placement_fcfa",
  releaseEvent: "agent.commission_release_event",
  confirmationHours: "agent.commission_confirmation_hours",
  requiresMomoWorker: "agent.commission_requires_momo_worker",
  requiresMomoEmployer: "agent.commission_requires_momo_employer",
  multiSeatMode: "agent.commission_multi_seat_mode",
};

/**
 * The rules of the field agents' app, and what they earn. The agents'
 * suggestion threshold is not here: it is a matching setting, next to the
 * employers' one in Job matching.
 */
export function AgentsCard() {
  const { configs, isLoading, saveChanges, isSaving } =
    useSystemConfigCategory("AGENT");

  const [form, setForm] = useState<FormState>(EMPTY);
  const [initial, setInitial] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (configs.length === 0) return;
    const data = { ...EMPTY };
    for (const item of configs) {
      for (const field of Object.keys(KEYS) as (keyof FormState)[]) {
        if (item.key === KEYS[field]) data[field] = item.value;
      }
    }
    setForm(data);
    setInitial(data);
  }, [configs]);

  const isDirty = (Object.keys(form) as (keyof FormState)[]).some(
    (k) => form[k] !== initial[k],
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const cap = positiveInt(form.revealDailyCap);
    if (cap === null) {
      toast.error("Agents must be able to see at least 1 number a day.");
      return;
    }
    const claim = positiveInt(form.leadClaimHours);
    if (claim === null) {
      toast.error("An agent must keep a worker for at least 1 hour.");
      return;
    }
    const invite = positiveInt(form.inviteExpiryHours);
    if (invite === null) {
      toast.error("An invitation must stay valid for at least 1 hour.");
      return;
    }
    const amount = nonNegativeInt(form.commissionAmount);
    if (amount === null) {
      toast.error("The commission must be 0 FCFA or more.");
      return;
    }
    const hours = nonNegativeInt(form.confirmationHours);
    if (hours === null) {
      toast.error("The waiting time must be 0 hours or more.");
      return;
    }

    // The server also refuses a commission at or above the two unlock fees
    // together, and says so; that check needs the Fees card's values.
    await saveChanges({
      [KEYS.revealDailyCap]: String(cap),
      [KEYS.leadClaimHours]: String(claim),
      [KEYS.inviteExpiryHours]: String(invite),
      [KEYS.commissionAmount]: String(amount),
      [KEYS.releaseEvent]: form.releaseEvent,
      [KEYS.confirmationHours]: String(hours),
      [KEYS.requiresMomoWorker]: form.requiresMomoWorker,
      [KEYS.requiresMomoEmployer]: form.requiresMomoEmployer,
      [KEYS.multiSeatMode]: form.multiSeatMode,
    });
    setInitial(form);
  }

  const disabled = isLoading || isSaving;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <IconUsersGroup className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Field agents
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              How agents call workers, invite them to jobs, and get paid
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!isDirty || disabled}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4 pt-6">
          <div className="space-y-1">
            <Label htmlFor="reveal-daily-cap" className="text-sm font-medium">
              Phone numbers per agent per day
            </Label>
            <p className="text-muted-foreground text-xs">
              How many different workers' numbers one agent can see in a day
              (Brazzaville time). Seeing the same worker again doesn't count
              twice. Keeps an agent from collecting numbers. Usual value: 30.
            </p>
          </div>
          <Input
            id="reveal-daily-cap"
            type="number"
            min={1}
            step={1}
            value={form.revealDailyCap}
            onChange={(e) => set("revealDailyCap", e.target.value)}
            disabled={disabled}
            className="w-24 text-right"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="lead-claim-hours" className="text-sm font-medium">
              Time an agent keeps a worker (hours)
            </Label>
            <p className="text-muted-foreground text-xs">
              When an agent takes a worker for a job, other agents can't call
              them. If the agent records no call in this time, the worker is
              free again. Each call recorded restarts it. Usual value: 24.
            </p>
          </div>
          <Input
            id="lead-claim-hours"
            type="number"
            min={1}
            step={1}
            value={form.leadClaimHours}
            onChange={(e) => set("leadClaimHours", e.target.value)}
            disabled={disabled}
            className="w-24 text-right"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="invite-expiry-hours"
              className="text-sm font-medium"
            >
              Invitation valid for (hours)
            </Label>
            <p className="text-muted-foreground text-xs">
              How long the link an agent sends stays usable. After that the
              worker can't apply through it, and another agent can take them.
              Usual value: 48.
            </p>
          </div>
          <Input
            id="invite-expiry-hours"
            type="number"
            min={1}
            step={1}
            value={form.inviteExpiryHours}
            onChange={(e) => set("inviteExpiryHours", e.target.value)}
            disabled={disabled}
            className="w-24 text-right"
          />
        </div>

        <Separator />

        <div className="space-y-1">
          <p className="text-sm font-semibold">Commissions</p>
          <p className="text-muted-foreground text-xs">
            An agent earns a commission when a worker they invited is hired
            and both sides have paid. Changes apply to new placements only —
            what an agent already earned keeps the rules it was earned under.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="commission-amount" className="text-sm font-medium">
              Commission per placement (FCFA)
            </Label>
            <p className="text-muted-foreground text-xs">
              Paid to the agent for each worker they place. Must stay below the
              two contact-unlock fees together. Set to 0 to stop paying
              commissions. Usual value: 400.
            </p>
          </div>
          <Input
            id="commission-amount"
            type="number"
            min={0}
            step={50}
            value={form.commissionAmount}
            onChange={(e) => set("commissionAmount", e.target.value)}
            disabled={disabled}
            className="w-24 text-right"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="release-event" className="text-sm font-medium">
              Waiting time starts when
            </Label>
            <p className="text-muted-foreground text-xs">
              A commission can be withdrawn only after a waiting time. Start
              it when both sides have paid, or only once the mission is marked
              done — safer, but agents wait longer.
            </p>
          </div>
          <Select
            value={form.releaseEvent}
            onValueChange={(v) => set("releaseEvent", v)}
            disabled={disabled}
          >
            <SelectTrigger id="release-event" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UNLOCKED">Both sides have paid</SelectItem>
              <SelectItem value="COMPLETED">The mission is done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="confirmation-hours"
              className="text-sm font-medium"
            >
              Waiting time (hours)
            </Label>
            <p className="text-muted-foreground text-xs">
              If the mission is cancelled or the worker doesn't show up during
              this time, the commission is taken back. 0 means it can be
              withdrawn right away. Usual value: 72.
            </p>
          </div>
          <Input
            id="confirmation-hours"
            type="number"
            min={0}
            step={1}
            value={form.confirmationHours}
            onChange={(e) => set("confirmationHours", e.target.value)}
            disabled={disabled}
            className="w-24 text-right"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="momo-worker" className="text-sm font-medium">
              Worker must pay by Mobile Money
            </Label>
            <p className="text-muted-foreground text-xs">
              No commission when the worker paid with credit Rabotka gave them
              (welcome or referral credit) — that brings in no money.
            </p>
          </div>
          <Switch
            id="momo-worker"
            checked={form.requiresMomoWorker === "true"}
            onCheckedChange={(v) => set("requiresMomoWorker", String(v))}
            disabled={disabled}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="momo-employer" className="text-sm font-medium">
              Employer must pay by Mobile Money
            </Label>
            <p className="text-muted-foreground text-xs">
              The same rule for the employer's side.
            </p>
          </div>
          <Switch
            id="momo-employer"
            checked={form.requiresMomoEmployer === "true"}
            onCheckedChange={(v) => set("requiresMomoEmployer", String(v))}
            disabled={disabled}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="multi-seat-mode" className="text-sm font-medium">
              Jobs with several places
            </Label>
            <p className="text-muted-foreground text-xs">
              On these jobs the employer pays once for every place. Pay the
              agent for each worker placed, or only for the place the
              employer's payment was made on.
            </p>
          </div>
          <Select
            value={form.multiSeatMode}
            onValueChange={(v) => set("multiSeatMode", v)}
            disabled={disabled}
          >
            <SelectTrigger id="multi-seat-mode" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PER_PLACEMENT">Each worker placed</SelectItem>
              <SelectItem value="FIRST_ONLY">One place only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

/** A whole number of at least 1, as typed by the admin; null otherwise. */
function positiveInt(typed: string): number | null {
  const value = Number(typed);
  return Number.isInteger(value) && value >= 1 ? value : null;
}

/** A whole number of at least 0, as typed by the admin; null otherwise. */
function nonNegativeInt(typed: string): number | null {
  const value = Number(typed);
  return typed.trim() !== "" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}
