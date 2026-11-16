import { create } from "zustand";

import type { VisioJoin } from "#/lib/api/visio-controller";

/** The call open in the admin: one at a time, kept across pages. */
export type ActiveCall = {
  /** `event:<room>` or `chat:<conversationId>`: the same call isn't opened twice. */
  key: string;
  title: string;
  join: VisioJoin;
  /** A team-chat call: leaving tells the backend (the last one out ends it). */
  conversationId?: string;
};

/** Someone started a call in a conversation I'm in. */
export type IncomingRing = {
  conversationId: string;
  conversationName: string | null;
  callerName: string;
  direct: boolean;
};

type CallStoreState = {
  call: ActiveCall | null;
  /** A small window over the admin, or the whole screen. */
  size: "panel" | "full";
  ringing: IncomingRing | null;
  open: (call: ActiveCall) => void;
  close: () => void;
  setSize: (size: "panel" | "full") => void;
  ring: (ring: IncomingRing) => void;
  stopRinging: (conversationId?: string) => void;
};

export const useCallStore = create<CallStoreState>((set) => ({
  call: null,
  size: "panel",
  ringing: null,
  open: (call) => set({ call, size: "panel", ringing: null }),
  close: () => set({ call: null }),
  setSize: (size) => set({ size }),
  ring: (ringing) => set({ ringing }),
  // Without an id: whatever rings. With one: only that conversation's ring.
  stopRinging: (conversationId) =>
    set((s) =>
      !conversationId || s.ringing?.conversationId === conversationId
        ? { ringing: null }
        : s,
    ),
}));
