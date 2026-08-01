import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
} from "d3-force";
import { select } from "d3-selection";
// Side-effect import: augments d3 selections with .transition().
import "d3-transition";
import { zoom, zoomIdentity, type ZoomTransform } from "d3-zoom";
import { drag } from "d3-drag";
import {
  IconFocusCentered,
  IconMinus,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";

import { ChatDoodleBg } from "#/pages/profile-detail/components/chat-doodle-bg";
import type {
  GraphEdge,
  GraphNode,
} from "#/lib/api/collaboration-graph-controller";

/** Simulation-mutated copies — d3 writes x/y/vx/vy onto these. */
type SimNode = GraphNode & {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};
type SimEdge = Omit<GraphEdge, "source" | "target"> & {
  source: SimNode;
  target: SimNode;
};

const EMPLOYER_COLOR = "#6366f1";
const WORKER_COLOR = "#10b981";
const COLLAB_LINK = "#94a3b8";
const APPLICATION_LINK = "#cbd5e1";

const MIN_RADIUS = 10;
const MAX_RADIUS = 30;

/**
 * Alpha the simulation is held at once it has settled.
 *
 * d3-force is built to converge and stop, which leaves the graph looking frozen.
 * Holding a small target keeps it ticking so nodes drift and respond to each
 * other. Low enough to read as breathing rather than jitter.
 */
const IDLE_ALPHA = 0.015;
/** Reheat while a node is being dragged, so neighbours give way. */
const DRAG_ALPHA = 0.25;

type Props = Readonly<{
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Highlights matches and dims everything else. */
  search: string;
  selectedId: string | null;
  onSelect: (node: GraphNode | null) => void;
  /** Refetch the graph data. Called alongside the local re-layout. */
  onRefresh?: () => void;
}>;

/**
 * Force-directed employer↔worker network.
 *
 * Canvas rather than SVG: one <path> per link stops being viable well before
 * the API's 2000-link ceiling, and the whole point of the view is to stay
 * usable as the platform grows.
 */
export function CollaborationGraphCanvas({
  nodes,
  edges,
  search,
  selectedId,
  onSelect,
  onRefresh,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const simNodesRef = useRef<SimNode[]>([]);
  const simEdgesRef = useRef<SimEdge[]>([]);
  const hoverRef = useRef<SimNode | null>(null);
  const zoomRef = useRef<ReturnType<
    typeof zoom<HTMLCanvasElement, unknown>
  > | null>(null);
  const [hovered, setHovered] = useState<GraphNode | null>(null);

  /** Avatar bitmaps by URL. "error" marks one that will never load. */
  const imagesRef = useRef(new Map<string, HTMLImageElement | "error">());
  /** Last known position per profile, so a filter change doesn't reshuffle. */
  const positionsRef = useRef(new Map<string, { x: number; y: number }>());
  /** Whether the origin has been placed at the centre of the block yet. */
  const centredRef = useRef(false);
  /** Bumped to force a fresh layout; see `refresh`. */
  const [layoutKey, setLayoutKey] = useState(0);

  // Node radius scales with distinct counterparties, on a sqrt curve so one hub
  // does not flatten everyone else into dots.
  const radiusFor = useMemo(() => {
    const maxDegree = Math.max(1, ...nodes.map((n) => n.degree));
    return (n: GraphNode) =>
      MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * Math.sqrt(n.degree / maxDegree);
  }, [nodes]);

  const matches = useCallback(
    (n: GraphNode) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return n.name.toLowerCase().includes(q);
    },
    [search],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = globalThis.devicePixelRatio || 1;
    const t = transformRef.current;
    const searching = search.trim().length > 0;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);

    // Links first so nodes sit on top.
    for (const e of simEdgesRef.current) {
      const real = e.collaborations > 0;
      const involved = !searching || matches(e.source) || matches(e.target);
      ctx.beginPath();
      ctx.moveTo(e.source.x, e.source.y);
      ctx.lineTo(e.target.x, e.target.y);
      ctx.strokeStyle = real ? COLLAB_LINK : APPLICATION_LINK;
      ctx.globalAlpha = involved ? (real ? 0.7 : 0.25) : 0.05;
      // Real collaborations thicken with repeat work; applications stay hairline
      // so a spammy applicant never looks like a strong relationship.
      ctx.lineWidth = real ? Math.min(1 + e.collaborations * 0.6, 6) : 0.75;
      if (!real) ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.globalAlpha = 1;
    for (const n of simNodesRef.current) {
      const isMatch = matches(n);
      const isSelected = n.id === selectedId;
      const r = radiusFor(n);
      const typeColor = n.type === "EMPLOYER" ? EMPLOYER_COLOR : WORKER_COLOR;
      ctx.globalAlpha = searching && !isMatch ? 0.15 : 1;

      const avatar = usableAvatar(imagesRef.current, n.avatarUrl);

      ctx.save();
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.closePath();

      if (avatar) {
        // Cover-fit inside the circle, so a non-square photo is cropped rather
        // than squashed.
        ctx.clip();
        const scale = Math.max(
          (r * 2) / avatar.naturalWidth,
          (r * 2) / avatar.naturalHeight,
        );
        const w = avatar.naturalWidth * scale;
        const h = avatar.naturalHeight * scale;
        ctx.drawImage(avatar, n.x - w / 2, n.y - h / 2, w, h);
      } else {
        ctx.fillStyle = typeColor;
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = `600 ${r * 0.8}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(initialsOf(n.name), n.x, n.y);
      }
      ctx.restore();

      // Type ring — without it a photo would hide whether this is a recruiter
      // or a worker, which is the one thing the colour encodes.
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = typeColor;
      ctx.lineWidth = Math.max(1.5, r * 0.16);
      ctx.stroke();

      if (isSelected || (searching && isMatch)) {
        // Outside the type ring so the two never overlap.
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 3 / t.k + r * 0.08, 0, Math.PI * 2);
        ctx.lineWidth = 3 / t.k;
        ctx.strokeStyle = isSelected ? "#0f172a" : "#f59e0b";
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [matches, radiusFor, search, selectedId]);

  /**
   * Always-current draw, called from the simulation tick and from async image
   * loads. Without this indirection `draw` would have to be a dependency of the
   * simulation effect, and every search keystroke would tear down and re-run
   * the entire layout.
   */
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
    draw();
  }, [draw]);

  // Fetch avatars once each and repaint as they arrive.
  useEffect(() => {
    const cache = imagesRef.current;
    for (const n of nodes) {
      if (!n.avatarUrl || cache.has(n.avatarUrl)) continue;
      const img = new Image();
      // No crossOrigin on purpose: we never read pixels back, so tainting the
      // canvas costs nothing — and requesting CORS would make avatars served
      // without the header fail to load at all.
      img.onload = () => drawRef.current();
      img.onerror = () => {
        cache.set(n.avatarUrl as string, "error");
      };
      img.src = n.avatarUrl;
      cache.set(n.avatarUrl, img);
    }
  }, [nodes]);

  // Rebuild the simulation only when the data itself changes.
  useEffect(() => {
    const positions = positionsRef.current;
    const byId = new Map<string, SimNode>();
    for (const n of nodes) {
      const previous = positions.get(n.id);
      // Seeding from the last layout keeps a filter change continuous. New
      // nodes get no x/y at all, so d3's phyllotaxis spreads them out — setting
      // 0,0 would stack every node on one point and explode outward.
      byId.set(n.id, { ...n, ...(previous ?? {}) } as SimNode);
    }
    const simNodes = [...byId.values()];
    const simEdges: SimEdge[] = [];
    for (const e of edges) {
      const source = byId.get(e.source);
      const target = byId.get(e.target);
      if (source && target) simEdges.push({ ...e, source, target });
    }

    simNodesRef.current = simNodes;
    simEdgesRef.current = simEdges;

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimEdge>(simEdges)
          .id((d) => d.id)
          // Repeat collaborators sit closer together.
          .distance((d) => 150 - Math.min(d.collaborations * 12, 95))
          .strength((d) => Math.min(0.12 + d.collaborations * 0.05, 0.5)),
      )
      .force(
        "charge",
        // distanceMax stops far-apart clusters from tugging on each other,
        // which is what makes a large graph drift instead of settling.
        forceManyBody<SimNode>().strength(-340).distanceMax(700),
      )
      .force(
        "collide",
        forceCollide<SimNode>()
          .radius((d) => radiusFor(d) + 5)
          .strength(0.9)
          .iterations(2),
      )
      // Gentle pull to the origin instead of forceCenter: forceCenter shifts
      // every node by the same offset each tick, which reads as the whole graph
      // lurching sideways.
      .force("x", forceX(0).strength(0.045))
      .force("y", forceY(0).strength(0.045))
      .velocityDecay(0.35)
      .alphaDecay(0.018)
      // Decays toward IDLE_ALPHA rather than 0, so the layout animates in and
      // then keeps a gentle life instead of freezing.
      .alphaTarget(IDLE_ALPHA)
      .on("tick", () => {
        for (const n of simNodes) positions.set(n.id, { x: n.x, y: n.y });
        drawRef.current();
      });

    simRef.current = sim;

    // The simulation never converges now, so it would tick forever in a tab
    // nobody is looking at. Park it while hidden and resume on return.
    const onVisibility = () => {
      if (document.hidden) sim.stop();
      else sim.alphaTarget(IDLE_ALPHA).restart();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      sim.stop();
    };
  }, [nodes, edges, radiusFor, layoutKey]);

  /** Nearest node under the pointer, in simulation space. */
  const nodeAt = useCallback(
    (clientX: number, clientY: number): SimNode | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const [x, y] = transformRef.current.invert([
        clientX - rect.left,
        clientY - rect.top,
      ]);

      let best: SimNode | null = null;
      let bestDist = Infinity;
      for (const n of simNodesRef.current) {
        const dist = Math.hypot(n.x - x, n.y - y);
        if (dist < radiusFor(n) + 4 && dist < bestDist) {
          best = n;
          bestDist = dist;
        }
      }
      return best;
    },
    [radiusFor],
  );

  // Zoom, pan and node dragging.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const selection = select<HTMLCanvasElement, unknown>(canvas);

    const zoomBehaviour = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.15, 6])
      // d3-zoom's default filter swallows every wheel event and preventDefaults
      // it, which turns a canvas this tall into a scroll trap: the page cannot
      // move while the pointer is anywhere over the graph. Rejecting a plain
      // wheel here lets it bubble and scroll the page as normal — d3 checks the
      // filter before it calls preventDefault.
      .filter((event: Event) => {
        if (event.type === "wheel") {
          // Trackpad pinch is reported as ctrlKey+wheel, so pinch-to-zoom keeps
          // working; ⌘/Ctrl + wheel is the deliberate opt-in on a mouse.
          const e = event as WheelEvent;
          return e.ctrlKey || e.metaKey;
        }
        if (event.type === "dblclick") return true;
        // Everything else (drag to pan, touch) keeps d3's usual rule.
        return !(event as MouseEvent).button;
      })
      .on("zoom", (event) => {
        transformRef.current = event.transform as ZoomTransform;
        drawRef.current();
      });
    zoomRef.current = zoomBehaviour;

    const dragBehaviour = drag<HTMLCanvasElement, unknown>()
      .subject((event) =>
        nodeAt(event.sourceEvent.clientX, event.sourceEvent.clientY),
      )
      .on("start", (event) => {
        if (!event.subject) return;
        // Reheat just enough for neighbours to give way, not enough to relayout.
        simRef.current?.alphaTarget(DRAG_ALPHA).restart();
        const n = event.subject as SimNode;
        n.fx = n.x;
        n.fy = n.y;
      })
      .on("drag", (event) => {
        if (!event.subject) return;
        const n = event.subject as SimNode;
        const k = transformRef.current.k;
        n.fx = (n.fx ?? n.x) + event.dx / k;
        n.fy = (n.fy ?? n.y) + event.dy / k;
      })
      .on("end", (event) => {
        if (!event.subject) return;
        // Back to idle, NOT to 0 — zero would stop the simulation for good.
        simRef.current?.alphaTarget(IDLE_ALPHA);
        const n = event.subject as SimNode;
        n.fx = null;
        n.fy = null;
      })
      // Without this a drag starting on empty space would fight the pan.
      .filter((event) =>
        Boolean(
          nodeAt((event as MouseEvent).clientX, (event as MouseEvent).clientY),
        ),
      );

    selection.call(zoomBehaviour).call(dragBehaviour);
    return () => {
      selection.on(".zoom", null).on(".drag", null);
    };
  }, [nodeAt]);

  // Keep the backing store in step with the element's CSS size.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const resize = () => {
      const dpr = globalThis.devicePixelRatio || 1;
      const { width, height } = wrapper.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Put the simulation origin at the centre of the block, so the forces
      // (which all pull toward 0,0) settle the graph in the middle of the view
      // rather than at the canvas corner.
      //
      // This MUST go through the zoom behaviour: d3-zoom keeps its own
      // transform on the element, and assigning transformRef directly leaves
      // that at identity — so the first pan or zoom would snap the graph back
      // into the top-left corner.
      const behaviour = zoomRef.current;
      if (behaviour && !centredRef.current && width > 0 && height > 0) {
        centredRef.current = true;
        select(canvas).call(
          behaviour.transform,
          zoomIdentity.translate(width / 2, height / 2),
        );
        return; // the zoom handler redraws
      }
      drawRef.current();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  /** Puts the origin back at the centre of the block, through d3 so its own
   * stored transform stays in agreement. */
  const centreOrigin = useCallback((animate = true) => {
    const canvas = canvasRef.current;
    const behaviour = zoomRef.current;
    if (!canvas || !behaviour) return;
    const dpr = globalThis.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    if (width <= 0 || height <= 0) return;

    const target = zoomIdentity.translate(width / 2, height / 2);
    const selection = select(canvas);
    if (animate) {
      selection.transition().duration(300).call(behaviour.transform, target);
    } else {
      selection.call(behaviour.transform, target);
    }
  }, []);

  /**
   * Throws away the current layout and starts over, and refetches the data.
   *
   * Clearing the remembered positions is the whole point: the simulation effect
   * normally seeds from them to keep filter changes continuous, so without this
   * a rebuild would drop every node straight back where it already was and
   * nothing would appear to happen.
   */
  const refresh = useCallback(() => {
    positionsRef.current.clear();
    setLayoutKey((k) => k + 1);
    // A fresh layout spreads around the origin, so put the view back there —
    // otherwise refreshing while panned away lands the new graph off-screen.
    centreOrigin();
    onRefresh?.();
  }, [centreOrigin, onRefresh]);

  const zoomBy = useCallback((factor: number) => {
    const canvas = canvasRef.current;
    const behaviour = zoomRef.current;
    if (!canvas || !behaviour) return;
    select(canvas)
      .transition()
      .duration(220)
      .call(behaviour.scaleBy, factor);
  }, []);

  /**
   * Frames every node rather than just resetting to the identity transform:
   * after dragging a cluster off-screen, "reset" is only useful if it brings
   * the graph back into view at a scale where you can see all of it.
   */
  const resetView = useCallback(() => {
    const canvas = canvasRef.current;
    const behaviour = zoomRef.current;
    const simNodes = simNodesRef.current;
    if (!canvas || !behaviour || simNodes.length === 0) return;

    const dpr = globalThis.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const n of simNodes) {
      const r = radiusFor(n);
      minX = Math.min(minX, n.x - r);
      maxX = Math.max(maxX, n.x + r);
      minY = Math.min(minY, n.y - r);
      maxY = Math.max(maxY, n.y + r);
    }

    const padding = 48;
    // Guard the single-node case, where the bounding box has no extent.
    const spanX = Math.max(maxX - minX, 1);
    const spanY = Math.max(maxY - minY, 1);
    const k = Math.min(
      (width - padding * 2) / spanX,
      (height - padding * 2) / spanY,
      1.5,
    );
    const centreX = (minX + maxX) / 2;
    const centreY = (minY + maxY) / 2;

    const target = zoomIdentity
      .translate(width / 2, height / 2)
      .scale(Math.max(k, 0.15))
      .translate(-centreX, -centreY);

    select(canvas)
      .transition()
      .duration(450)
      .call(behaviour.transform, target);
  }, [radiusFor]);

  return (
    <div ref={wrapperRef} className="relative h-full w-full text-foreground">
      {/*
        Same WhatsApp doodle backdrop as the chat views. It sits behind the
        canvas, which only ever clears to transparent, so the pattern shows
        through between the nodes. `text-foreground` drives its currentColor
        strokes, so it follows the light/dark theme like it does in chat.
      */}
      <ChatDoodleBg />
      <canvas
        ref={canvasRef}
        className={
          hovered
            ? "h-full w-full cursor-pointer"
            : "h-full w-full cursor-grab active:cursor-grabbing"
        }
        onMouseMove={(e) => {
          const found = nodeAt(e.clientX, e.clientY);
          if (found !== hoverRef.current) {
            hoverRef.current = found;
            setHovered(found);
          }
        }}
        onMouseLeave={() => {
          hoverRef.current = null;
          setHovered(null);
        }}
        onClick={(e) => onSelect(nodeAt(e.clientX, e.clientY))}
      />

      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <GraphControl label="Zoom avant" onClick={() => zoomBy(1.4)}>
          <IconPlus className="size-4" />
        </GraphControl>
        <GraphControl label="Zoom arrière" onClick={() => zoomBy(1 / 1.4)}>
          <IconMinus className="size-4" />
        </GraphControl>
        <GraphControl label="Recentrer" onClick={resetView}>
          <IconFocusCentered className="size-4" />
        </GraphControl>
        <GraphControl label="Réinitialiser et actualiser" onClick={refresh}>
          <IconRefresh className="size-4" />
        </GraphControl>
      </div>

      {hovered && (
        <div className="bg-card shadow-soft pointer-events-none absolute left-3 top-3 rounded-lg px-3 py-2 text-xs">
          <p className="font-medium">{hovered.name}</p>
          <p className="text-muted-foreground">
            {hovered.type === "EMPLOYER" ? "Recruteur" : "Travailleur"} ·{" "}
            {hovered.degree} connexion{hovered.degree === 1 ? "" : "s"}
          </p>
          <p className="text-muted-foreground">
            {hovered.collaborations} mission
            {hovered.collaborations === 1 ? "" : "s"} · {hovered.applications}{" "}
            candidature{hovered.applications === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}

function GraphControl({
  label,
  onClick,
  children,
}: Readonly<{
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="bg-card shadow-soft text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md transition-colors"
    >
      {children}
    </button>
  );
}

/** Up to two letters, matching how the Avatar component builds its fallback. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return `${first}${second}`.toUpperCase();
}

/** A cached image only if it actually decoded — otherwise the caller draws initials. */
function usableAvatar(
  cache: Map<string, HTMLImageElement | "error">,
  url: string | null,
): HTMLImageElement | null {
  if (!url) return null;
  const entry = cache.get(url);
  if (!entry || entry === "error") return null;
  return entry.complete && entry.naturalWidth > 0 ? entry : null;
}
