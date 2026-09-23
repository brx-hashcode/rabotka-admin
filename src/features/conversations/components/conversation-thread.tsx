import { Fragment, useEffect, useRef } from "react";
import { IconInfoCircle, IconMessageCircle } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Spinner } from "#/components/ui/spinner";
import { dayHeading } from "#/lib/date-grouping";
import { useConversationThread } from "#/hooks/use-conversation-thread";
import { ChatDoodleBg } from "#/pages/profile-detail/components/chat-doodle-bg";
import { AdminMessageBubble } from "./admin-message-bubble";

function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * The thread, in the same shell as the profile Messages tab: fixed-height card,
 * doodle wallpaper, bubbles on the wallpaper, one strip along the bottom.
 *
 * That strip holds the audit notice rather than a composer — this conversation
 * belongs to two other people. Saying so where the composer would be is what
 * makes the permission model read as a rule rather than as surveillance.
 */
export function ConversationThread({
  conversationId,
  enabled,
}: Readonly<{ conversationId: string; enabled: boolean }>) {
  const {
    messages,
    total,
    hasOlder,
    loadOlder,
    isLoadingOlder,
    isLoading,
    isError,
  } = useConversationThread(conversationId, enabled);

  const bottomRef = useRef<HTMLDivElement>(null);
  const settled = useRef(false);

  // Jump to the newest message ONCE, on first load, through a sentinel at the
  // end — the same way the profile Messages tab does it, because CardContent
  // renders through Base UI's useRender and a ref on it is not guaranteed to
  // reach the scrolling element.
  //
  // Once, not on every change: somebody paging back through history must not be
  // thrown to the bottom each time a page arrives, which is the opposite of
  // what they just asked for.
  useEffect(() => {
    if (settled.current || messages.length === 0) return;
    settled.current = true;
    bottomRef.current?.scrollIntoView();
  }, [messages.length]);

  const footer = (
    <div className="text-muted-foreground flex shrink-0 items-center gap-2 border-t px-5 py-3 text-xs">
      <IconInfoCircle className="size-3.5 shrink-0" aria-hidden />
      Reading this thread has been recorded in the activity log.
    </div>
  );

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="text-muted-foreground flex h-40 items-center justify-center text-sm">
          Loading messages...
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full">
        <CardContent className="text-muted-foreground flex h-40 items-center justify-center text-sm">
          Failed to load this thread.
        </CardContent>
      </Card>
    );
  }

  if (messages.length === 0) {
    return (
      <Card className="flex h-[760px] w-full flex-col overflow-hidden">
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16">
          <IconMessageCircle className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">
            Nobody has written in this conversation.
          </p>
        </div>
        {footer}
      </Card>
    );
  }

  return (
    <Card className="flex h-[760px] w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b px-5 py-3">
        <span className="font-semibold uppercase">Conversation</span>
        <div className="text-muted-foreground ml-auto flex items-center gap-3 text-[11px]">
          {/* The legend earns its place: the highlight is the whole reason this
              screen looks different from the two people's own. */}
          <span className="hidden items-center gap-1.5 sm:flex">
            <mark className="size-3 rounded-sm bg-amber-300" />
            Withheld from the recipient
          </span>
          <span className="text-xs">
            {total} message{total === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Chat area */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <ChatDoodleBg />
        <CardContent
          className="absolute inset-0 flex flex-col gap-4 overflow-y-auto p-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {hasOlder && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void loadOlder()}
                disabled={isLoadingOlder}
              >
                {isLoadingOlder && <Spinner className="mr-2 size-3" />}
                Earlier messages
              </Button>
            </div>
          )}

          {messages.map((message, index) => {
            const previous = messages[index - 1];
            const newDay =
              !previous ||
              dayKey(previous.createdAt) !== dayKey(message.createdAt);

            return (
              <Fragment key={message.id}>
                {newDay && (
                  <div className="flex justify-center">
                    <span className="bg-background/80 text-muted-foreground rounded-md px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
                      {dayHeading(new Date(message.createdAt))}
                    </span>
                  </div>
                )}
                <AdminMessageBubble message={message} />
              </Fragment>
            );
          })}
          <div ref={bottomRef} />
        </CardContent>
      </div>

      {footer}
    </Card>
  );
}
