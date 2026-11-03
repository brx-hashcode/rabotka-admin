import { IconArrowUpRight, IconX } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import { cn } from "#/lib/utils";
import type {
  GraphEdge,
  GraphNode,
} from "#/lib/api/collaboration-graph-controller";
import {
  GRAPH_COLORS,
  edgeKind,
  plural,
  typeColor,
  typeLabel,
} from "./graph-colors";
import { initialsOf } from "./graph-shared";

/** A profile's photo inside its type ring, like the node on the canvas. */
function NodeAvatar({
  node,
  className,
}: Readonly<{ node: GraphNode; className?: string }>) {
  return (
    <Avatar
      className={cn("size-9 ring-2 ring-offset-2 ring-offset-card", className)}
      style={{ ["--tw-ring-color" as string]: typeColor(node.type) }}
    >
      {node.avatarUrl ? <AvatarImage src={node.avatarUrl} alt={node.name} /> : null}
      <AvatarFallback
        className="text-xs font-semibold text-white"
        style={{ backgroundColor: typeColor(node.type) }}
      >
        {initialsOf(node.name)}
      </AvatarFallback>
    </Avatar>
  );
}

const KIND_STYLE = {
  mission: { color: GRAPH_COLORS.mission, word: "mission" },
  contact: { color: GRAPH_COLORS.contact, word: "paid contact" },
  application: { color: GRAPH_COLORS.application, word: "application" },
} as const;

/** « 2 missions », « 1 paid contact »… the strongest thing the link stands for. */
function EdgeChip({ edge }: Readonly<{ edge: GraphEdge }>) {
  const kind = edgeKind(edge);
  const count =
    kind === "mission"
      ? edge.collaborations
      : kind === "contact"
        ? edge.contacts
        : edge.applications;
  const { color, word } = KIND_STYLE[kind];
  return (
    <span className="text-muted-foreground inline-flex shrink-0 items-center gap-1.5 text-xs tabular-nums">
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {plural(count, word)}
    </span>
  );
}

function PersonRow({
  node,
  aside,
  onSelect,
}: Readonly<{
  node: GraphNode;
  aside: React.ReactNode;
  onSelect: (id: string) => void;
}>) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className="hover:bg-muted/60 flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors"
      >
        <NodeAvatar node={node} className="size-7 ring-offset-1" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{node.name}</span>
          <span className="text-muted-foreground block text-xs">
            {typeLabel(node.type)}
          </span>
        </span>
        {aside}
      </button>
    </li>
  );
}

function Stat({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2">
      <p className="text-lg font-semibold tabular-nums">{value.toLocaleString()}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

const PANEL = "flex h-full min-h-0 flex-col gap-4 p-5";

/** The selected profile, its figures, and who it is connected to. */
export function GraphNodePanel({
  node,
  edges,
  nodesById,
  onSelect,
  onClose,
}: Readonly<{
  node: GraphNode;
  edges: GraphEdge[];
  nodesById: Map<string, GraphNode>;
  onSelect: (id: string) => void;
  onClose: () => void;
}>) {
  const connections = edges
    .filter((e) => e.source === node.id || e.target === node.id)
    .map((e) => {
      const otherId = e.source === node.id ? e.target : e.source;
      return { other: nodesById.get(otherId), edge: e };
    })
    .filter((c): c is { other: GraphNode; edge: GraphEdge } => !!c.other)
    .sort(
      (a, b) =>
        b.edge.collaborations - a.edge.collaborations ||
        b.edge.contacts - a.edge.contacts ||
        b.edge.applications - a.edge.applications,
    );

  return (
    <Card className={PANEL}>
      <div className="flex items-start gap-3">
        <NodeAvatar node={node} className="size-12" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{node.name}</p>
          <p className="text-muted-foreground mt-0.5 inline-flex items-center gap-1.5 text-xs">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: typeColor(node.type) }}
            />
            {typeLabel(node.type)} · {plural(node.degree, "connection")}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-mr-2 -mt-1 shrink-0"
          onClick={onClose}
          aria-label="Close"
        >
          <IconX className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Missions" value={node.collaborations} />
        <Stat label="Paid contacts" value={node.contacts} />
        <Stat label="Applications" value={node.applications} />
      </div>

      <Button
        variant="outline"
        size="sm"
        render={<Link to="/profiles/$profileId" params={{ profileId: node.id }} />}
      >
        Open profile
        <IconArrowUpRight className="size-4" />
      </Button>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <p className="text-muted-foreground text-xs font-medium">
          Connections · {connections.length}
        </p>
        <ul className="-mx-2 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {connections.map(({ other, edge }) => (
            <PersonRow
              key={other.id}
              node={other}
              onSelect={onSelect}
              aside={<EdgeChip edge={edge} />}
            />
          ))}
        </ul>
      </div>
    </Card>
  );
}

/**
 * Shown while nothing is selected: the most connected profiles, so the panel
 * is a way into the graph rather than an empty box.
 */
export function GraphOverviewPanel({
  nodes,
  onSelect,
}: Readonly<{ nodes: GraphNode[]; onSelect: (id: string) => void }>) {
  const top = [...nodes]
    .sort((a, b) => b.degree - a.degree || b.collaborations - a.collaborations)
    .slice(0, 12);

  return (
    <Card className={PANEL}>
      <div>
        <p className="font-semibold">Most connected</p>
        <p className="text-muted-foreground text-xs">
          Pick a profile here or on the graph to see who it works with.
        </p>
      </div>
      {top.length === 0 ? (
        <p className="text-muted-foreground text-sm">No profiles with these filters.</p>
      ) : (
        <ul className="-mx-2 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {top.map((n) => (
            <PersonRow
              key={n.id}
              node={n}
              onSelect={onSelect}
              aside={
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {plural(n.degree, "connection")}
                </span>
              }
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
