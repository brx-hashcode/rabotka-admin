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

export function MatchingCard() {
  const { configs, isLoading, saveChanges, isSaving } =
    useSystemConfigCategory("MATCHING");

  const [useEmbeddings, setUseEmbeddings] = useState(false);
  const [recommendationsEnabled, setRecommendationsEnabled] = useState(true);
  const [minNotificationScore, setMinNotificationScore] = useState("0.55");
  const [maxNotificationWorkers, setMaxNotificationWorkers] = useState("20");
  const [notificationCooldownMinutes, setNotificationCooldownMinutes] = useState("60");

  const reindexMutation = useMutation({
    mutationFn: reindexMatching,
    onSuccess: () => toast.success("Re-indexing started in background"),
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    for (const item of configs) {
      if (item.key === "matching.use_embeddings") setUseEmbeddings(item.value === "true");
      if (item.key === "matching.recommendations_enabled") setRecommendationsEnabled(item.value === "true");
      if (item.key === "matching.min_notification_score") setMinNotificationScore(item.value);
      if (item.key === "matching.max_notification_workers") setMaxNotificationWorkers(item.value);
      if (item.key === "matching.notification_cooldown_minutes") setNotificationCooldownMinutes(item.value);
    }
  }, [configs]);

  async function handleToggle(checked: boolean) {
    setUseEmbeddings(checked);
    await saveChanges({ "matching.use_embeddings": String(checked) });
  }

  async function handleRecommendationsToggle(checked: boolean) {
    setRecommendationsEnabled(checked);
    await saveChanges({ "matching.recommendations_enabled": String(checked) });
  }

  async function handleScoreBlur() {
    const n = parseFloat(minNotificationScore);
    if (isNaN(n) || n < 0 || n > 1) {
      toast.error("Score must be between 0 and 1");
      return;
    }
    await saveChanges({ "matching.min_notification_score": String(n) });
  }

  async function handleMaxWorkersBlur() {
    const n = parseInt(maxNotificationWorkers, 10);
    if (isNaN(n) || n < 1) {
      toast.error("Value must be at least 1");
      return;
    }
    await saveChanges({ "matching.max_notification_workers": String(n) });
  }

  async function handleCooldownBlur() {
    const n = parseInt(notificationCooldownMinutes, 10);
    if (isNaN(n) || n < 0) {
      toast.error("Cooldown must be 0 or greater");
      return;
    }
    await saveChanges({ "matching.notification_cooldown_minutes": String(n) });
  }

  return (
    <Card>
      <CardHeader className="space-y-0 pb-4">
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
            checked={useEmbeddings}
            onCheckedChange={handleToggle}
            disabled={isLoading || isSaving}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="recommendations-enabled" className="text-sm font-medium">
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
            checked={recommendationsEnabled}
            onCheckedChange={handleRecommendationsToggle}
            disabled={isLoading || isSaving}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="min-notification-score" className="text-sm font-medium">
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
            value={minNotificationScore}
            onChange={(e) => setMinNotificationScore(e.target.value)}
            onBlur={handleScoreBlur}
            disabled={isLoading || isSaving}
            className="w-24 text-right"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="max-notification-workers" className="text-sm font-medium">
              Max notified workers per offer
            </Label>
            <p className="text-muted-foreground text-xs">
              Maximum number of workers who receive a WhatsApp notification when a new
              job offer is published. Default: 20.
            </p>
          </div>
          <Input
            id="max-notification-workers"
            type="number"
            min={1}
            step={1}
            value={maxNotificationWorkers}
            onChange={(e) => setMaxNotificationWorkers(e.target.value)}
            onBlur={handleMaxWorkersBlur}
            disabled={isLoading || isSaving}
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
              Prevents sending multiple recommendation notifications to the same worker
              in quick succession. Set to 0 to disable. Default: 60 min.
            </p>
          </div>
          <Input
            id="notification-cooldown"
            type="number"
            min={0}
            step={5}
            value={notificationCooldownMinutes}
            onChange={(e) => setNotificationCooldownMinutes(e.target.value)}
            onBlur={handleCooldownBlur}
            disabled={isLoading || isSaving}
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
            <IconRefresh className={`size-4 mr-2 ${reindexMutation.isPending ? "animate-spin" : ""}`} />
            {reindexMutation.isPending ? "Starting..." : "Re-index"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
