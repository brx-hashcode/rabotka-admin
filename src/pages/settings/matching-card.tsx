import { useState, useEffect } from "react";
import { IconBrain } from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Switch } from "#/components/ui/switch";
import { Label } from "#/components/ui/label";

export function MatchingCard() {
  const { configs, isLoading, saveChanges, isSaving } =
    useSystemConfigCategory("MATCHING");

  const [useEmbeddings, setUseEmbeddings] = useState(false);

  useEffect(() => {
    const item = configs.find((c) => c.key === "matching.use_embeddings");
    if (!item) return;
    setUseEmbeddings(item.value === "true");
  }, [configs]);

  async function handleToggle(checked: boolean) {
    setUseEmbeddings(checked);
    await saveChanges({
      "matching.use_embeddings": String(checked),
    });
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

      <CardContent>
        <div className="flex items-center justify-between gap-4">
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
      </CardContent>
    </Card>
  );
}
