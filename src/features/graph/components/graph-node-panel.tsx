import { IconExternalLink, IconX } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

import { Button } from "#/components/ui/button";
import type {
  GraphEdge,
  GraphNode,
} from "#/lib/api/collaboration-graph-controller";

type Props = Readonly<{
  node: GraphNode;
  edges: GraphEdge[];
  nodesById: Map<string, GraphNode>;
  onClose: () => void;
}>;

/** Details for the selected profile, plus who it is actually connected to. */
/** Shortest honest label for a link: mission > paid contact > application. */
function describeEdge(edge: {
  collaborations: number;
  applications: number;
  contacts: number;
}): string {
  if (edge.collaborations > 0) {
    return `${edge.collaborations} mission${edge.collaborations === 1 ? "" : "s"}`;
  }
  if (edge.contacts > 0) {
    return `${edge.contacts} contact${edge.contacts === 1 ? "" : "s"}`;
  }
  return `${edge.applications} application${edge.applications === 1 ? "" : "s"}`;
}

export function GraphNodePanel({ node, edges, nodesById, onClose }: Props) {
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
        b.edge.applications - a.edge.applications,
    );

  return (
    <div className="bg-card shadow-soft flex h-full flex-col gap-3 rounded-lg p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{node.name}</p>
          <p className="text-muted-foreground text-xs">
            {node.type === "EMPLOYER" ? "Recruteur" : "Travailleur"}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={onClose}
          aria-label="Fermer"
        >
          <IconX className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="Connexions" value={node.degree} />
        <Stat label="Missions" value={node.collaborations} />
        <Stat label="Candidatures" value={node.applications} />
        <Stat label="Contacts" value={node.contacts} />
      </div>

      <Link
        to="/profiles/$profileId"
        params={{ profileId: node.id }}
        className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
      >
        Ouvrir le profil
        <IconExternalLink className="size-3.5" />
      </Link>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
          Connexions ({connections.length})
        </p>
        <ul className="space-y-1.5">
          {connections.map(({ other, edge }) => (
            <li
              key={other.id}
              className="bg-muted/40 flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs"
            >
              <span className="truncate">{other.name}</span>
              <span className="text-muted-foreground shrink-0">
                {describeEdge(edge)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="bg-muted/40 rounded-md px-2 py-1.5">
      <p className="text-base font-semibold">{value}</p>
      <p className="text-muted-foreground text-[11px]">{label}</p>
    </div>
  );
}
