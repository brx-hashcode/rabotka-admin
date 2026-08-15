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

type FormState = {
  useEmbeddings: boolean;
  recommendationsEnabled: boolean;
  minNotificationScore: string;
  maxNotificationWorkers: string;
  notificationCooldownMinutes: string;
  recommendationMinScore: string;
};

const EMPTY: FormState = {
  useEmbeddings: false,
  recommendationsEnabled: true,
  minNotificationScore: "0.55",
  maxNotificationWorkers: "20",
  notificationCooldownMinutes: "60",
  recommendationMinScore: "0.3",
};

export function MatchingCard() {
  const { configs, isLoading, saveChanges, isSaving } =
    useSystemConfigCategory("MATCHING");

  const [form, setForm] = useState<FormState>(EMPTY);
  const [initial, setInitial] = useState<FormState>(EMPTY);

  const reindexMutation = useMutation({
    mutationFn: reindexMatching,
    onSuccess: () => toast.success("Re-indexing started in background"),
    onError: (error) => toast.error(error.message),
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
        data.minNotificationScore = item.value;
      if (item.key === "matching.max_notification_workers")
        data.maxNotificationWorkers = item.value;
      if (item.key === "matching.notification_cooldown_minutes")
        data.notificationCooldownMinutes = item.value;
      if (item.key === "matching.recommendation_min_score")
        data.recommendationMinScore = item.value;
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
    const score = parseFloat(form.minNotificationScore);
    if (isNaN(score) || score < 0 || score > 1) {
      toast.error("Le score de notification doit être entre 0 et 1");
      return;
    }
    const recoScore = parseFloat(form.recommendationMinScore);
    if (isNaN(recoScore) || recoScore < 0 || recoScore > 1) {
      toast.error("Le score de recommandation doit être entre 0 et 1");
      return;
    }
    const maxWorkers = parseInt(form.maxNotificationWorkers, 10);
    if (isNaN(maxWorkers) || maxWorkers < 1) {
      toast.error("Le nombre de travailleurs doit être au moins 1");
      return;
    }
    const cooldown = parseInt(form.notificationCooldownMinutes, 10);
    if (isNaN(cooldown) || cooldown < 0) {
      toast.error("Le délai doit être 0 ou plus");
      return;
    }

    await saveChanges({
      "matching.use_embeddings": String(form.useEmbeddings),
      "matching.recommendations_enabled": String(form.recommendationsEnabled),
      "matching.min_notification_score": String(score),
      "matching.max_notification_workers": String(maxWorkers),
      "matching.notification_cooldown_minutes": String(cooldown),
      "matching.recommendation_min_score": String(recoScore),
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
              Matching Algorithm
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Enable semantic similarity matching via embeddings
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
              Enable embeddings
            </Label>
            <p className="text-muted-foreground text-xs">
              When enabled, the system uses semantic similarity (vector
              embeddings) to suggest the best matches between job offers and
              workers. Disable if the embeddings service is not configured.
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
              Job recommendation notifications
            </Label>
            <p className="text-muted-foreground text-xs">
              When enabled, workers are notified via WhatsApp when a new job
              matches their profile. Disable to pause all recommendation
              notifications without touching code.
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
              Minimum notification score
            </Label>
            <p className="text-muted-foreground text-xs">
              Minimum match score (0–1) required before sending a recommendation
              notification. Higher values mean fewer but higher-quality alerts.
              Default: 0.55.
            </p>
          </div>
          <Input
            id="min-notification-score"
            type="number"
            min={0}
            max={1}
            step={0.05}
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
              Employer feed minimum score
            </Label>
            <p className="text-muted-foreground text-xs">
              Minimum match score (0–1) for the employer "recommended profiles"
              home feed. Lower values surface more nearby matches. Default: 0.3.
            </p>
          </div>
          <Input
            id="recommendation-min-score"
            type="number"
            min={0}
            max={1}
            step={0.05}
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
              htmlFor="max-notification-workers"
              className="text-sm font-medium"
            >
              Max notified workers per offer
            </Label>
            <p className="text-muted-foreground text-xs">
              Maximum number of workers who receive a WhatsApp notification when
              a new job offer is published. Each one is a paid message to
              someone who did not ask for it, so raise this in steps and watch
              the WhatsApp quality rating. The cooldown below caps how often any
              single worker can be reached, whatever this is set to. Default: 5.
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
              Minimum cooldown between notifications (minutes)
            </Label>
            <p className="text-muted-foreground text-xs">
              Prevents sending multiple recommendation notifications to the same
              worker in quick succession. Set to 0 to disable. Default: 60 min.
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
            <p className="text-sm font-medium">Re-index all data</p>
            <p className="text-muted-foreground text-xs">
              Re-embed all existing job offers and worker/employer profiles into
              Qdrant. Runs in the background. Use this after enabling embeddings
              for the first time or after a Qdrant reset.
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
            {reindexMutation.isPending ? "Starting..." : "Re-index"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
