import { GRAPH_COLORS } from "./graph-colors";

/**
 * What the marks mean, sized to sit in the graph card's header. Each line
 * sample is drawn the way the canvas draws it: solid, dashed, dotted.
 */
export function GraphLegend() {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
      <span className="inline-flex items-center gap-1.5">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: GRAPH_COLORS.employer }}
        />
        Recruiter
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: GRAPH_COLORS.worker }}
        />
        Worker
      </span>
      <span className="bg-border h-3 w-px" aria-hidden />
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-0.5 w-5 rounded-full"
          style={{ backgroundColor: GRAPH_COLORS.mission }}
        />
        Mission
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-0 w-5 border-t-2 border-dotted"
          style={{ borderColor: GRAPH_COLORS.contact }}
        />
        Paid contact
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-0 w-5 border-t border-dashed"
          style={{ borderColor: GRAPH_COLORS.application }}
        />
        Unanswered application
      </span>
    </div>
  );
}
