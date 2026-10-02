import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link, useNavigate } from "@tanstack/react-router";
import { EyeIcon, MoreHorizontal } from "lucide-react";

import {
  getCommonColumns,
  ProfileCell,
  type ColumnsActionsProps,
} from "#/components/table";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { useRole } from "#/hooks/use-role";
import type {
  AdminAgentListItem,
  AgentStatusAction,
} from "#/lib/api/agents-controller";
import {
  AGENT_STATUS_LABELS,
  STATUS_ACTIONS,
  availableStatusActions,
  formatZones,
  getAgentStatusBadgeClass,
} from "../agent-rules";
import { STATUS_ACTION_ICONS } from "./agent-actions-menu";
import { AgentStatusDialog } from "./agent-status-dialog";

function formatDateTime(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function AgentRowActions({ row: agent }: ColumnsActionsProps<AdminAgentListItem>) {
  const navigate = useNavigate();
  const { canManageContent } = useRole();
  const [action, setAction] = useState<AgentStatusAction | null>(null);
  const actions = canManageContent ? availableStatusActions(agent.status) : [];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Agent actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              void navigate({
                to: "/agents/$agentId",
                params: { agentId: agent.id },
              })
            }
          >
            <EyeIcon className="size-4" />
            View
          </DropdownMenuItem>
          {actions.length > 0 && <DropdownMenuSeparator />}
          {actions.map((a) => {
            const Icon = STATUS_ACTION_ICONS[a];
            return (
              <DropdownMenuItem
                key={a}
                variant={
                  STATUS_ACTIONS[a].destructive ? "destructive" : "default"
                }
                onClick={() => setAction(a)}
              >
                <Icon className="size-4" />
                {STATUS_ACTIONS[a].label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <AgentStatusDialog
        agent={agent}
        action={action}
        onClose={() => setAction(null)}
      />
    </>
  );
}

const agentDataColumns: ColumnDef<AdminAgentListItem>[] = [
  {
    id: "agent",
    accessorKey: "firstName",
    header: "Agent",
    cell: ({ row }) => {
      const a = row.original;
      return (
        <Link
          to="/agents/$agentId"
          params={{ agentId: a.id }}
          className="block hover:opacity-80"
        >
          <ProfileCell
            name={`${a.firstName} ${a.lastName}`}
            email={a.email}
            avatarUrl={a.avatarUrl}
          />
        </Link>
      );
    },
  },
  {
    id: "phone",
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">{row.original.phone}</span>
    ),
  },
  {
    id: "zones",
    header: "Zones",
    cell: ({ row }) => {
      const zones = row.original.zones;
      let text = formatZones(zones.slice(0, 2)) || "—";
      if (zones.length > 2) text += ` +${zones.length - 2}`;
      return (
        <span className="text-sm" title={formatZones(zones)}>
          {text}
        </span>
      );
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={getAgentStatusBadgeClass(row.original.status)}>
        {AGENT_STATUS_LABELS[row.original.status]}
      </Badge>
    ),
  },
  {
    id: "lastLoginAt",
    accessorKey: "lastLoginAt",
    header: "Last sign-in",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {formatDateTime(row.original.lastLoginAt)}
      </span>
    ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
];

/**
 * Selection checkbox and row actions come from the shared helper, as on every
 * other admin table.
 */
export const agentColumns = getCommonColumns<AdminAgentListItem>({
  additionalColumns: agentDataColumns,
  columnsActions: AgentRowActions,
});
