import { useEffect, useRef } from "react";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { appConfig } from "#/config";
import {
  getAgent,
  getAgentCommissions,
  getAgentLeads,
  getAgentLogs,
  getAgentReveals,
  getAgentStats,
  getAgentZones,
  getAgentTimeseries,
  getAgentWallet,
  getAgents,
  type AgentLeadStatus,
  type AgentStatus,
  type AgentTimeseriesRange,
} from "#/lib/api/agents-controller";

export const agentsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(appConfig.defaultPaginationLimit),
  q: parseAsString.withDefault(""),
  agent_status: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  agent_country: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  // COUNTRY:City pairs.
  agent_zone: parseAsArrayOf(parseAsString).withDefault([] as string[]),
};

/**
 * The status facet is a multi-select (that is what the shared toolbar renders)
 * but the API filters on one status. Exactly one choice filters; none, or
 * several, means every status — the same reading as the profiles WhatsApp
 * facet.
 */
export function toSingleStatus(values: string[]): AgentStatus | undefined {
  return values.length === 1 ? (values[0] as AgentStatus) : undefined;
}

export const agentsQueryKey = ["admin", "agents"] as const;

export function useAgentsList() {
  const [state] = useQueryStates(agentsParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);
  const { q, agent_status, agent_country, agent_zone } = state;

  // A filter change goes back to page 1 — page 4 of a one-page result is an
  // empty table that looks like a bug.
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [q, agent_status, agent_country, agent_zone, setPage]);

  const params = {
    page: state.page,
    limit: state.limit,
    ...(q ? { q } : {}),
    ...(toSingleStatus(agent_status)
      ? { status: toSingleStatus(agent_status) }
      : {}),
    ...(agent_country.length ? { country: agent_country } : {}),
    ...(agent_zone.length ? { zone: agent_zone } : {}),
  };

  const query = useQuery({
    queryKey: [...agentsQueryKey, "list", params],
    queryFn: () => getAgents(params),
  });

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useAgentDetail(agentId: string) {
  return useQuery({
    queryKey: [...agentsQueryKey, "detail", agentId],
    queryFn: () => getAgent(agentId),
  });
}

export function useAgentLogs(agentId: string) {
  return useQuery({
    queryKey: [...agentsQueryKey, "detail", agentId, "logs"],
    queryFn: () => getAgentLogs(agentId),
  });
}

/**
 * Balance and ledger. Off for roles the server refuses (MODERATOR): asking
 * would only produce a 403 toast for a card that is hidden anyway.
 */
export function useAgentWallet(agentId: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: [...agentsQueryKey, "detail", agentId, "wallet", page],
    queryFn: () => getAgentWallet(agentId, page, 20),
    enabled,
  });
}

export function useAgentLeads(
  agentId: string,
  status: AgentLeadStatus | undefined,
  page: number,
) {
  return useQuery({
    queryKey: [...agentsQueryKey, "detail", agentId, "leads", status, page],
    queryFn: () => getAgentLeads(agentId, { status, page, limit: 20 }),
    placeholderData: keepPreviousData,
  });
}

/** Off for roles the server refuses, like the wallet it sits in. */
export function useAgentCommissions(
  agentId: string,
  page: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [...agentsQueryKey, "detail", agentId, "commissions", page],
    queryFn: () => getAgentCommissions(agentId, { page, limit: 10 }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAgentReveals(agentId: string, page: number) {
  return useQuery({
    queryKey: [...agentsQueryKey, "detail", agentId, "reveals", page],
    queryFn: () => getAgentReveals(agentId, page, 20),
    placeholderData: keepPreviousData,
  });
}

export function useAgentStats() {
  return useQuery({
    queryKey: [...agentsQueryKey, "stats"],
    queryFn: getAgentStats,
  });
}

export function useAgentTimeseries(days: AgentTimeseriesRange) {
  return useQuery({
    queryKey: [...agentsQueryKey, "stats", "timeseries", days],
    queryFn: () => getAgentTimeseries(days),
    // Switching range keeps the previous bars until the new ones land,
    // instead of collapsing the chart to a skeleton and back.
    placeholderData: (previous) => previous,
  });
}

/** Cities agents cover, for the list's Country and City filters. */
export function useAgentZones() {
  return useQuery({
    queryKey: [...agentsQueryKey, "zones"],
    queryFn: getAgentZones,
  });
}
