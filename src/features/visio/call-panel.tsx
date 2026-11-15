import { JitsiMeeting } from "@jitsi/react-sdk";
import {
  IconAlertTriangle,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconPhoneOff,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { leaveChatCall } from "#/lib/api/chat-controller";
import { cn } from "#/lib/utils";
import { useCallStore } from "#/stores/use-call-store";
import { useJoinCall } from "./use-join-call";

/** The same tools as Rabotka Business' calls. */
const TOOLBAR = [
  "microphone",
  "camera",
  "toggle-camera",
  "select-background",
  "videoquality",
  "desktop",
  "shareaudio",
  "chat",
  "raisehand",
  "closedcaptions",
  "participants-pane",
  "mute-everyone",
  "mute-video-everyone",
  "security",
  "whiteboard",
  "etherpad",
  "noisesuppression",
  "tileview",
  "filmstrip",
  "stats",
  "shortcuts",
  "settings",
  "fullscreen",
  "hangup",
];

type CallApi = {
  executeCommand: (command: string) => void;
  /** Everyone in the call, me included. */
  getNumberOfParticipants: () => number;
  getParticipantsInfo: () => { participantId: string }[];
  addListener: (
    event: string,
    listener: (e: { id?: string; key?: string }) => void,
  ) => void;
};

/** The window's opening size, its smallest, and its gap to the screen's edges. */
const PANEL_W = 480;
const PANEL_H = 320;
const MIN_W = 320;
const MIN_H = 220;
const EDGE = 16;

/** The small window: where it sits and how big it is. */
type Rect = { x: number; y: number; w: number; h: number };

/** Keeps the window on screen and within sizes it can show, whatever the drag. */
function clamp(rect: Rect): Rect {
  const maxW = Math.max(MIN_W, window.innerWidth - 2 * EDGE);
  const maxH = Math.max(MIN_H, window.innerHeight - 2 * EDGE);
  const w = Math.min(Math.max(MIN_W, rect.w), maxW);
  const h = Math.min(Math.max(MIN_H, rect.h), maxH);
  return {
    w,
    h,
    x: Math.min(Math.max(EDGE, rect.x), Math.max(EDGE, window.innerWidth - w - EDGE)),
    y: Math.min(Math.max(EDGE, rect.y), Math.max(EDGE, window.innerHeight - h - EDGE)),
  };
}

/** Top right, at its opening size: where a call opens. */
const topRight = (): Rect =>
  clamp({ x: window.innerWidth - PANEL_W - EDGE, y: EDGE, w: PANEL_W, h: PANEL_H });

/** The edges and corners the window is resized by: which sides each one moves. */
const HANDLES = [
  { dir: "l", className: "left-0 top-10 bottom-3 w-2 cursor-ew-resize" },
  { dir: "r", className: "right-0 top-10 bottom-3 w-2 cursor-ew-resize" },
  { dir: "b", className: "bottom-0 left-3 right-3 h-2 cursor-ns-resize" },
  { dir: "bl", className: "bottom-0 left-0 size-4 cursor-nesw-resize" },
  { dir: "br", className: "bottom-0 right-0 size-4 cursor-nwse-resize" },
] as const;

type HandleDir = (typeof HANDLES)[number]["dir"];

/** The window after dragging `dir` by (dx, dy) from `start`. */
function resized(start: Rect, dir: HandleDir, dx: number, dy: number): Rect {
  const next = { ...start };
  if (dir.includes("r")) next.w = start.w + dx;
  if (dir.includes("b")) next.h = start.h + dy;
  if (dir.includes("l")) {
    // Growing to the left: the right edge stays where it was.
    const w = Math.max(MIN_W, start.w - dx);
    next.x = start.x + start.w - w;
    next.w = w;
  }
  return clamp(next);
}

/**
 * The call, over the admin: a window that opens at the top right, can be
 * dragged anywhere by its bar (double-click: full screen) and resized by its
 * edges and bottom corners, and stays open while you move between pages.
 * Mounted once in the authenticated layout.
 */
export function CallPanel() {
  const call = useCallStore((s) => s.call);
  const size = useCallStore((s) => s.size);
  const setSize = useCallStore((s) => s.setSize);
  const close = useCallStore((s) => s.close);
  const { joinConversation, joinEvent } = useJoinCall();
  const api = useRef<CallApi | null>(null);
  // The others in the call: the last one out ends a team-chat call.
  const others = useRef(new Set<string>());
  const left = useRef(false);
  /**
   * Leaving: the panel is hidden at once, but the call stays mounted until
   * Jitsi has really left (videoConferenceLeft). Removed any earlier, the
   * server keeps a ghost of us in the room: doubled on rejoin, and counted
   * as still there.
   */
  const [leaving, setLeaving] = useState(false);
  const finishTimer = useRef<number | null>(null);
  const afterLeave = useRef<(() => void) | null>(null);
  // Where the small window sits and its size; a new call opens at the top right again.
  const [rect, setRect] = useState<Rect>(topRight);
  // While moving or resizing, the call's iframe must not swallow the pointer.
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const resize = useRef<{
    dir: HandleDir;
    x: number;
    y: number;
    start: Rect;
  } | null>(null);

  const conversationId = call?.conversationId;
  const callKey = call?.key;
  const domain = call?.join.provider === "hosted" ? call.join.domain : null;

  /**
   * Whether our Jitsi answers before the call loads. Its script failing
   * (an untrusted certificate on localhost, the server down) would otherwise
   * leave a grey box: the SDK only logs it.
   */
  const [reach, setReach] = useState<"checking" | "ok" | "failed">("checking");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!domain) return;
    let cancelled = false;
    setReach("checking");
    fetch(`https://${domain}/external_api.js`, { mode: "no-cors", cache: "no-store" })
      .then(() => !cancelled && setReach("ok"))
      .catch(() => !cancelled && setReach("failed"));
    return () => {
      cancelled = true;
    };
  }, [domain, attempt]);

  // A new call: nobody counted yet.
  useEffect(() => {
    others.current = new Set();
    left.current = false;
    setLeaving(false);
    setRect(topRight());
  }, [callKey]);

  // The browser shrank: bring the window back on screen.
  useEffect(() => {
    const onResize = () => setRect((p) => clamp(p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Tab closed mid-call: still tell the backend, so the call can end.
  useEffect(() => {
    if (!conversationId) return;
    const onHide = () => {
      if (left.current) return;
      left.current = true;
      navigator.sendBeacon(
        `/api/v1/admin/chat/conversations/${conversationId}/call/leave`,
        new Blob([JSON.stringify({ remaining: others.current.size })], {
          type: "application/json",
        }),
      );
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [conversationId]);

  if (call?.join.provider !== "hosted") return null;
  const { join } = call;

  /** Jitsi has left (or 5 s passed): the call goes away for good. */
  const finish = () => {
    if (finishTimer.current !== null) {
      window.clearTimeout(finishTimer.current);
      finishTimer.current = null;
    }
    api.current = null;
    close();
    const then = afterLeave.current;
    afterLeave.current = null;
    then?.();
  };

  /**
   * Out of the call: hidden at once, removed once Jitsi has told the server
   * (see `leaving`). `endedForAll`: « End meeting for all » was picked, so
   * nobody is left in the call, and a team-chat call ends with it.
   */
  const leave = (endedForAll = false) => {
    // Once per call: the Leave button, the red button and Jitsi's own events all lead here.
    if (left.current) return;
    left.current = true;
    // Who is still in it, read before hanging up. Jitsi's own count includes
    // people already there when I joined, which participantJoined never told me.
    let count = 0;
    try {
      count = (api.current?.getNumberOfParticipants() ?? 0) - 1;
    } catch {
      // the call is already gone
    }
    const remaining = endedForAll
      ? 0
      : Math.max(others.current.size, count, 0);
    if (!endedForAll) {
      try {
        api.current?.executeCommand("hangup");
      } catch {
        // already gone
      }
    }
    if (conversationId) {
      void leaveChatCall(conversationId, remaining).catch(() => undefined);
    }
    // As in Google Meet: left a call that goes on, it can be joined again.
    const again = call;
    afterLeave.current =
      !endedForAll && (remaining > 0 || !conversationId)
        ? () =>
      toast("You left the call", {
        description: again.title,
        duration: 15_000,
        action: {
          label: "Rejoin",
          onClick: () =>
            void (again.conversationId
              ? joinConversation(again.conversationId)
              : joinEvent(again.key.replace(/^event:/, ""))),
        },
      })
        : null;
    if (!api.current) {
      finish();
      return;
    }
    setLeaving(true);
    finishTimer.current = window.setTimeout(finish, 5000);
  };

  const full = size === "full";

  const startDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (full || e.button !== 0) return;
    // The bar's buttons stay buttons.
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { dx: e.clientX - rect.x, dy: e.clientY - rect.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const moveDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const { dx, dy } = drag.current;
    setRect((p) => clamp({ ...p, x: e.clientX - dx, y: e.clientY - dy }));
  };
  const endDrag = () => {
    drag.current = null;
    resize.current = null;
    setDragging(false);
  };

  const startResize =
    (dir: HandleDir) => (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      resize.current = { dir, x: e.clientX, y: e.clientY, start: rect };
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
    };
  const moveResize = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = resize.current;
    if (!r) return;
    setRect(resized(r.start, r.dir, e.clientX - r.x, e.clientY - r.y));
  };

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden rounded-xl border bg-neutral-950 shadow-2xl",
        full && "inset-3",
        leaving && "pointer-events-none invisible",
      )}
      style={
        full
          ? undefined
          : { left: rect.x, top: rect.y, width: rect.w, height: rect.h }
      }
    >
      <div
        className={cn(
          "flex h-10 shrink-0 touch-none select-none items-center gap-2 border-b border-white/10 px-3 text-white",
          !full && (dragging ? "cursor-grabbing" : "cursor-grab"),
        )}
        title={full ? undefined : "Drag to move · double-click for full screen"}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          setSize(full ? "panel" : "full");
        }}
      >
        <span className="size-2 shrink-0 animate-pulse rounded-full bg-green-500" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {call.title}
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7 text-white hover:bg-white/10 hover:text-white"
          title={full ? "Small window" : "Full screen"}
          onClick={() => setSize(full ? "panel" : "full")}
        >
          {full ? (
            <IconArrowsMinimize className="size-4" />
          ) : (
            <IconArrowsMaximize className="size-4" />
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="h-7 gap-1 px-2"
          onClick={() => leave()}
        >
          <IconPhoneOff className="size-4" />
          Leave
        </Button>
      </div>
      <div className={cn("min-h-0 flex-1", dragging && "pointer-events-none")}>
        {reach === "checking" && (
          <Skeleton className="size-full rounded-none" />
        )}
        {reach === "failed" && (
          <Unreachable
            domain={join.domain}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        )}
        {reach === "ok" && (
        <JitsiMeeting
          key={`${call.key}:${attempt}`}
          domain={join.domain}
          roomName={join.roomName}
          jwt={join.jwt}
          lang="en"
          configOverwrite={{
            subject: call.title,
            prejoinConfig: {
              enabled: true,
              hideExtraJoinButtons: ["no-audio", "by-phone"],
            },
            toolbarButtons: TOOLBAR,
            recordings: { showPrejoinWarning: false },
            disableDeepLinking: true,
            disableInviteFunctions: true,
            enableWelcomePage: false,
            enableClosePage: false,
            disableThirdPartyRequests: true,
            notifications: [],
            logging: { defaultLogLevel: "error", loggers: {} },
            // Told the moment the call's own hang-up button is pressed, so the
            // panel closes at once (readyToClose comes seconds later).
            // Every admin is a moderator, so Jitsi's red button would open
            // « End meeting for all / Leave meeting », and one wrong pick throws
            // everyone out. Here it just leaves (hangup-menu, not run by Jitsi);
            // a team call ends by itself when the last one leaves.
            buttonsWithNotifyClick: [
              { key: "hangup-menu", preventExecution: true },
              { key: "hangup", preventExecution: false },
              { key: "end-meeting", preventExecution: false },
            ],
          }}
          interfaceConfigOverwrite={{
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            MOBILE_APP_PROMO: false,
            SHOW_CHROME_EXTENSION_BANNER: false,
          }}
          onApiReady={(a) => {
            const callApi = a as unknown as CallApi;
            api.current = callApi;
            // Joined: the people already there count too (participantJoined
            // only tells of those who come after).
            callApi.addListener("videoConferenceJoined", (e) => {
              try {
                for (const p of callApi.getParticipantsInfo()) {
                  if (p.participantId && p.participantId !== e.id)
                    others.current.add(p.participantId);
                }
              } catch {
                // counted as they come instead
              }
            });
            callApi.addListener("participantJoined", (e) => {
              if (e.id) others.current.add(e.id);
            });
            callApi.addListener("participantLeft", (e) => {
              if (e.id) others.current.delete(e.id);
            });
            callApi.addListener("toolbarButtonClicked", (e) => {
              if (e.key === "hangup" || e.key === "hangup-menu") leave();
              if (e.key === "end-meeting") leave(true);
            });
            // Out of the conference whatever the way (ended by someone else,
            // kicked, connection lost): the panel doesn't stay black.
            callApi.addListener("videoConferenceLeft", () => {
              leave();
              finish();
            });
          }}
          onReadyToClose={() => {
            leave();
            finish();
          }}
          getIFrameRef={(node) => {
            node.style.height = "100%";
            node.style.width = "100%";
          }}
          spinner={() => <Skeleton className="size-full rounded-none" />}
        />
        )}
      </div>
      {/* Resize by the sides and the bottom corners (not in full screen). */}
      {!full &&
        HANDLES.map((h) => (
          <div
            key={h.dir}
            className={cn("absolute z-10 touch-none", h.className)}
            onPointerDown={startResize(h.dir)}
            onPointerMove={moveResize}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
        ))}
    </div>
  );
}

/**
 * Our Jitsi didn't answer. Locally that's nearly always its self-signed
 * certificate, which each browser profile has to accept once.
 */
function Unreachable({
  domain,
  onRetry,
}: Readonly<{ domain: string; onRetry: () => void }>) {
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(domain);
  return (
    <div className="flex size-full items-center justify-center p-6 text-center text-white">
      <div className="max-w-sm space-y-3">
        <IconAlertTriangle className="mx-auto size-8 text-amber-400" />
        <p className="font-medium">The video server can't be reached</p>
        <p className="text-sm text-white/70">
          {local
            ? `This browser doesn't trust the local video server yet. Open https://${domain}, accept the security warning (Advanced → Proceed), then retry.`
            : "Check your connection, then retry. If it keeps failing, the video server may be down."}
        </p>
        <div className="flex justify-center gap-2">
          {local && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                window.open(`https://${domain}`, "_blank", "noopener")
              }
            >
              Open {domain}
            </Button>
          )}
          <Button type="button" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
