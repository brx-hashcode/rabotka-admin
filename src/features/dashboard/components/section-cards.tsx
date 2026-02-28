import { formatXAF } from "#/lib/utils";
import {
  DashboardMetricsCards,
  type DashboardMetricCard,
} from "./dashboard-metrics-cards";

const DASHBOARD_METRICS_DATA: DashboardMetricCard[] = [
  {
    id: "revenue",
    title: "Total Revenue",
    value: formatXAF(2_348_000),
    trend: "up",
    trendPercentage: 9.2,
    descriptionLine1: "Revenue increasing steadily",
    descriptionLine2: "Driven by paid job postings",
  },
  {
    id: "profiles",
    title: "Total Profiles",
    value: "2,146",
    trend: "up",
    trendPercentage: 6.4,
    descriptionLine1: "New users joining weekly",
    descriptionLine2: "Organic and referral growth",
  },
  {
    id: "jobs",
    title: "Active Jobs",
    value: "312",
    trend: "up",
    trendPercentage: 11.8,
    descriptionLine1: "More employers posting jobs",
    descriptionLine2: "Higher activity than last month",
  },
  {
    id: "applications",
    title: "Total Applications",
    value: "1,987",
    trend: "up",
    trendPercentage: 7.1,
    descriptionLine1: "Healthy candidate engagement",
    descriptionLine2: "Average 6.3 applications per job",
  },
];

export function SectionCards() {
  return (
    <DashboardMetricsCards data={DASHBOARD_METRICS_DATA} isLoading={false} />
  );
}
