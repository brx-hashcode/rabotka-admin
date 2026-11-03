import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D, { type ForceGraph3DInstance } from "3d-force-graph";
import { CanvasTexture, SRGBColorSpace, Sprite, SpriteMaterial } from "three";
import {
  IconFocusCentered,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
} from "@tabler/icons-react";

import type {
  GraphEdge,
  GraphNode,
} from "#/lib/api/collaboration-graph-controller";
import { GRAPH_COLORS, edgeKind, plural, typeColor, typeLabel } from "./graph-colors";
import { GraphControl, initialsOf } from "./graph-shared";

/**
 * The same network in three dimensions, for exploring a dense graph by
 * orbiting it. Loaded only when someone switches to 3D: three.js is heavy, and
 * the 2D canvas stays the default.
 *
 * Each profile is a sprite — its photo in its type ring, or its initials — so
 * it faces the camera from every angle, like the 2D node. Missions carry
 * moving particles: the one link kind that means work actually happened.
 */

type Node3D = GraphNode & { x?: number; y?: number; z?: number };
type Link3D = Omit<GraphEdge, "source" | "target"> & {
  source: string | Node3D;
  target: string | Node3D;
};

type Props = Readonly<{
  nodes: GraphNode[];
  edges: GraphEdge[];
  search: string;
  selectedId: string | null;
  onSelect: (node: GraphNode | null) => void;
  onRefresh?: () => void;
}>;

const MIN_SIZE = 8;
const MAX_SIZE = 24;
const TEXTURE = 128;

const idOf = (end: string | Node3D) => (typeof end === "string" ? end : end.id);

/** A round badge: photo (cropped to fill) or initials, inside the type ring. */
function drawBadge(
  canvas: HTMLCanvasElement,
  node: GraphNode,
  photo: HTMLImageElement | null,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const c = TEXTURE / 2;
  const ring = TEXTURE * 0.07;
  ctx.clearRect(0, 0, TEXTURE, TEXTURE);

  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, c - ring, 0, Math.PI * 2);
  ctx.clip();
  if (photo) {
    const inner = (c - ring) * 2;
    const scale = Math.max(inner / photo.naturalWidth, inner / photo.naturalHeight);
    const w = photo.naturalWidth * scale;
    const h = photo.naturalHeight * scale;
    ctx.drawImage(photo, c - w / 2, c - h / 2, w, h);
  } else {
    ctx.fillStyle = typeColor(node.type);
    ctx.fillRect(0, 0, TEXTURE, TEXTURE);
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 ${TEXTURE * 0.36}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initialsOf(node.name), c, c + TEXTURE * 0.02);
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(c, c, c - ring / 2, 0, Math.PI * 2);
  ctx.strokeStyle = typeColor(node.type);
  ctx.lineWidth = ring;
  ctx.stroke();
}

type Badge = { sprite: Sprite; size: number };

