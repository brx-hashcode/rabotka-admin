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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold uppercase">Job activity</h2>
          <ChartAreaFilter />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8 xl:col-span-9">
            <ChartAreaInteractive />
          </div>
          <div className="lg:col-span-4 xl:col-span-3">
            <ChartJobStatusPie />
          </div>
        </div>
      </div>

      <RecentActivitiesContent />
    </div>
  );
}
