import { useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { useAgentZones } from "#/hooks/use-agents";
import {
  CONGO_DEPARTMENTS,
  CONGO_MAP_ATTRIBUTION,
  CONGO_VIEWBOX,
} from "../congo-map-data";
import { congoCoverage } from "../coverage";

/**
 * Agents are this page's violet (same steps as the metrics chart, validated
 * per surface), switched by the app's `.dark` class. Departments are shaded
 * by opacity of that one hue — a sequential scale: more agents, more ink.
 * Uncovered stays the muted surface.
 */
const AGENT_FILL = "fill-[#9810fa] dark:fill-[#ad46ff]";
const AGENT_BG = "bg-[#9810fa] dark:bg-[#ad46ff]";

const STEPS: { label: string; min: number; opacity: number }[] = [
  { label: "1", min: 1, opacity: 0.3 },
  { label: "2", min: 2, opacity: 0.5 },
  { label: "3–4", min: 3, opacity: 0.72 },
  { label: "5+", min: 5, opacity: 0.95 },
];

function opacityFor(agents: number): number {
  let o = 0;
  for (const s of STEPS) if (agents >= s.min) o = s.opacity;
  return o;
}

/** The flag of the Republic of the Congo, for the card's title. */
function CongoFlag({ className }: Readonly<{ className?: string }>) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden>
      <path d="M0 0h30v20H0z" fill="#dc241f" />
      <path d="M0 0h20L0 20z" fill="#009543" />
      <path d="M20 0h10L10 20H0z" fill="#fbde4a" />
    </svg>
  );
}

/**
 * Where agents work: Congo's departments shaded by how many agents cover
 * them, with a dot for each covered city.
 */
export function AgentCoverageMap() {
  const { data: zones, isLoading } = useAgentZones();
  const coverage = useMemo(() => congoCoverage(zones ?? []), [zones]);
  const [hovered, setHovered] = useState<string | null>(null);

  const covered = coverage.departments
    .filter((d) => d.agents > 0)
    .sort((a, b) => b.agents - a.agents);
  const hoveredDep = coverage.departments.find((d) => d.name === hovered);

  return (
    <Card className="h-full gap-0 overflow-hidden py-0">
      <div className="flex items-start gap-3 px-6 pt-5">
        <CongoFlag className="mt-1 h-5 w-[30px] shrink-0 rounded-[2px] shadow-soft" />
        <div className="min-w-0 flex-1 space-y-1">
          <CardTitle>Coverage in Congo</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading…"
              : `${coverage.agents} agent${coverage.agents === 1 ? "" : "s"} · ${covered.length} of ${CONGO_DEPARTMENTS.length} departments covered`}
          </CardDescription>
        </div>
      </div>

      <CardContent className="space-y-4 px-4 pt-3 pb-4 sm:px-6">
        {isLoading ? (
          <Skeleton className="aspect-[4/5] w-full rounded-lg" />
        ) : (
          <div className="relative">
            <svg
              viewBox={`-6 -6 ${CONGO_VIEWBOX.width + 12} ${CONGO_VIEWBOX.height + 12}`}
              className="mx-auto block max-h-[340px] w-full"
              role="img"
              aria-label={`Map of Congo: ${covered.map((d) => `${d.name} ${d.agents}`).join(", ") || "no department covered"}`}
            >
              {CONGO_DEPARTMENTS.map((d) => {
                const dep = coverage.departments.find((x) => x.name === d.name);
                const agents = dep?.agents ?? 0;
                const isHovered = hovered === d.name;
                return (
                  <g
                    key={d.name}
                    onMouseEnter={() => setHovered(d.name)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {/* The muted base, so an uncovered department still reads. */}
                    <path d={d.path} fill="var(--muted)" />
                    {agents > 0 && (
                      <path
                        d={d.path}
                        className={AGENT_FILL}
                        fillOpacity={opacityFor(agents)}
                      />
                    )}
                    <path
                      d={d.path}
                      fill="transparent"
                      stroke={isHovered ? "var(--foreground)" : "var(--card)"}
                      strokeWidth={isHovered ? 1.6 : 1.2}
                      strokeLinejoin="round"
                    >
                      <title>
                        {`${d.name} — ${agents} agent${agents === 1 ? "" : "s"}`}
                      </title>
                    </path>
                  </g>
                );
              })}

              {coverage.cities.map((c) => (
                <g
                  key={c.name}
                  onMouseEnter={() => setHovered(c.department)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={4.5}
                    className={AGENT_FILL}
                    stroke="var(--card)"
                    strokeWidth={1.5}
                  />
                  <text
                    x={c.x + 7}
                    y={c.y + 3.5}
                    fontSize={11}
                    fontWeight={600}
                    fill="var(--foreground)"
                    stroke="var(--card)"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    {`${c.name} · ${c.agents}`}
                  </text>
                </g>
              ))}
            </svg>

            <p className="text-muted-foreground mt-1 h-4 text-center text-xs">
              {hoveredDep
                ? `${hoveredDep.name} — ${hoveredDep.agents} agent${hoveredDep.agents === 1 ? "" : "s"}, ${hoveredDep.cities} cit${hoveredDep.cities === 1 ? "y" : "ies"} covered`
                : "Hover a department for its numbers"}
            </p>
          </div>
        )}

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span>Agents</span>
          <span className="flex items-center gap-1">
            <span className="bg-muted size-3 rounded-[2px]" />0
          </span>
          {STEPS.map((s) => (
            <span key={s.label} className="flex items-center gap-1">
              <span
                className={`size-3 rounded-[2px] ${AGENT_BG}`}
                style={{ opacity: s.opacity }}
              />
              {s.label}
            </span>
          ))}
        </div>

        {(coverage.unplaced.length > 0 || coverage.elsewhere > 0) && (
          <p className="text-muted-foreground text-xs">
            {coverage.unplaced.length > 0 &&
              `Not on the map: ${coverage.unplaced.map((u) => `${u.city} (${u.agents})`).join(", ")}. `}
            {coverage.elsewhere > 0 &&
              `${coverage.elsewhere} zone${coverage.elsewhere === 1 ? "" : "s"} outside Congo.`}
          </p>
        )}

        <p className="text-muted-foreground/70 text-[10px]">{CONGO_MAP_ATTRIBUTION}</p>
      </CardContent>
    </Card>
  );
}
