import { useState, useEffect } from "react";
import { IconUsersGroup } from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Label } from "#/components/ui/label";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { toast } from "sonner";

type FormState = {
  revealDailyCap: string;
  leadClaimHours: string;
  inviteExpiryHours: string;
};

const EMPTY: FormState = {
  revealDailyCap: "30",
  leadClaimHours: "24",
  inviteExpiryHours: "48",
};

const KEYS: Record<keyof FormState, string> = {
  revealDailyCap: "agent.phone_reveal_daily_cap",
  leadClaimHours: "agent.lead_claim_hours",
  inviteExpiryHours: "agent.invite_expiry_hours",
};

/**
 * The rules of the field agents' app. The agents' suggestion threshold is not
 * here: it is a matching setting, next to the employers' one in Job matching.
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

    await saveChanges({
      [KEYS.revealDailyCap]: String(cap),
      [KEYS.leadClaimHours]: String(claim),
      [KEYS.inviteExpiryHours]: String(invite),
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
              How agents call workers and invite them to jobs
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
      </CardContent>
    </Card>
  );
}

/** A whole number of at least 1, as typed by the admin; null otherwise. */
function positiveInt(typed: string): number | null {
  const value = Number(typed);
  return Number.isInteger(value) && value >= 1 ? value : null;
}
