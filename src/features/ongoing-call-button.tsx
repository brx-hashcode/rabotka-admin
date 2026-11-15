import { IconVideo } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { useJoinCall } from "#/features/visio/use-join-call";
import { useAdminMe } from "#/hooks/use-admin-me";
import { useConversations } from "#/hooks/use-chat";
import { useCallStore } from "#/stores/use-call-store";

/**
 * « Join call » in the header, on every page, while a call is going on in one
 * of my conversations and I'm not in it. Gone once I join, or once it ends
 * (call:ended refreshes the conversations).
 */
export function OngoingCallButton() {
  const { data: conversations } = useConversations();
  const { data: me } = useAdminMe();
  const current = useCallStore((s) => s.call?.conversationId);
  const { joinConversation } = useJoinCall();

  const live = conversations?.find(
    (c) => c.activeCall && c.id !== current,
  );
  if (!live) return null;

  const title =
    live.type === "GROUP"
      ? (live.name ?? "Group")
      : (live.participants.find((p) => p.userId !== me?.id)?.name ?? "Direct");

  return (
    <Button
      type="button"
      size="sm"
      className="gap-1.5 bg-green-600 text-white hover:bg-green-700"
      title={`A call is going on in ${title}`}
      onClick={() => void joinConversation(live.id)}
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/70" />
        <span className="relative inline-flex size-2 rounded-full bg-white" />
      </span>
      <IconVideo className="size-4" />
      <span className="hidden sm:inline">Join call</span>
      <span className="hidden max-w-32 truncate lg:inline">· {title}</span>
    </Button>
  );
}
