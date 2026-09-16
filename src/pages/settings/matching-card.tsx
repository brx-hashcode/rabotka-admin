import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { IconBrain, IconRefresh } from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Switch } from "#/components/ui/switch";
import { Label } from "#/components/ui/label";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { toast } from "sonner";
import { reindexMatching } from "#/lib/api/matching-controller";
import { friendlyError } from "#/lib/api/friendly-error";

type FormState = {
  useEmbeddings: boolean;
  recommendationsEnabled: boolean;
  minNotificationScore: string;
  maxNotificationWorkers: string;
  notificationCooldownMinutes: string;
  recommendationMinScore: string;
  reliabilityThreshold: string;
};

const EMPTY: FormState = {
  useEmbeddings: false,
  recommendationsEnabled: true,
  // The two match scores are stored as 0–1 and shown as percentages.
  minNotificationScore: "55",
  maxNotificationWorkers: "20",
  notificationCooldownMinutes: "60",
  recommendationMinScore: "30",
  reliabilityThreshold: "50",
};

export function MatchingCard() {
  const { configs, isLoading, saveChanges, isSaving } =
    useSystemConfigCategory("MATCHING");

  const [form, setForm] = useState<FormState>(EMPTY);
  const [initial, setInitial] = useState<FormState>(EMPTY);

  const reindexMutation = useMutation({
    mutationFn: reindexMatching,
    onSuccess: () => toast.success("Refreshing the matching data. This runs in the background."),
    onError: (error) => toast.error(friendlyError(error, "Couldn't refresh the matching data. Try again.")),
  });

  useEffect(() => {
    if (configs.length === 0) return;
    const data = { ...EMPTY };
    for (const item of configs) {
      if (item.key === "matching.use_embeddings")
        data.useEmbeddings = item.value === "true";
      if (item.key === "matching.recommendations_enabled")
        data.recommendationsEnabled = item.value === "true";
      if (item.key === "matching.min_notification_score")
        data.minNotificationScore = toPercent(item.value);
      if (item.key === "matching.max_notification_workers")
        data.maxNotificationWorkers = item.value;
      if (item.key === "matching.notification_cooldown_minutes")
        data.notificationCooldownMinutes = item.value;
      if (item.key === "matching.recommendation_min_score")
        data.recommendationMinScore = toPercent(item.value);
      if (item.key === "matching.reliability_threshold")
        data.reliabilityThreshold = item.value;
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
    const score = fromPercent(form.minNotificationScore);
    if (score === null) {
      toast.error("The minimum match for alerts must be between 0 and 100%.");
      return;
    }
    const recoScore = fromPercent(form.recommendationMinScore);
    if (recoScore === null) {
      toast.error("The minimum match for employers must be between 0 and 100%.");
      return;
    }
    const maxWorkers = parseInt(form.maxNotificationWorkers, 10);
    if (isNaN(maxWorkers) || maxWorkers < 1) {
      toast.error("At least 1 worker must be alerted per job.");
      return;
    }
    const cooldown = parseInt(form.notificationCooldownMinutes, 10);
    if (isNaN(cooldown) || cooldown < 0) {
      toast.error("The waiting time must be 0 minutes or more.");
      return;
    }

    const reliability = parseInt(form.reliabilityThreshold, 10);
    if (isNaN(reliability) || reliability < 0 || reliability > 100) {
      toast.error("The minimum reliability must be between 0 and 100.");
      return;
    }

    await saveChanges({
      "matching.use_embeddings": String(form.useEmbeddings),
      "matching.recommendations_enabled": String(form.recommendationsEnabled),
      "matching.min_notification_score": String(score),
      "matching.max_notification_workers": String(maxWorkers),
      "matching.notification_cooldown_minutes": String(cooldown),
      "matching.recommendation_min_score": String(recoScore),
      "matching.reliability_threshold": String(reliability),
    });
    setInitial(form);
  }

  const disabled = isLoading || isSaving;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <IconBrain className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Job matching
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              How workers and jobs are suggested to each other
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || disabled}
        >
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4 pt-6">
          <div className="space-y-1">
            <Label htmlFor="use-embeddings" className="text-sm font-medium">
              Smart matching
            </Label>
            <p className="text-muted-foreground text-xs">
              Suggests jobs and workers by the meaning of what they describe,
              not only exact words — "plombier" also finds "sanitaire". Turn
              off if the tech team says the matching service isn't set up.
            </p>
          </div>
          <Switch
            id="use-embeddings"
            checked={form.useEmbeddings}
            onCheckedChange={(v) => set("useEmbeddings", v)}
            disabled={disabled}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="recommendations-enabled"
              className="text-sm font-medium"
            >
              Job alerts on WhatsApp
            </Label>
            <p className="text-muted-foreground text-xs">
              Workers get a WhatsApp message when a new job suits them. Turn
              off to pause all these alerts.
            </p>
          </div>
          <Switch
            id="recommendations-enabled"
            checked={form.recommendationsEnabled}
            onCheckedChange={(v) => set("recommendationsEnabled", v)}
            disabled={disabled}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="min-notification-score"
              className="text-sm font-medium"
            >
              Minimum match for job alerts (%)
            </Label>
            <p className="text-muted-foreground text-xs">
              How well a job must suit a worker before we alert them. Higher
              means fewer, better alerts. Usual value: 55%.
            </p>
          </div>
          <Input
            id="min-notification-score"
            type="number"
            min={0}
            max={100}
            step={5}
            value={form.minNotificationScore}
            onChange={(e) => set("minNotificationScore", e.target.value)}
            disabled={disabled}
            className="w-24 text-right"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="recommendation-min-score"
              className="text-sm font-medium"
            >
              Minimum match for employers' suggestions (%)
            </Label>
            <p className="text-muted-foreground text-xs">
              How well a worker must suit an employer to appear in their
              "recommended profiles". Lower shows more people nearby. Usual
              value: 30%.
            </p>
          </div>
          <Input
            id="recommendation-min-score"
            type="number"
            min={0}
            max={100}
            step={5}
            value={form.recommendationMinScore}
            onChange={(e) => set("recommendationMinScore", e.target.value)}
            disabled={disabled}
            className="w-24 text-right"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="reliability-threshold"
              className="text-sm font-medium"
            >
              Minimum reliability to be suggested
            </Label>
            <p className="text-muted-foreground text-xs">
              Workers below this reliability score (out of 100) are not
              suggested for jobs. This is different from the lowest score
              under Fees &amp; Penalties, which is how low a score can go.
              Usual value: 50.
            </p>
          </div>
          <Input
            id="reliability-threshold"
            type="number"
            min={0}
            max={100}
            step={1}
            value={form.reliabilityThreshold}
            onChange={(e) => set("reliabilityThreshold", e.target.value)}
            disabled={disabled}
            className="w-24 text-right"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="max-notification-workers"
              className="text-sm font-medium"
            >
              Workers alerted per job
            </Label>
            <p className="text-muted-foreground text-xs">
              How many workers get a WhatsApp alert for each new job. Each alert
              is a paid message the worker didn't ask for, so raise this slowly
              and keep an eye on WhatsApp's quality rating. The waiting time
              below still limits how often one worker is contacted. Usual
              value: 5.
            </p>
          </div>
          <Input
            id="max-notification-workers"
            type="number"
            min={1}
            step={1}
            value={form.maxNotificationWorkers}
            onChange={(e) => set("maxNotificationWorkers", e.target.value)}
            disabled={disabled}
            className="w-24 text-right"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="notification-cooldown" className="text-sm font-medium">
              Waiting time between alerts (minutes)
            </Label>
            <p className="text-muted-foreground text-xs">
              Stops one worker from getting several alerts in a row. Set to 0
              for no waiting time. Usual value: 60 minutes.
            </p>
          </div>
          <Input
            id="notification-cooldown"
            type="number"
            min={0}
            step={5}
            value={form.notificationCooldownMinutes}
            onChange={(e) => set("notificationCooldownMinutes", e.target.value)}
            disabled={disabled}
            className="w-24 text-right"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Refresh matching data</p>
            <p className="text-muted-foreground text-xs">
              Re-reads every job and profile so smart matching is up to date.
              It runs in the background. Use it after turning smart matching on
              for the first time, or when the tech team asks.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => reindexMutation.mutate()}
            disabled={reindexMutation.isPending}
          >
            <IconRefresh
              className={`size-4 mr-2 ${reindexMutation.isPending ? "animate-spin" : ""}`}
            />
            {reindexMutation.isPending ? "Starting…" : "Refresh"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function toPercent(stored: string): string {
  const value = Number.parseFloat(stored);
  return Number.isNaN(value) ? stored : String(Math.round(value * 100));
}

/** A percentage typed by the admin, as the 0–1 value the server stores. */
function fromPercent(typed: string): number | null {
  const value = Number.parseFloat(typed);
  if (Number.isNaN(value) || value < 0 || value > 100) return null;
  return Math.round(value * 100) / 10000;
}
