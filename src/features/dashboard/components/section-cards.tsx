import { useQuery } from "@tanstack/react-query";
import { formatXAF } from "#/lib/utils";
import {
  getMetrics,
  type DashboardMetrics,
} from "#/lib/api/dashboard-controller";
import {
  DashboardMetricsCards,
  type DashboardMetricCard,
} from "./dashboard-metrics-cards";

function buildCards(m: DashboardMetrics): DashboardMetricCard[] {
  return [
    {
      id: "revenue",
      title: "Revenue generated",
      value: formatXAF(m.revenue),
      trend: m.revenueTrend >= 0 ? "up" : "down",
      trendPercentage: Math.abs(m.revenueTrend),
      description: "Total revenue from paid job postings and penalties.",
    },
    {
      id: "profiles",
      title: "Profiles created",
      value: m.profilesCount.toLocaleString(),
      trend: m.profilesTrend >= 0 ? "up" : "down",
      trendPercentage: Math.abs(m.profilesTrend),
      description:
        "Total number of user profiles registered on the platform.",
    },
    {
      id: "jobs",
      title: "Jobs posted",
      value: m.jobsCount.toLocaleString(),
      trend: m.jobsTrend >= 0 ? "up" : "down",
      trendPercentage: Math.abs(m.jobsTrend),
      description: "Cumulative job postings from all employers.",
    },
    {
      id: "applications",
      title: "Applications received",
      value: m.applicationsCount.toLocaleString(),
      trend: m.applicationsTrend >= 0 ? "up" : "down",
      trendPercentage: Math.abs(m.applicationsTrend),
      description: "Total job applications submitted by workers.",
    },
  ];
}

export function SectionCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard", "metrics"],
    queryFn: getMetrics,
  });

  const cards = data ? buildCards(data) : [];

  return <DashboardMetricsCards data={cards} isLoading={isLoading} />;
}
