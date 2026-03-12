import { useState, useEffect } from "react";
import { IconBrain } from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Checkbox } from "#/components/ui/checkbox";
import { Label } from "#/components/ui/label";

export function MatchingCard() {
  const { configs, isLoading, saveChanges, isSaving } =
    useSystemConfigCategory("MATCHING");

  const [useEmbeddings, setUseEmbeddings] = useState(false);
  const [initial, setInitial] = useState(false);

  useEffect(() => {
    const item = configs.find((c) => c.key === "matching.use_embeddings");
    if (!item) return;
    const val = item.value === "true";
    setUseEmbeddings(val);
    setInitial(val);
  }, [configs]);

  const isDirty = useEmbeddings !== initial;

  async function handleSave() {
    await saveChanges({
      "matching.use_embeddings": String(useEmbeddings),
    });
    setInitial(useEmbeddings);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <IconBrain className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Algorithme de matching
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Activation de la similarité sémantique par embeddings
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || isSaving || isLoading}
        >
          {isSaving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Checkbox
            id="use-embeddings"
            checked={useEmbeddings}
            onCheckedChange={(checked) => setUseEmbeddings(checked === true)}
          />
          <div className="space-y-1">
            <Label htmlFor="use-embeddings" className="text-sm font-medium">
              Activer les embeddings
            </Label>
            <p className="text-muted-foreground text-xs">
              Lorsqu'activé, le système utilise la similarité sémantique
              (embeddings vectoriels) pour suggérer les meilleures
              correspondances entre offres et travailleurs. Désactivez si le
              service d'embeddings n'est pas configuré.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
