import { PageListHeader } from "#/components/page-list-header";
import { FeedbackStats, FeedbackTable } from "#/features/feedback";

export default function FeedbackPage() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pt-6">
      <PageListHeader
        title="Avis utilisateurs"
        description="Notes et commentaires laissés par les travailleurs et les employeurs après une mise en relation."
      />
      <FeedbackStats />
      <FeedbackTable />
    </div>
  );
}
