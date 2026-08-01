import { useMemo, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import { parseAsBoolean, parseAsInteger, parseAsString, useQueryState } from "nuqs";

import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { Skeleton } from "#/components/ui/skeleton";
import { useCollaborationGraph } from "#/hooks/use-collaboration-graph";
import {
  CollaborationGraphCanvas,
  GraphLegend,
  GraphNodePanel,
} from "#/features/graph";
import type { GraphNode } from "#/lib/api/collaboration-graph-controller";

export default function CollaborationGraphPage() {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [minCollaborations, setMinCollaborations] = useQueryState(
    "min",
    parseAsInteger.withDefault(0),
  );
  const [includeApplications, setIncludeApplications] = useQueryState(
    "applications",
    parseAsBoolean.withDefault(true),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useCollaborationGraph({
    minCollaborations,
    includeApplications,
  });

  const nodesById = useMemo(
    () => new Map((data?.nodes ?? []).map((n) => [n.id, n])),
    [data?.nodes],
  );
  const selected = selectedId ? nodesById.get(selectedId) : undefined;

  // Names matching the search, so the user can jump straight to a profile
  // instead of hunting for a highlighted dot.
  const searchHits = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return (data?.nodes ?? [])
      .filter((n) => n.name.toLowerCase().includes(q))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 8);
  }, [data?.nodes, search]);

  return (
    <div className="flex flex-col gap-4 pt-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-56 flex-1">
          <Label htmlFor="graph-search" className="text-xs">
            Rechercher un profil
          </Label>
          <div className="relative mt-1">
            <IconSearch className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
            <Input
              id="graph-search"
              value={search}
              onChange={(e) => setSearch(e.target.value || null)}
              placeholder="Nom du recruteur ou du travailleur..."
              className="pl-8"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="graph-min" className="text-xs">
            Missions minimum
          </Label>
          <Input
            id="graph-min"
            type="number"
            min={0}
            value={minCollaborations}
            onChange={(e) =>
              setMinCollaborations(Number(e.target.value) || null)
            }
            className="mt-1 w-32"
          />
        </div>

        <div className="flex items-center gap-2 pb-2">
          <Switch
            id="graph-applications"
            checked={includeApplications}
            onCheckedChange={(v) => setIncludeApplications(v ? null : false)}
          />
          <Label htmlFor="graph-applications" className="text-xs">
            Afficher les candidatures sans suite
          </Label>
        </div>
      </div>

      {searchHits.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {searchHits.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setSelectedId(n.id)}
              className="bg-card shadow-soft rounded-md px-2.5 py-1 text-xs hover:bg-muted"
            >
              {n.name}
              <span className="text-muted-foreground ml-1.5">{n.degree}</span>
            </button>
          ))}
        </div>
      )}

      <GraphLegend />

      {data && (
        <p className="text-muted-foreground text-xs">
          {data.stats.profiles} profils · {data.stats.edges} liens ·{" "}
          {data.stats.collaborations} missions ·{" "}
          {data.stats.applications} candidatures sans suite
          {data.stats.truncated && " · vue tronquée aux liens les plus forts"}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="bg-card shadow-soft h-[calc(100vh-22rem)] min-h-96 overflow-hidden rounded-lg">
          {isLoading && <Skeleton className="h-full w-full" />}
          {isError && (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              Impossible de charger le réseau.
            </div>
          )}
          {data && data.nodes.length === 0 && (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              Aucune connexion à afficher avec ces filtres.
            </div>
          )}
          {data && data.nodes.length > 0 && (
            <CollaborationGraphCanvas
              nodes={data.nodes}
              edges={data.edges}
              search={search}
              selectedId={selectedId}
              onSelect={(n: GraphNode | null) => setSelectedId(n?.id ?? null)}
              onRefresh={() => void refetch()}
            />
          )}
        </div>

        <div className="h-[calc(100vh-22rem)] min-h-96">
          {selected && data ? (
            <GraphNodePanel
              node={selected}
              edges={data.edges}
              nodesById={nodesById}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <div className="bg-card shadow-soft text-muted-foreground flex h-full items-center justify-center rounded-lg p-6 text-center text-sm">
              Sélectionnez un profil dans le réseau pour voir ses connexions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
