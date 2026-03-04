import { formatXAF } from "#/lib/utils";
import {
  DashboardMetricsCards,
  type DashboardMetricCard,
} from "./dashboard-metrics-cards";

const DASHBOARD_METRICS_DATA: DashboardMetricCard[] = [
  {
    id: "revenue",
    title: "Revenue generated",
    value: formatXAF(2_348_000),
    trend: "up",
    trendPercentage: 9.2,
    description: "Total revenue from paid job postings and penalties.",
  },
  {
    id: "profiles",
    title: "Profiles created",
    value: "2,146",
    trend: "up",
    trendPercentage: 6.4,
    description: "Total number of user profiles registered on the platform.",
  },
  {
    id: "jobs",
    title: "Jobs posted",
    value: "312",
    trend: "up",
    trendPercentage: 11.8,
    description: "Cumulative job postings from all employers.",
  },
  {
    id: "applications",
    title: "Applications received",
    value: "1,987",
    trend: "up",
    trendPercentage: 7.1,
    description: "Total job applications submitted by workers.",
  },
];

export function SectionCards() {
  return (
    <DashboardMetricsCards data={DASHBOARD_METRICS_DATA} isLoading={false} />
  );
}
