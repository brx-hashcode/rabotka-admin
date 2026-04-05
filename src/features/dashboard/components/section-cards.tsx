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
      id: "assignments",
      title: "Assignments made",
      value: m.assignmentsCount.toLocaleString(),
      trend: m.assignmentsTrend != null ? (m.assignmentsTrend >= 0 ? "up" : "down") : null,
      trendPercentage: m.assignmentsTrend != null ? Math.abs(m.assignmentsTrend) : null,
      description: "Total employer-worker placements confirmed on the platform.",
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
