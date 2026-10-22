import { IconAlertTriangle, IconArrowDown, IconArrowRight } from "@tabler/icons-react";
import { Button } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { cn } from "#/lib/utils";
import type {
  AdminOnboardingStats,
  OnboardingStage,
} from "#/lib/api/onboarding-attempts-controller";
import {
  REACHED_LABELS,
  STAGE_LABELS,
  STOPPED_HINTS,
  biggestLeak,
  deltaLabel,
  funnelSteps,
  stoppedStageFor,
} from "../stage-labels";

const pct = (n: number) => `${Math.round(n * 100)} %`;

/**
 * The four numbers to read first, each against the period before — so a bad
 * week is visible as one, not just as a number.
 */
export function DropoffKpis({
  stats,
  previous,
}: Readonly<{
  stats: AdminOnboardingStats | undefined;
  previous: AdminOnboardingStats | undefined;
}>) {
  if (!stats) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  const toCall = Math.max(0, stats.dropped - stats.contacted);
  const prevToCall = previous
    ? Math.max(0, previous.dropped - previous.contacted)
    : undefined;

  const tiles: {
    label: string;
    value: string;
    hint: string;
    delta: string | null;
    /** Whether a rise is good news. */
    upIsGood: boolean;
    raw: number;
    prevRaw: number | undefined;
  }[] = [
    {
      label: "Inscriptions commencées",
      value: String(stats.started),
      hint: "Code WhatsApp demandé",
      delta: deltaLabel(stats.started, previous?.started),
      upIsGood: true,
      raw: stats.started,
      prevRaw: previous?.started,
    },
    {
      label: "Comptes créés",
      value: String(stats.completed),
      hint: `${pct(stats.completionRate)} de conversion`,
      delta: deltaLabel(stats.completed, previous?.completed),
      upIsGood: true,
      raw: stats.completed,
      prevRaw: previous?.completed,
    },
    {
      label: "Abandons",
      value: String(stats.dropped),
      hint: stats.started
        ? `${pct(stats.dropped / stats.started)} des inscriptions`
        : "Aucune inscription",
      delta: deltaLabel(stats.dropped, previous?.dropped),
      upIsGood: false,
      raw: stats.dropped,
      prevRaw: previous?.dropped,
    },
    {
      label: "À rappeler",
      value: String(toCall),
      hint: `${stats.contacted} déjà contactée${stats.contacted > 1 ? "s" : ""}`,
      delta: deltaLabel(toCall, prevToCall),
      upIsGood: false,
      raw: toCall,
      prevRaw: prevToCall,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((t) => {
        const better =
          t.prevRaw === undefined || t.raw === t.prevRaw
            ? null
            : (t.raw > t.prevRaw) === t.upIsGood;
        return (
          <Card key={t.label} className="gap-1 p-4">
            <span className="text-muted-foreground text-xs font-medium">
              {t.label}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums">{t.value}</span>
              {t.delta && (
                <span
                  title="Par rapport à la période précédente"
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
                    better === null && "bg-muted text-muted-foreground",
                    better === true && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    better === false && "bg-destructive/10 text-destructive",
                  )}
                >
                  {t.delta}
                </span>
              )}
            </div>
            <span className="text-muted-foreground text-xs">{t.hint}</span>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * The sign-up as a funnel: one bar per step, as wide as the share of starters
 * who got that far, and between bars what each step lost. The biggest loss is
 * marked — that is where a fix would help most. A bar with losses is also the
 * way into the list: it filters to the people who stopped just before it.
 */
export function DropoffFunnel({
  stats,
  selected,
  onSelect,
}: Readonly<{
  stats: AdminOnboardingStats | undefined;
  selected: OnboardingStage | null;
  onSelect: (stage: OnboardingStage | null) => void;
}>) {
  if (!stats) return <Skeleton className="h-80 rounded-2xl" />;

  const steps = funnelSteps(stats);
  const leak = biggestLeak(steps);

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Parcours d'inscription</h2>
          <p className="text-muted-foreground text-sm">
            Combien arrivent à chaque étape. Touchez une perte pour voir qui rappeler.
          </p>
        </div>
        <span className="text-muted-foreground text-sm">
          Conversion globale{" "}
          <span className="text-foreground font-semibold tabular-nums">
            {pct(stats.completionRate)}
          </span>
        </span>
      </div>

      {stats.started === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Aucune inscription commencée sur cette période.
        </p>
      ) : (
        <ol className="flex flex-col">
          {steps.map((step, i) => {
            const stoppedStage = stoppedStageFor(step.stage);
            const isLeak = leak?.stage === step.stage;
            const isSelected = i > 0 && selected === stoppedStage;
            return (
              <li key={step.stage} className="flex flex-col">
                {i > 0 && (
                  <button
                    type="button"
                    disabled={step.lostBefore === 0}
                    onClick={() => onSelect(isSelected ? null : stoppedStage)}
                    aria-pressed={isSelected}
                    className={cn(
                      "group ml-3 flex items-center gap-2 border-l-2 border-dashed py-1.5 pl-4 text-left text-xs transition-colors",
                      step.lostBefore === 0
                        ? "text-muted-foreground/60 cursor-default"
                        : "hover:text-foreground cursor-pointer",
                      isLeak ? "border-destructive/50 text-destructive" : "text-muted-foreground",
                      isSelected && "text-foreground font-medium",
                    )}
                  >
                    <IconArrowDown className="size-3.5 shrink-0" />
                    {step.lostBefore === 0 ? (
                      "Aucune perte"
                    ) : (
                      <>
                        <span className="tabular-nums">
                          −{step.lostBefore} · {pct(step.lostBeforeRate)} perdus
                        </span>
                        <span className="hidden sm:inline">
                          — {STOPPED_HINTS[stoppedStage].toLowerCase()}
                        </span>
                        {isLeak && (
                          <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-[11px] font-medium">
                            Plus grosse perte
                          </span>
                        )}
                        <span
                          className={cn(
                            "ml-auto rounded-md px-2 py-0.5 text-[11px] font-medium",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground opacity-0 group-hover:opacity-100",
                          )}
                        >
                          {isSelected ? "Filtré" : "Voir qui"}
                        </span>
                      </>
                    )}
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <span className="bg-muted text-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium">
                        {REACHED_LABELS[step.stage]}
                      </span>
                      <span className="text-muted-foreground shrink-0 tabular-nums">
                        <span className="text-foreground font-semibold">
                          {step.reached}
                        </span>{" "}
                        · {pct(step.ofStart)}
                      </span>
                    </div>
                    <div className="bg-muted h-3 overflow-hidden rounded-full">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-500",
                          step.stage === "COMPLETED" ? "bg-emerald-500" : "bg-primary",
                        )}
                        style={{ width: `${Math.max(step.ofStart * 100, step.reached ? 2 : 0)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

/**
 * The one sentence that says what to do: where people leave most, and a
 * button straight to them.
 */
export function LeakCallout({
  stats,
  onShow,
}: Readonly<{
  stats: AdminOnboardingStats | undefined;
  onShow: (stage: OnboardingStage) => void;
}>) {
  if (!stats) return null;
  const leak = biggestLeak(funnelSteps(stats));
  if (!leak) return null;
  const stage = stoppedStageFor(leak.stage);
  return (
    <div className="border-destructive/30 bg-destructive/5 flex flex-wrap items-center gap-3 rounded-2xl border p-4">
      <IconAlertTriangle className="text-destructive size-5 shrink-0" />
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-semibold">Plus gros abandon : {STAGE_LABELS[stage]}.</span>{" "}
        <span className="text-muted-foreground">
          {leak.lostBefore} personne{leak.lostBefore > 1 ? "s" : ""} (
          {pct(leak.lostBeforeRate)}) {leak.lostBefore > 1 ? "s'arrêtent" : "s'arrête"} ici —{" "}
          {STOPPED_HINTS[stage].toLowerCase()}.
        </span>
      </p>
      <Button size="sm" variant="outline" onClick={() => onShow(stage)}>
        Voir ces personnes
        <IconArrowRight />
      </Button>
    </div>
  );
}
