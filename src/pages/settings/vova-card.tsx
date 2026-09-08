import { useState, useEffect } from "react";
import { IconRobot } from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Switch } from "#/components/ui/switch";
import { Label } from "#/components/ui/label";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { toast } from "sonner";

type FormState = {
  enabled: boolean;
  shadowMode: boolean;
  rolloutPercent: string;
  timeoutMs: string;
  anonymousEnabled: boolean;
  anonDailyLimit: string;
  walledDailyLimit: string;
};

const EMPTY: FormState = {
  enabled: false,
  shadowMode: true,
  rolloutPercent: "0",
  timeoutMs: "25000",
  anonymousEnabled: false,
  anonDailyLimit: "10",
  walledDailyLimit: "10",
};

/**
 * Describes the state the three switches actually add up to.
 *
 * They interact, and the dangerous combination is not the obvious one: turning
 * the assistant *on* is harmless while observation mode is on, and the moment
 * that matters is observation going off with a non-zero percentage — which is
 * the only state where a real worker reads a generated reply. Spelling it out
 * is cheaper than an admin inferring it from three separate controls.
 */
function describeState(form: FormState): { text: string; tone: "off" | "watch" | "live" } {
  if (!form.enabled) {
    return {
      text: "Off — the bot answers exactly as it did before, with its usual menu card.",
      tone: "off",
    };
  }
  if (form.shadowMode) {
    return {
      text: "Observation — replies are computed and written to the logs, and users still receive the menu card. Nothing is sent.",
      tone: "watch",
    };
  }
  const percent = Number(form.rolloutPercent);
  if (!Number.isFinite(percent) || percent <= 0) {
    return {
      text: "Off in practice — observation is disabled but the rollout is at 0%, so no one is served.",
      tone: "off",
    };
  }
  return {
    text: `LIVE — about ${percent}% of workers and recruiters receive answers written by the assistant.`,
    tone: "live",
  };
}

