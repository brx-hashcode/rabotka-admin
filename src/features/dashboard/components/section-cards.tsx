import { useQuery } from "@tanstack/react-query";
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
      // Leads the row because it is the first thing that actually moves: a
      // platform has paid connections long before it has confirmed placements,
      // so "Assignments made" sat at 0 while the Network graph already showed
      // relationships. Same source as that graph, deliberately.
      id: "connections",
      title: "Connections made",
      value: m.connectionsCount.toLocaleString(),
      trend: m.connectionsTrend != null ? (m.connectionsTrend >= 0 ? "up" : "down") : null,
      trendPercentage: m.connectionsTrend != null ? Math.abs(m.connectionsTrend) : null,
      description: "Employer-worker contacts paid for and unlocked.",
    },
    {
      id: "profiles",
      title: "Profiles created",
      value: m.profilesCount.toLocaleString(),
      trend: m.profilesTrend != null ? (m.profilesTrend >= 0 ? "up" : "down") : null,
      trendPercentage: m.profilesTrend != null ? Math.abs(m.profilesTrend) : null,
      description: "Total number of user profiles registered on the platform.",
    },
    {
      id: "jobs",
      title: "Jobs posted",
      value: m.jobsCount.toLocaleString(),
      trend: m.jobsTrend != null ? (m.jobsTrend >= 0 ? "up" : "down") : null,
      trendPercentage: m.jobsTrend != null ? Math.abs(m.jobsTrend) : null,
      description: "Cumulative job postings from all employers.",
    },
    {
      id: "applications",
      title: "Applications received",
      value: m.applicationsCount.toLocaleString(),
      trend: m.applicationsTrend != null ? (m.applicationsTrend >= 0 ? "up" : "down") : null,
      trendPercentage: m.applicationsTrend != null ? Math.abs(m.applicationsTrend) : null,
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
