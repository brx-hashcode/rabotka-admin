import { ChartAreaInteractive, SectionCards } from "#/features/dashboard";
import { RecentActivitiesContent } from "#/features/dashboard/components";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <ChartAreaInteractive />
      <RecentActivitiesContent />
    </div>
  );
}