export function VovaCard() {
  const { configs, isLoading, saveChanges, isSaving } =
    useSystemConfigCategory("GENERAL");

  const [form, setForm] = useState<FormState>(EMPTY);
  const [initial, setInitial] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (configs.length === 0) return;
    const data = { ...EMPTY };
    for (const item of configs) {
      if (item.key === "vova.enabled") data.enabled = item.value === "true";
      if (item.key === "vova.shadow_mode")
        data.shadowMode = item.value === "true";
      if (item.key === "vova.rollout_percent") data.rolloutPercent = item.value;
      if (item.key === "vova.timeout_ms") data.timeoutMs = item.value;
      if (item.key === "vova.anonymous_enabled")
        data.anonymousEnabled = item.value === "true";
      if (item.key === "vova.anon_daily_limit")
        data.anonDailyLimit = item.value;
      if (item.key === "vova.walled_daily_limit")
        data.walledDailyLimit = item.value;
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
    const percent = parseInt(form.rolloutPercent, 10);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("Le pourcentage doit être entre 0 et 100");
      return;
    }
    const timeout = parseInt(form.timeoutMs, 10);
    // Below ~5s a tool-calling turn cannot finish, so every message would fall
    // back — indistinguishable from the assistant being switched off.
    if (isNaN(timeout) || timeout < 5000 || timeout > 60000) {
      toast.error("Le budget de réponse doit être entre 5000 et 60000 ms");
      return;
    }

    const anonLimit = parseInt(form.anonDailyLimit, 10);
    if (isNaN(anonLimit) || anonLimit < 0 || anonLimit > 200) {
      toast.error("La limite par numéro non inscrit doit être entre 0 et 200");
      return;
    }

    const walledLimit = parseInt(form.walledDailyLimit, 10);
    if (isNaN(walledLimit) || walledLimit < 0 || walledLimit > 200) {
      toast.error("La limite par compte bloqué doit être entre 0 et 200");
      return;
    }

    await saveChanges({
      "vova.enabled": String(form.enabled),
      "vova.shadow_mode": String(form.shadowMode),
      "vova.rollout_percent": String(percent),
      "vova.timeout_ms": String(timeout),
      "vova.anonymous_enabled": String(form.anonymousEnabled),
      "vova.anon_daily_limit": String(anonLimit),
      "vova.walled_daily_limit": String(walledLimit),
    });
    setInitial(form);
  }

  const disabled = isLoading || isSaving;
  const state = describeState(form);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <IconRobot className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">VoVa AI</CardTitle>
            <p className="text-muted-foreground text-xs">
              The WhatsApp assistant that answers free-form messages
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!isDirty || disabled}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-6">
        <div
          className={
            "mt-6 rounded-lg px-3 py-2 text-xs " +
            (state.tone === "live"
              ? "bg-destructive/10 text-destructive"
              : state.tone === "watch"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground")
          }
        >
          {state.text}
          {form.enabled && form.anonymousEnabled && (
            <span className="block pt-1">
              Unregistered numbers are answered too — up to{" "}
              {form.anonDailyLimit} replies a day each. This is unaffected by
              observation mode and by the rollout percentage.
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="vova-enabled" className="text-sm font-medium">
              Enable VoVa AI
            </Label>
            <p className="text-muted-foreground text-xs">
              Master switch. When off, a message the bot does not recognise gets
              the usual welcome card — the behaviour that predates the
              assistant. Turning this on does not send anything to users while
              observation mode is on.
            </p>
          </div>
          <Switch
            id="vova-enabled"
            checked={form.enabled}
            onCheckedChange={(v) => set("enabled", v)}
            disabled={disabled}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="vova-shadow" className="text-sm font-medium">
              Observation mode
            </Label>
            <p className="text-muted-foreground text-xs">
              Computes the answer and writes it to the logs without sending it.
              Use it to read what the assistant would have said, on real
              traffic, before a single user sees a reply. Turn it off only once
              the logs look right.
            </p>
          </div>
          <Switch
            id="vova-shadow"
            checked={form.shadowMode}
            onCheckedChange={(v) => set("shadowMode", v)}
            disabled={disabled}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="vova-rollout" className="text-sm font-medium">
              Rollout percentage
            </Label>
            <p className="text-muted-foreground text-xs">
              Share of profiles served by the assistant, ignored while
              observation mode is on. The same profile always falls on the same
              side, so nobody alternates between the assistant and the menu
              from one message to the next.
            </p>
          </div>
          <Input
            id="vova-rollout"
            type="number"
            min={0}
            max={100}
            value={form.rolloutPercent}
            onChange={(e) => set("rolloutPercent", e.target.value)}
            disabled={disabled || form.shadowMode}
            className="w-24"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="vova-timeout" className="text-sm font-medium">
              Reply budget (ms)
            </Label>
            <p className="text-muted-foreground text-xs">
              How long the assistant may take before the bot gives up and sends
              the welcome card instead. The user never sees an error — only a
              slower, ordinary reply. A tool-calling answer needs well over 5
              seconds.
            </p>
          </div>
          <Input
            id="vova-timeout"
            type="number"
            min={5000}
            max={60000}
            step={1000}
            value={form.timeoutMs}
            onChange={(e) => set("timeoutMs", e.target.value)}
            disabled={disabled}
            className="w-28"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="vova-anonymous" className="text-sm font-medium">
              Answer unregistered numbers
            </Label>
            <p className="text-muted-foreground text-xs">
              Lets a number with no account ask what Rabotka is and how it
              works. They get no personal data and no app card — only answers
              from the documentation, and <code>/compte</code> when they want to
              sign up. Needs the master switch as well. Observation mode and the
              rollout percentage do not apply: both key off a profile, and these
              callers have none.
            </p>
          </div>
          <Switch
            id="vova-anonymous"
            checked={form.anonymousEnabled}
            onCheckedChange={(v) => set("anonymousEnabled", v)}
            disabled={disabled}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="vova-anon-limit" className="text-sm font-medium">
              Daily replies per unregistered number
            </Label>
            <p className="text-muted-foreground text-xs">
              This is the only path where someone who never signed up can spend
              tokens, so it is metered. Past the limit the number gets the
              signup card for the rest of the day. Set to 0 to answer none.
            </p>
          </div>
          <Input
            id="vova-anon-limit"
            type="number"
            min={0}
            max={200}
            value={form.anonDailyLimit}
            onChange={(e) => set("anonDailyLimit", e.target.value)}
            disabled={disabled || !form.anonymousEnabled}
            className="w-24"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="vova-walled-limit" className="text-sm font-medium">
              Daily replies per blocked account
            </Label>
            <p className="text-muted-foreground text-xs">
              A suspended account, or one whose identity check is under review
              or was refused. These people have no menu, so the assistant is
              their only way to ask anything — and the one most likely to ask it
              twenty times, while earning nothing until they are unblocked.
              Past the limit they get the card that opens the app, for the rest
              of the day. Unlike unregistered numbers, they do go through
              observation mode and the rollout percentage, because they have a
              profile. Set to 0 to answer none.
            </p>
          </div>
          <Input
            id="vova-walled-limit"
            type="number"
            min={0}
            max={200}
            value={form.walledDailyLimit}
            onChange={(e) => set("walledDailyLimit", e.target.value)}
            disabled={disabled}
            className="w-24"
          />
        </div>
      </CardContent>
    </Card>
  );
}
