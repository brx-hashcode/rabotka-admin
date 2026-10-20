import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { getOnboardingStats } from "#/lib/api/onboarding-attempts-controller";
import { FUNNEL_LABELS } from "../stage-labels";

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-xs">{hint}</p>
      </CardContent>
    </Card>
  );
}

export function OnboardingFunnel() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "onboarding-attempts", "stats"],
    queryFn: () => getOnboardingStats(),
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const rate = Math.round(data.completionRate * 100);
  const toCall = data.dropped - data.contacted;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <StatTile
          label="Inscriptions commencées"
          value={String(data.started)}
          hint="Un code WhatsApp demandé"
        />
        <StatTile
          label="Comptes créés"
          value={String(data.completed)}
          hint={`${rate} % des inscriptions commencées`}
        />
        <StatTile
          label="Abandons"
          value={String(data.dropped)}
          hint="Commencées, jamais terminées"
        />
        <StatTile
          label="À contacter"
          value={String(Math.max(0, toCall))}
          hint={`${data.contacted} déjà contacté${data.contacted > 1 ? "s" : ""}`}
        />
      </div>

      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Où les inscriptions s'arrêtent</CardTitle>
          <CardDescription>
            Combien sont allés au moins jusqu'à chaque étape. L'écart entre deux
            barres, c'est où les gens abandonnent.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {data.funnel.map((step, index) => {
            const share = data.started ? step.count / data.started : 0;
            const previous = index > 0 ? data.funnel[index - 1].count : null;
            const lost = previous === null ? 0 : previous - step.count;
            return (
              <div
                key={step.stage}
                className="grid grid-cols-[minmax(0,14rem)_1fr_auto] items-center gap-3 text-sm"
              >
                <span className="truncate">{FUNNEL_LABELS[step.stage]}</span>
                <div className="bg-muted h-3 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${Math.round(share * 100)}%` }}
                  />
                </div>
                <span className="w-28 text-right tabular-nums">
                  {step.count}
                  {lost > 0 && (
                    <span className="text-destructive ml-2 text-xs">−{lost}</span>
                  )}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
