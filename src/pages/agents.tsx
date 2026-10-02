import { useEffect, useMemo, useState } from "react";
import { useQueryStates } from "nuqs";
import type { Table as TableInstance } from "@tanstack/react-table";
import { IconPlus } from "@tabler/icons-react";

import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import { Button } from "#/components/ui/button";
import {
  agentStatusOptions,
  zoneFilterOptions,
} from "#/features/agents/agent-rules";
import { agentColumns } from "#/features/agents/components/agent-columns";
import { AgentMetricsChart } from "#/features/agents/components/agent-metrics-chart";
import { AgentStatsCards } from "#/features/agents/components/agent-stats-cards";
import { CreateAgentDialog } from "#/features/agents/components/create-agent-dialog";
import {
  agentsParsers,
  useAgentsList,
  useAgentZones,
} from "#/hooks/use-agents";
import { useCountries } from "#/hooks/use-geo";
import { useRole } from "#/hooks/use-role";
import type { AdminAgentListItem } from "#/lib/api/agents-controller";

function AgentsTableHeader({
  table,
}: Readonly<{ table: TableInstance<AdminAgentListItem> }>) {
  const zones = useAgentZones();
  const countries = useCountries();
  const [{ agent_country, agent_zone }, setFilters] = useQueryStates({
    agent_country: agentsParsers.agent_country,
    agent_zone: agentsParsers.agent_zone,
  });

  const { countries: countryOptions, cities: cityOptions } = useMemo(() => {
    const names = new Map(
      (countries.data ?? []).map((c) => [c.code, c.name] as const),
    );
    return zoneFilterOptions(
      zones.data ?? [],
      (code) => names.get(code) ?? code,
      agent_country,
    );
  }, [zones.data, countries.data, agent_country]);

  // A city whose country was just deselected would keep filtering while
  // hidden from the City menu. Drop it instead.
  useEffect(() => {
    if (agent_country.length === 0 || agent_zone.length === 0) return;
    const kept = agent_zone.filter((z) =>
      agent_country.includes(z.split(":")[0] ?? ""),
    );
    if (kept.length !== agent_zone.length) {
      void setFilters({ agent_zone: kept });
    }
  }, [agent_country, agent_zone, setFilters]);

  return (
    <TableHeader>
      <TableHeaderToolbar
        searchParamKey="q"
        searchPlaceholder="Search by name, email or phone..."
        filters={[
          { id: "agent_status", label: "Status", options: agentStatusOptions },
          { id: "agent_country", label: "Country", options: countryOptions },
          { id: "agent_zone", label: "City", options: cityOptions },
        ]}
        table={table}
      />
    </TableHeader>
  );
}

const renderAgentsHeader = (table: TableInstance<AdminAgentListItem>) => (
  <AgentsTableHeader table={table} />
);

export default function AgentsPage() {
  const { data, total, isLoading } = useAgentsList();
  const { canManageContent } = useRole();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageListHeader
        className="mb-0"
        title="Agents"
        description="Field agents who call workers and get them onto jobs in their zones. Created here only — agents cannot sign up."
        actions={
          canManageContent ? (
            <Button onClick={() => setCreateOpen(true)}>
              <IconPlus className="size-4" />
              New agent
            </Button>
          ) : null
        }
      />
      <AgentStatsCards />
      <AgentMetricsChart />
      <DataTable
        isPaginated
        enableRowSelection
        data={data}
        columns={agentColumns}
        header={renderAgentsHeader}
        totalCount={total}
        isLoading={isLoading}
        getRowId={(row) => row.id}
      />
      <CreateAgentDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
