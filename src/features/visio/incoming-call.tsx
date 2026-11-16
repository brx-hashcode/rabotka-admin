import { IconPhone, IconPhoneOff, IconVideo } from "@tabler/icons-react";
import { useEffect } from "react";

import { Button } from "#/components/ui/button";
import { declineChatCall } from "#/lib/api/chat-controller";
import { useCallStore } from "#/stores/use-call-store";
import { armRingtoneUnlock, startRingtone } from "./ringtone";
import { useJoinCall } from "./use-join-call";

// Ready to ring from the first click anywhere in the admin.
armRingtoneUnlock();

/** A ring stops by itself after this long. */
const RING_MS = 30_000;

/**
 * Someone started a call in one of my conversations: a card in the corner,
 * with a ring, until I join, decline, it ends, or 30 s pass.
 */
export function IncomingCall() {
  const ringing = useCallStore((s) => s.ringing);
  const stopRinging = useCallStore((s) => s.stopRinging);
  const { joinConversation } = useJoinCall();
  const conversationId = ringing?.conversationId;

  useEffect(() => {
    if (!conversationId) return;
    const stopRing = startRingtone();
    const giveUp = window.setTimeout(
      () => stopRinging(conversationId),
      RING_MS,
    );
    return () => {
      stopRing();
      window.clearTimeout(giveUp);
    };
  }, [conversationId, stopRinging]);

  if (!ringing) return null;

  const where = ringing.direct
    ? "is calling you"
    : `started a call in ${ringing.conversationName ?? "a group"}`;

  return (
    <div className="fixed right-4 top-4 z-[60] w-80 rounded-xl border bg-card p-4 shadow-2xl">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-600">
          <IconVideo className="size-5 animate-pulse" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{ringing.callerName}</p>
          <p className="truncate text-sm text-muted-foreground">{where}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-1.5"
          onClick={() => {
            stopRinging(ringing.conversationId);
            void declineChatCall(ringing.conversationId).catch(
              () => undefined,
            );
          }}
        >
          <IconPhoneOff className="size-4" />
          Decline
        </Button>
        <Button
          type="button"
          className="flex-1 gap-1.5 bg-green-600 text-white hover:bg-green-700"
          onClick={() => {
            stopRinging(ringing.conversationId);
            void joinConversation(ringing.conversationId);
          }}
        >
          <IconPhone className="size-4" />
          Join
        </Button>
      </div>
    </div>
  );
}
