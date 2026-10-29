import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageListHeader } from "#/components/page-list-header";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
  DropoffFunnel,
  DropoffKpis,
  LeakCallout,
  OnboardingAttemptsTable,
} from "#/features/onboarding-attempts";
import {
  ENTRY_LABELS,
  PERIOD_LABELS,
  periodWindows,
  type DropoffPeriod,
  type EntryFilter,
} from "#/features/onboarding-attempts/stage-labels";
import {
  getOnboardingStats,
  type OnboardingStage,
} from "#/lib/api/onboarding-attempts-controller";

/**
 * Sign-up drop-offs, laid out the way funnel tools do it: the headline numbers
 * against the previous period, the funnel with the biggest loss called out,
 * then the people to call back. One period, and one kind of sign-up (the
 * app's WhatsApp code or a business's email), drive all three: the two go
 * through different steps, and mixed they read as one muddled funnel.
 */
export default function OnboardingDropoffsPage() {
  const [period, setPeriod] = useState<DropoffPeriod>("30d");
  const [entry, setEntry] = useState<EntryFilter>("all");
  // The step picked in the funnel filters the list under it.
  const [stage, setStage] = useState<OnboardingStage | null>(null);

  // Recomputed when the period changes, not on every render: the windows end
  // « now », and a moving key would refetch forever.
  const windows = useMemo(() => periodWindows(period), [period]);
  const kind = entry === "all" ? {} : { entry };

  const { data: stats } = useQuery({
    queryKey: ["admin", "onboarding-attempts", "stats", windows.current, entry],
    queryFn: () => getOnboardingStats({ ...windows.current, ...kind }),
  });
  const { data: previous } = useQuery({
    queryKey: ["admin", "onboarding-attempts", "stats", windows.previous, entry],
    queryFn: () => getOnboardingStats({ ...(windows.previous ?? {}), ...kind }),
    enabled: windows.previous !== null,
  });

  const showStage = (s: OnboardingStage) => {
    setStage(s);
    document
      .getElementById("dropoff-list")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pt-6">
      <PageListHeader
        className="mb-2"
        title="Inscriptions inachevées"
        description="Qui a commencé son inscription sans la terminer, à quelle étape, et qui rappeler."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              value={entry}
              onValueChange={(v) => {
                setEntry(v as EntryFilter);
                setStage(null);
              }}
            >
              <TabsList className="h-9" aria-label="Type d'inscription">
                {(Object.keys(ENTRY_LABELS) as EntryFilter[]).map((e) => (
                  <TabsTrigger key={e} value={e}>
                    {ENTRY_LABELS[e]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Tabs
              value={period}
              onValueChange={(v) => {
                setPeriod(v as DropoffPeriod);
                setStage(null);
              }}
            >
              <TabsList className="h-9" aria-label="Période">
                {(Object.keys(PERIOD_LABELS) as DropoffPeriod[]).map((p) => (
                  <TabsTrigger key={p} value={p}>
                    {PERIOD_LABELS[p]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        }
      />
      <DropoffKpis
        stats={stats}
        previous={windows.previous ? previous : undefined}
        entry={entry}
      />
      <LeakCallout stats={stats} entry={entry} onShow={showStage} />
      <DropoffFunnel stats={stats} entry={entry} selected={stage} onSelect={setStage} />
      <div id="dropoff-list" className="scroll-mt-4">
        <OnboardingAttemptsTable
          stats={stats}
          entry={entry}
          stage={stage}
          onClearStage={() => setStage(null)}
          window={windows.current}
        />
      </div>
    </div>
  );
}
