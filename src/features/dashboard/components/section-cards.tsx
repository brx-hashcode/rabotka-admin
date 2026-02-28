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
    descriptionLine1: "Total revenue accumulated",
    descriptionLine2: "Income from paid job postings and penalties",
  },
  {
    id: "profiles",
    title: "Profiles created",
    value: "2,146",
    trend: "up",
    trendPercentage: 6.4,
    descriptionLine1: "Total number of user profiles ever registered",
    descriptionLine2: "Includes all users, whether created organically",
  },
  {
    id: "jobs",
    title: "Jobs posted",
    value: "312",
    trend: "up",
    trendPercentage: 11.8,
    descriptionLine1: "Cumulative number of jobs posted",
    descriptionLine2: "All job postings from all employers to date",
  },
  {
    id: "applications",
    title: "Applications received",
    value: "1,987",
    trend: "up",
    trendPercentage: 7.1,
    descriptionLine1: "Total number of job applications received",
    descriptionLine2: "Sum of all job applications submitted by workers",
  },
];

export function SectionCards() {
  return (
    <DashboardMetricsCards data={DASHBOARD_METRICS_DATA} isLoading={false} />
  );
}
