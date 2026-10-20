import { IconChevronRight } from "@tabler/icons-react";
import { Card } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { cn } from "#/lib/utils";
import type {
  AdminOnboardingStats,
  OnboardingStage,
} from "#/lib/api/onboarding-attempts-controller";
import { DROP_STAGES, STAGE_LABELS, STOPPED_HINTS, stoppedAt } from "../stage-labels";

/**
 * The sign-up, step by step, with how many people stopped at each one. The
 * cards ARE the filter: pick one and the list below shows those people. The
 * worst step is marked, since that is where a fix would help most.
 */
export function DropoffSteps({
  stats,
  selected,
  onSelect,
}: Readonly<{
  stats: AdminOnboardingStats | undefined;
  selected: OnboardingStage | null;
  onSelect: (stage: OnboardingStage | null) => void;
}>) {
  if (!stats) {
    return (
      <div className="grid gap-3 md:grid-cols-4">
        {DROP_STAGES.map((s) => (
          <Skeleton key={s} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  const stopped = stoppedAt(stats.funnel);
  const worst = Math.max(...DROP_STAGES.map((s) => stopped[s]));

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {DROP_STAGES.map((stage, i) => {
        const count = stopped[stage];
        const share = stats.started ? Math.round((count / stats.started) * 100) : 0;
        const isSelected = selected === stage;
        const isWorst = count > 0 && count === worst;
        return (
          <button
            key={stage}
            type="button"
            onClick={() => onSelect(isSelected ? null : stage)}
            aria-pressed={isSelected}
            className="text-left"
          >
            <Card
              className={cn(
                "relative h-full gap-2 p-4 transition-colors hover:bg-muted/50",
                isSelected && "border-primary ring-primary/30 ring-2",
              )}
            >
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                <span className="bg-muted text-foreground flex size-5 items-center justify-center rounded-full text-[11px]">
                  {i + 1}
                </span>
                {STAGE_LABELS[stage]}
                {i < DROP_STAGES.length - 1 && (
                  <IconChevronRight className="ml-auto size-3.5 opacity-40" />
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">{count}</span>
                <span className="text-muted-foreground text-sm">
                  arrêté{count > 1 ? "s" : ""} ici · {share} %
                </span>
              </div>
              <p className="text-muted-foreground text-xs">{STOPPED_HINTS[stage]}</p>
              {isWorst && (
                <span className="bg-destructive/10 text-destructive absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-medium">
                  Plus gros abandon
                </span>
              )}
            </Card>
          </button>
        );
      })}
    </div>
  );
}

/** One line under the title: the whole picture before the detail. */
export function DropoffSummary({
  stats,
}: Readonly<{ stats: AdminOnboardingStats | undefined }>) {
  if (!stats) return <Skeleton className="h-5 w-96" />;
  const rate = Math.round(stats.completionRate * 100);
  const toCall = Math.max(0, stats.dropped - stats.contacted);
  return (
    <p className="text-muted-foreground text-sm">
      <span className="text-foreground font-medium tabular-nums">{stats.started}</span>{" "}
      inscription{stats.started > 1 ? "s" : ""} commencée{stats.started > 1 ? "s" : ""} ·{" "}
      <span className="text-foreground font-medium tabular-nums">{stats.completed}</span>{" "}
      compte{stats.completed > 1 ? "s" : ""} créé{stats.completed > 1 ? "s" : ""} ({rate} %) ·{" "}
      <span className="text-foreground font-medium tabular-nums">{toCall}</span> à rappeler
    </p>
  );
}
