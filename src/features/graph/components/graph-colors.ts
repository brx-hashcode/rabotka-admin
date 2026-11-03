import type { GraphEdge, GraphNode } from "#/lib/api/collaboration-graph-controller";

/**
 * One set of colours for the canvas, the legend and the side panel, so a dot
 * or a line means the same thing wherever it appears.
 */
export const GRAPH_COLORS = {
  employer: "#6366f1",
  worker: "#10b981",
  mission: "#94a3b8",
  // Paid contacts get their own hue: money changed hands, but no mission (yet).
  contact: "#f59e0b",
  application: "#cbd5e1",
} as const;

export const typeColor = (type: GraphNode["type"]) =>
  type === "EMPLOYER" ? GRAPH_COLORS.employer : GRAPH_COLORS.worker;

export const typeLabel = (type: GraphNode["type"]) =>
  type === "EMPLOYER" ? "Recruiter" : "Worker";

export const plural = (n: number, word: string) =>
  `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

/** The strongest thing a link stands for: mission > paid contact > application. */
export function edgeKind(
  edge: Pick<GraphEdge, "collaborations" | "contacts">,
): "mission" | "contact" | "application" {
  if (edge.collaborations > 0) return "mission";
  if (edge.contacts > 0) return "contact";
  return "application";
}
