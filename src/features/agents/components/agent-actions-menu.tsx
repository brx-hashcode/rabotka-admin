import { useState } from "react";
import {
  IconBan,
  IconChevronDown,
  IconPlayerPause,
  IconPlayerPlay,
} from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type {
  AdminAgentDetail,
  AgentStatusAction,
} from "#/lib/api/agents-controller";
import { STATUS_ACTIONS, availableStatusActions } from "../agent-rules";
import { AgentStatusDialog } from "./agent-status-dialog";

/** One icon per status action, shared by the page and row menus. */
export const STATUS_ACTION_ICONS: Record<AgentStatusAction, typeof IconBan> = {
  reactivate: IconPlayerPlay,
  suspend: IconPlayerPause,
  revoke: IconBan,
};

/**
 * The "Actions" button of the agent page, as on the profile page. Every action
 * is listed and the ones that do not apply are disabled, so the menu does not
 * change shape from one agent to the next.
 */
export function AgentActionsMenu({
  agent,
}: Readonly<{ agent: AdminAgentDetail }>) {
  const [action, setAction] = useState<AgentStatusAction | null>(null);
  const allowed = new Set(availableStatusActions(agent.status));

  const item = (a: AgentStatusAction) => {
    const Icon = STATUS_ACTION_ICONS[a];
    return (
      <DropdownMenuItem
        key={a}
        disabled={!allowed.has(a)}
        variant={STATUS_ACTIONS[a].destructive ? "destructive" : "default"}
        onClick={() => allowed.has(a) && setAction(a)}
      >
        <Icon className="size-4" />
        {STATUS_ACTIONS[a].label}
      </DropdownMenuItem>
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">
            Actions
            <IconChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {item("reactivate")}
          {item("suspend")}
          <DropdownMenuSeparator />
          {item("revoke")}
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
