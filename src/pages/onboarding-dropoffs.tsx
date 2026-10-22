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
  PERIOD_LABELS,
  periodWindows,
  type DropoffPeriod,
} from "#/features/onboarding-attempts/stage-labels";
import {
  getOnboardingStats,
  type OnboardingStage,
} from "#/lib/api/onboarding-attempts-controller";

/**
 * Sign-up drop-offs, laid out the way funnel tools do it: the headline numbers
 * against the previous period, the funnel with the biggest loss called out,
 * then the people to call back. One period drives all three.
 */
export default function OnboardingDropoffsPage() {
  const [period, setPeriod] = useState<DropoffPeriod>("30d");
  // The step picked in the funnel filters the list under it.
  const [stage, setStage] = useState<OnboardingStage | null>(null);

  // Recomputed when the period changes, not on every render: the windows end
  // « now », and a moving key would refetch forever.
  const windows = useMemo(() => periodWindows(period), [period]);

  const { data: stats } = useQuery({
    queryKey: ["admin", "onboarding-attempts", "stats", windows.current],
    queryFn: () => getOnboardingStats(windows.current),
  });
  const { data: previous } = useQuery({
    queryKey: ["admin", "onboarding-attempts", "stats", windows.previous],
    queryFn: () => getOnboardingStats(windows.previous ?? {}),
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
          <Tabs
            value={period}
            onValueChange={(v) => {
              setPeriod(v as DropoffPeriod);
              setStage(null);
            }}
          >
            <TabsList className="h-9">
              {(Object.keys(PERIOD_LABELS) as DropoffPeriod[]).map((p) => (
                <TabsTrigger key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />
      <DropoffKpis
        stats={stats}
        previous={windows.previous ? previous : undefined}
      />
      <LeakCallout stats={stats} onShow={showStage} />
      <DropoffFunnel stats={stats} selected={stage} onSelect={setStage} />
      <div id="dropoff-list" className="scroll-mt-4">
        <OnboardingAttemptsTable
          stats={stats}
          stage={stage}
          onClearStage={() => setStage(null)}
          window={windows.current}
        />
      </div>
    </div>
  );
}
