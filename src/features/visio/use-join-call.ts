import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

import { chatKeys } from "#/hooks/use-chat";
import { joinChatCall, startChatCall } from "#/lib/api/chat-controller";
import { joinEventVisio } from "#/lib/api/visio-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { useCallStore, type ActiveCall } from "#/stores/use-call-store";

/**
 * Opens a call in the floating panel: an HR event's visio, or a team-chat
 * call (started if none is going on). One call at a time: switching asks first.
 */
export function useJoinCall() {
  const queryClient = useQueryClient();

  const openCall = useCallback((next: ActiveCall) => {
    const { call, open, setSize } = useCallStore.getState();
    if (call?.key === next.key) {
      setSize("panel");
      return;
    }
    if (
      call &&
      !window.confirm(`Leave « ${call.title} » to join « ${next.title} »?`)
    ) {
      return;
    }
    // A public room (no Jitsi secret on the backend) can't be embedded with a token.
    if (next.join.provider === "jitsi") {
      window.open(next.join.url, "_blank", "noopener");
      return;
    }
    open(next);
  }, []);

  const joinEvent = useCallback(
    async (room: string) => {
      try {
        const join = await joinEventVisio(room);
        openCall({ key: `event:${room}`, title: join.title, join });
      } catch (e) {
        toast.error(friendlyError(e, "Couldn't open the video meeting."));
      }
    },
    [openCall],
  );

  const joinConversation = useCallback(
    async (conversationId: string, opts?: { start?: boolean }) => {
      try {
        if (opts?.start) {
          await startChatCall(conversationId);
          void queryClient.invalidateQueries({
            queryKey: chatKeys.conversations,
          });
        }
        const join = await joinChatCall(conversationId);
        openCall({
          key: `chat:${conversationId}`,
          title: join.title,
          join,
          conversationId,
        });
      } catch (e) {
        toast.error(friendlyError(e, "Couldn't join the call."));
      }
    },
    [openCall, queryClient],
  );

  return { joinEvent, joinConversation };
}
