import { lazy, Suspense, useMemo, useState } from "react";
import {
  IconBriefcase,
  IconCoin,
  IconSearch,
  IconSend,
  IconUsers,
} from "@tabler/icons-react";
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { Skeleton } from "#/components/ui/skeleton";
import { useCollaborationGraph } from "#/hooks/use-collaboration-graph";
import {
  CollaborationGraphCanvas,
  GraphLegend,
  GraphNodePanel,
  GraphOverviewPanel,
} from "#/features/graph";
import { plural, typeColor } from "#/features/graph/components/graph-colors";
import type {
  CollaborationGraph,
  GraphNode,
} from "#/lib/api/collaboration-graph-controller";

/** Tall enough to read the graph, short enough to keep the toolbar in view. */
const STAGE = "h-[calc(100vh-26rem)] min-h-[28rem]";

/** three.js is heavy: fetched only the first time someone switches to 3D. */
const CollaborationGraph3D = lazy(
  () => import("#/features/graph/components/collaboration-graph-3d"),
);

const VIEWS = ["2d", "3d"] as const;

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
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(VIEWS).withDefault("2d"),
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
      <StatTiles data={data} isLoading={isLoading} />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-56 flex-1">
              <IconSearch className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
              <Input
                aria-label="Search a profile"
                value={search}
                onChange={(e) => setSearch(e.target.value || null)}
                placeholder="Search a recruiter or a worker…"
                className="pl-8"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="graph-min" className="text-muted-foreground text-sm font-normal">
                Min. missions
              </Label>
              <Input
                id="graph-min"
                type="number"
                min={0}
                value={minCollaborations}
                onChange={(e) => setMinCollaborations(Number(e.target.value) || null)}
                className="w-20"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="graph-applications"
                checked={includeApplications}
                onCheckedChange={(v) => setIncludeApplications(v ? null : false)}
              />
              <Label htmlFor="graph-applications" className="text-sm font-normal">
                Unanswered applications
              </Label>
            </div>
          </div>

          {searchHits.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {searchHits.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSelectedId(n.id)}
                  className={
                    n.id === selectedId
                      ? "bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
                      : "bg-muted hover:bg-muted/70 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors"
                  }
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: typeColor(n.type) }}
                  />
                  {n.name}
                  <span className="opacity-60 tabular-nums">{n.degree}</span>
                </button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          <CardHeader className="gap-3 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="space-y-1">
                <CardTitle className="text-base">Network</CardTitle>
                <CardDescription className="text-xs">
                  {view === "3d"
                    ? "Size = number of connections · drag to orbit · scroll to zoom · right-drag to pan"
                    : "Size = number of connections · drag to move · ⌘/Ctrl + scroll to zoom"}
                </CardDescription>
              </div>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={view}
                onValueChange={(v) => {
                  if (v) void setView(v === "2d" ? null : (v as "3d"));
                }}
                aria-label="Graph view"
              >
                <ToggleGroupItem value="2d" className="px-3 text-xs">
                  2D
                </ToggleGroupItem>
                <ToggleGroupItem value="3d" className="px-3 text-xs">
                  3D
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <GraphLegend />
            {data?.stats.truncated ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Large network: only the strongest links are drawn.
              </p>
            ) : null}
          </CardHeader>
          <div className={`bg-muted/20 border-t ${STAGE}`}>
            {isLoading ? <Skeleton className="h-full w-full rounded-none" /> : null}
            {isError ? (
              <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                The network couldn't be loaded.
              </div>
            ) : null}
            {data && data.nodes.length === 0 ? (
              <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                No connections with these filters.
              </div>
            ) : null}
            {data && data.nodes.length > 0 && view === "2d" ? (
              <CollaborationGraphCanvas
                nodes={data.nodes}
                edges={data.edges}
                search={search}
                selectedId={selectedId}
                onSelect={(n: GraphNode | null) => setSelectedId(n?.id ?? null)}
                onRefresh={() => void refetch()}
              />
            ) : null}
            {data && data.nodes.length > 0 && view === "3d" ? (
              <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
                <CollaborationGraph3D
                  nodes={data.nodes}
                  edges={data.edges}
                  search={search}
                  selectedId={selectedId}
                  onSelect={(n: GraphNode | null) => setSelectedId(n?.id ?? null)}
                  onRefresh={() => void refetch()}
                />
              </Suspense>
            ) : null}
          </div>
        </Card>

        {/* Pinned to the graph card's height; its list scrolls inside. */}
        <div className="relative h-[32rem] lg:h-auto">
          <div className="absolute inset-0">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-2xl" />
          ) : selected && data ? (
            <GraphNodePanel
              node={selected}
              edges={data.edges}
              nodesById={nodesById}
              onSelect={setSelectedId}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <GraphOverviewPanel nodes={data?.nodes ?? []} onSelect={setSelectedId} />
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTiles({
  data,
  isLoading,
}: Readonly<{ data: CollaborationGraph | undefined; isLoading: boolean }>) {
  const recruiters = data?.nodes.filter((n) => n.type === "EMPLOYER").length ?? 0;
  const workers = (data?.nodes.length ?? 0) - recruiters;
  const s = data?.stats;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        label="Profiles"
        icon={IconUsers}
        isLoading={isLoading}
        value={s?.profiles}
        note={`${plural(recruiters, "recruiter")} · ${plural(workers, "worker")}`}
      />
      <Tile
        label="Missions"
        icon={IconBriefcase}
        isLoading={isLoading}
        value={s?.collaborations}
        note={`Worked together, across ${plural(s?.edges ?? 0, "link")}`}
      />
      <Tile
        label="Paid contacts"
        icon={IconCoin}
        isLoading={isLoading}
        value={s?.contacts}
        note="A recruiter paid to reach a worker"
      />
      <Tile
        label="Unanswered applications"
        icon={IconSend}
        isLoading={isLoading}
        value={s?.applications}
        note="Applied, never became a mission"
      />
    </div>
  );
}

function Tile({
  label,
  icon: Icon,
  value,
  note,
  isLoading,
}: Readonly<{
  label: string;
  icon: React.ElementType;
  value: number | undefined;
  note: string;
  isLoading: boolean;
}>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
        <Icon className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold tabular-nums">{(value ?? 0).toLocaleString()}</p>
            <p className="text-muted-foreground text-xs">{note}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
