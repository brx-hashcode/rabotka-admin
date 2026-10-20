import { PageListHeader } from "#/components/page-list-header";
import {
  OnboardingAttemptsTable,
  OnboardingFunnel,
} from "#/features/onboarding-attempts";

export default function OnboardingDropoffsPage() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pt-6">
      <PageListHeader
        title="Inscriptions inachevées"
        description="Les personnes qui ont commencé leur inscription sans la terminer, et l'étape où elles se sont arrêtées — pour les contacter et comprendre pourquoi."
      />
      <OnboardingFunnel />
      <OnboardingAttemptsTable />
    </div>
  );
}
