import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageListHeader } from "#/components/page-list-header";
import {
  DropoffSteps,
  DropoffSummary,
  OnboardingAttemptsTable,
} from "#/features/onboarding-attempts";
import {
  getOnboardingStats,
  type OnboardingStage,
} from "#/lib/api/onboarding-attempts-controller";

export default function OnboardingDropoffsPage() {
  // The step picked in the cards filters the list under them.
  const [stage, setStage] = useState<OnboardingStage | null>(null);
  const { data: stats } = useQuery({
    queryKey: ["admin", "onboarding-attempts", "stats"],
    queryFn: () => getOnboardingStats(),
  });

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pt-6">
      <PageListHeader
        className="mb-2"
        title="Inscriptions inachevées"
        description="Qui a commencé son inscription sans la terminer, et à quelle étape — pour les rappeler et comprendre pourquoi."
      />
      <DropoffSummary stats={stats} />
      <DropoffSteps stats={stats} selected={stage} onSelect={setStage} />
      <OnboardingAttemptsTable
        stats={stats}
        stage={stage}
        onClearStage={() => setStage(null)}
      />
    </div>
  );
}
