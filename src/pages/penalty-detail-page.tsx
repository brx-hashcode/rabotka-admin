import { usePenaltyDetail } from "#/hooks/use-penalty-detail";

import { Skeleton } from "#/components/ui/skeleton";

import { PenaltyInfo } from "./penalty-detail/components/penalty-info";
import { PenaltySummary } from "./penalty-detail/components/penalty-summary";

export default function PenaltyDetailPage({
  penaltyId,
}: Readonly<{
  penaltyId: string;
}>) {
  const { penalty, isLoading, isError } = usePenaltyDetail(penaltyId);

  if (isLoading) {
    return (
      <div className="space-y-8 pt-2">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={`skeleton-${i + 1}`}
                  className="h-20 rounded-lg"
                />
              ))}
            </div>
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !penalty) {
    return (
      <div className="flex h-64 items-center justify-center pt-4">
        <p className="text-muted-foreground">
          Failed to load penalty. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <PenaltyInfo penalty={penalty} />
        </div>
        <div className="min-w-0">
          <PenaltySummary penalty={penalty} />
        </div>
      </div>
    </div>
  );
}
