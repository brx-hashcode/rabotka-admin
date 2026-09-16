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
  /** Shown in seconds; stored as milliseconds. */
  timeoutSeconds: string;
  anonymousEnabled: boolean;
  anonDailyLimit: string;
  walledDailyLimit: string;
};

const EMPTY: FormState = {
  enabled: false,
  shadowMode: true,
  rolloutPercent: "0",
  timeoutSeconds: "25",
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
      text: "Off — the WhatsApp bot replies as usual, with its welcome card.",
      tone: "off",
    };
  }
  if (form.shadowMode) {
    return {
      text: "Test mode — VoVa writes its answers in the activity logs only. People still get the usual welcome card; nothing from VoVa is sent.",
      tone: "watch",
    };
  }
  const percent = Number(form.rolloutPercent);
  if (!Number.isFinite(percent) || percent <= 0) {
    return {
      text: "Off in practice — test mode is off, but the share of users is 0%, so nobody gets VoVa's answers.",
      tone: "off",
    };
  }
  return {
    text: `LIVE — about ${percent}% of workers and employers get answers written by VoVa.`,
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
      if (item.key === "vova.timeout_ms")
        data.timeoutSeconds = msToSeconds(item.value);
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
      toast.error("The share of users must be between 0 and 100%.");
      return;
    }
    const seconds = Number.parseFloat(form.timeoutSeconds);
    // Below ~5s a tool-calling turn cannot finish, so every message would fall
    // back — indistinguishable from the assistant being switched off.
    if (Number.isNaN(seconds) || seconds < 5 || seconds > 60) {
      toast.error("The maximum reply time must be between 5 and 60 seconds.");
      return;
    }
    const timeout = Math.round(seconds * 1000);

    const anonLimit = parseInt(form.anonDailyLimit, 10);
    if (isNaN(anonLimit) || anonLimit < 0 || anonLimit > 200) {
      toast.error("Replies per unregistered number must be between 0 and 200.");
      return;
    }

    const walledLimit = parseInt(form.walledDailyLimit, 10);
    if (isNaN(walledLimit) || walledLimit < 0 || walledLimit > 200) {
      toast.error("Replies per blocked account must be between 0 and 200.");
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
            <CardTitle className="text-base font-semibold">VoVa assistant</CardTitle>
            <p className="text-muted-foreground text-xs">
              The WhatsApp assistant that answers questions people type in their own words
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
              {form.anonDailyLimit} replies a day each. Test mode and the share
              of users don't apply to them.
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="vova-enabled" className="text-sm font-medium">
              Turn on VoVa
            </Label>
            <p className="text-muted-foreground text-xs">
              The main switch. When off, a message the bot doesn't understand
              gets the usual welcome card. Turning this on sends nothing to
              people while test mode is on.
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
              Test mode
            </Label>
            <p className="text-muted-foreground text-xs">
              VoVa writes its answers in the activity logs without sending
              them, so you can read what it would have said to real people
              first. Turn it off only when those answers look right.
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
              Share of users (%)
            </Label>
            <p className="text-muted-foreground text-xs">
              How many people get VoVa's answers once test mode is off. A person
              always stays on the same side, so nobody switches between VoVa
              and the usual bot from one message to the next.
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
              Maximum reply time (seconds)
            </Label>
            <p className="text-muted-foreground text-xs">
              How long VoVa may think before the bot sends the welcome card
              instead. People never see an error, only the usual reply. Most
              answers need well over 5 seconds.
            </p>
          </div>
          <Input
            id="vova-timeout"
            type="number"
            min={5}
            max={60}
            step={1}
            value={form.timeoutSeconds}
            onChange={(e) => set("timeoutSeconds", e.target.value)}
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
              Lets someone without an account ask what Rabotka is and how it
              works. They only get general answers — nothing personal — and a
              way to sign up when they ask. Needs "Turn on VoVa" too. Test mode
              and the share of users don't apply, because these people have no
              account.
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
              Each answer has a cost, and these people haven't signed up, so
              their replies are limited. Past the limit they get the sign-up
              card for the rest of the day. Set to 0 to answer none.
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
              Accounts that are suspended, or whose identity check is waiting or
              was refused. They have no menu, so VoVa is their only way to ask
              questions, and they may ask many times. Past the limit they get
              the card that opens the app for the rest of the day. Test mode and
              the share of users do apply to them. Set to 0 to answer none.
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

function msToSeconds(stored: string): string {
  const ms = Number.parseInt(stored, 10);
  return Number.isNaN(ms) ? stored : String(ms / 1000);
}