function makeBadge(node: GraphNode, size: number): Badge {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE;
  canvas.height = TEXTURE;
  drawBadge(canvas, node, null);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const sprite = new Sprite(
    new SpriteMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  sprite.scale.set(size, size, 1);

  if (node.avatarUrl) {
    const img = new Image();
    // Avatars are served with `Access-Control-Allow-Origin: *`; WebGL refuses
    // a texture without it. On any failure the initials stay.
    img.crossOrigin = "anonymous";
    img.onload = () => {
      drawBadge(canvas, node, img);
      texture.needsUpdate = true;
    };
    img.src = node.avatarUrl;
  }
  return { sprite, size };
}

const LINK_COLOR = {
  mission: GRAPH_COLORS.mission,
  contact: GRAPH_COLORS.contact,
  application: GRAPH_COLORS.application,
} as const;

export default function CollaborationGraph3D({
  nodes,
  edges,
  search,
  selectedId,
  onSelect,
  onRefresh,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraph3DInstance | null>(null);
  const badgesRef = useRef(new Map<string, Badge>());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const [rotating, setRotating] = useState(true);

  const sizeFor = useMemo(() => {
    const maxDegree = Math.max(1, ...nodes.map((n) => n.degree));
    return (n: GraphNode) =>
      MIN_SIZE + (MAX_SIZE - MIN_SIZE) * Math.sqrt(n.degree / maxDegree);
  }, [nodes]);

  // One renderer for the component's life; data and styling update in place.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const graph = new ForceGraph3D(el, { controlType: "orbit" })
      .backgroundColor("rgba(0,0,0,0)")
      .showNavInfo(false)
      .width(el.clientWidth)
      .height(el.clientHeight)
      .nodeId("id")
      .nodeThreeObject((n: object) => {
        const node = n as Node3D;
        return badgesRef.current.get(node.id)?.sprite ?? new Sprite();
      })
      .linkColor((l: object) => LINK_COLOR[edgeKind(l as Link3D)])
      .linkWidth((l: object) => {
        const link = l as Link3D;
        if (link.collaborations > 0) return Math.min(0.6 + link.collaborations * 0.4, 3);
        return 0;
      })
      .linkOpacity(0.55)
      .linkDirectionalParticles((l: object) =>
        (l as Link3D).collaborations > 0 ? 2 : 0,
      )
      .linkDirectionalParticleWidth(1.6)
      .linkDirectionalParticleColor(() => GRAPH_COLORS.mission)
      .onNodeHover((n: object | null) => {
        el.style.cursor = n ? "pointer" : "grab";
        setHovered((n as GraphNode | null) ?? null);
      })
      .onNodeClick((n: object) => onSelectRef.current(n as GraphNode))
      .onBackgroundClick(() => onSelectRef.current(null));

    // A slow orbit until someone takes the controls.
    const controls = graph.controls() as {
      autoRotate?: boolean;
      autoRotateSpeed?: number;
      addEventListener?: (type: string, fn: () => void) => void;
    };
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.addEventListener?.("start", () => {
      controls.autoRotate = false;
      setRotating(false);
    });

    const resize = new ResizeObserver(() => {
      graph.width(el.clientWidth).height(el.clientHeight);
    });
    resize.observe(el);
    graphRef.current = graph;

    return () => {
      resize.disconnect();
      graph._destructor();
      graphRef.current = null;
    };
  }, []);

  // New data: fresh badges and a fresh layout. Copies, because the layout
  // writes positions onto nodes and swaps link ends for node objects.
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const badges = badgesRef.current;
    for (const { sprite } of badges.values()) {
      sprite.material.map?.dispose();
      sprite.material.dispose();
    }
    badges.clear();
    for (const n of nodes) badges.set(n.id, makeBadge(n, sizeFor(n)));

    graph.graphData({
      nodes: nodes.map((n) => ({ ...n })),
      links: edges.map((e) => ({ ...e })),
    });
    const fit = setTimeout(() => graph.zoomToFit(600, 40), 1200);
    return () => clearTimeout(fit);
  }, [nodes, edges, sizeFor]);

  // Search and selection only restyle what is already there.
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const q = search.trim().toLowerCase();

    // A selection lights up the profile and the people it is linked to.
    const neighbours = new Set<string>();
    if (selectedId) {
      neighbours.add(selectedId);
      for (const e of edges) {
        if (e.source === selectedId) neighbours.add(e.target);
        if (e.target === selectedId) neighbours.add(e.source);
      }
    }

    for (const n of nodes) {
      const badge = badgesRef.current.get(n.id);
      if (!badge) continue;
      const matches = !q || n.name.toLowerCase().includes(q);
      const lit = selectedId ? neighbours.has(n.id) : matches;
      badge.sprite.material.opacity = lit ? 1 : 0.15;
      const scale = n.id === selectedId ? badge.size * 1.35 : badge.size;
      badge.sprite.scale.set(scale, scale, 1);
    }

    graph.linkVisibility((l: object) => {
      const link = l as Link3D;
      if (!selectedId) return true;
      return idOf(link.source) === selectedId || idOf(link.target) === selectedId;
    });
  }, [nodes, edges, search, selectedId]);

  // Fly to the selected profile.
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !selectedId) return;
    const node = (graph.graphData().nodes as Node3D[]).find(
      (n) => n.id === selectedId,
    );
    if (node?.x == null || node.y == null || node.z == null) return;
    const distance = 120;
    const ratio = 1 + distance / Math.max(Math.hypot(node.x, node.y, node.z), 1);
    graph.cameraPosition(
      { x: node.x * ratio, y: node.y * ratio, z: node.z * ratio },
      { x: node.x, y: node.y, z: node.z },
      800,
    );
  }, [selectedId]);

  const toggleRotation = () => {
    const controls = graphRef.current?.controls() as
      | { autoRotate?: boolean }
      | undefined;
    if (!controls) return;
    controls.autoRotate = !rotating;
    setRotating(!rotating);
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full cursor-grab" />

      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <GraphControl
          label={rotating ? "Stop rotating" : "Rotate"}
          onClick={toggleRotation}
        >
          {rotating ? (
            <IconPlayerPause className="size-4" />
          ) : (
            <IconPlayerPlay className="size-4" />
          )}
        </GraphControl>
        <GraphControl
          label="Fit to view"
          onClick={() => graphRef.current?.zoomToFit(600, 40)}
        >
          <IconFocusCentered className="size-4" />
        </GraphControl>
        <GraphControl
          label="Re-layout and refresh"
          onClick={() => {
            graphRef.current?.d3ReheatSimulation();
            onRefresh?.();
          }}
        >
          <IconRefresh className="size-4" />
        </GraphControl>
      </div>

      {hovered ? (
        <div className="bg-popover text-popover-foreground pointer-events-none absolute left-3 top-3 rounded-lg border px-3 py-2 text-xs shadow-md">
          <p className="font-medium">{hovered.name}</p>
          <p className="text-muted-foreground">
            {typeLabel(hovered.type)} · {plural(hovered.degree, "connection")}
          </p>
          <p className="text-muted-foreground">
            {plural(hovered.collaborations, "mission")} ·{" "}
            {plural(hovered.contacts, "paid contact")} ·{" "}
            {plural(hovered.applications, "application")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
