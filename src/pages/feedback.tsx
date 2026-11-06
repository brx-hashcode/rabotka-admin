import { PageListHeader } from "#/components/page-list-header";
import { FeedbackStats, FeedbackTable } from "#/features/feedback";

export default function FeedbackPage() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pt-6">
      <PageListHeader
        title="User feedback"
        description="Ratings and comments left by workers and employers after a match."
      />
      <FeedbackStats />
      <FeedbackTable />
    </div>
  );
}
