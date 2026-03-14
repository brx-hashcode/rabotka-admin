import {
  ChartAreaInteractive,
  ChartJobStatusPie,
  ChartAreaFilter,
  SectionCards,
} from "#/features/dashboard";
import { RecentActivitiesContent } from "#/features/dashboard/components";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold uppercase">Job activity</h2>
          <ChartAreaFilter />
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-9">
            <ChartAreaInteractive />
          </div>
          <div className="col-span-3">
            <ChartJobStatusPie />
          </div>
        </div>
      </div>

      <RecentActivitiesContent />
    </div>
  );
}
