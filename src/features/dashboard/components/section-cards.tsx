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
      period: m.last30Days?.connections,
      description: "Employer-worker contacts paid for and unlocked, all time.",
    },
    {
      id: "profiles",
      title: "Profiles created",
      value: m.profilesCount.toLocaleString(),
      period: m.last30Days?.profiles,
      description: "User profiles registered on the platform, all time.",
    },
    {
      id: "jobs",
      title: "Jobs posted",
      value: m.jobsCount.toLocaleString(),
      period: m.last30Days?.jobs,
      description: "Job postings from all employers, all time.",
    },
    {
      id: "applications",
      title: "Applications received",
      value: m.applicationsCount.toLocaleString(),
      period: m.last30Days?.applications,
      description: "Job applications submitted by workers, all time.",
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
