import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconMessageCircle, IconSend } from "@tabler/icons-react";
import { toast } from "sonner";
import { cn } from "#/lib/utils";
import { messageSenderLabel } from "#/lib/message-sender-label";
import { scrollToBottom } from "#/lib/scroll-to-bottom";
import { Card, CardContent } from "#/components/ui/card";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import {
  getProfileMessages,
  getProfileWhatsAppWindow,
  sendProfileMessage,
  type AdminProfileMessage,
  type MessageChannel,
} from "#/lib/api/profiles-controller";
import { useRole } from "#/hooks/use-role";
import { WhatsAppWindowBadge } from "#/components/whatsapp-window-badge";
import {
  flattenForTemplateVariable,
  ADMIN_MESSAGE_VAR_MAX,
} from "#/lib/whatsapp-template-text";
import { IconRobot, IconRobotOff } from "@tabler/icons-react";
import { MessageExportMenu } from "#/features/profiles/components/message-export-menu";
import { ChatDoodleBg } from "./chat-doodle-bg";
import { QuickMessagePicker } from "#/components/quick-message-picker";
import { friendlyError } from "#/lib/api/friendly-error";

type Props = {
  profileId: string;
  profileName: string;
  /** Narrows the template list to the ones that fit this recipient. */
  profileType?: string | null;
  /** Fills `{{prenom}}` in a picked template. */
  firstName?: string | null;
  /**
   * When VoVa goes quiet for this profile, or null. A DEADLINE — a date in the
   * past means the pause lapsed and the bot is answering again.
   */
  botPausedUntil?: string | null;
  onBotPausedChange?: (paused: boolean) => void;
  isTogglingBotPause?: boolean;
};

function formatTime(v: string) {
  try {
    return new Date(v).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return v;
  }
}

export function ProfileMessagesContent({
  profileId,
  profileName,
  profileType,
  firstName,
  botPausedUntil,
  onBotPausedChange,
  isTogglingBotPause,
}: Readonly<Props>) {
  // Judged against the clock, not on the field being set: the column is only
  // cleared when somebody toggles it off, so a lapsed pause still has a date
  // in it and would otherwise read as "paused" for ever.
  const botPaused = !!botPausedUntil && new Date(botPausedUntil) > new Date();
  const queryClient = useQueryClient();
  const { canManageContent } = useRole();
  const [channel, setChannel] = useState<MessageChannel>("EMAIL");
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const isWhatsApp = channel === "WHATSAPP";

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin", "profiles", profileId, "messages"],
    queryFn: () => getProfileMessages(profileId),
  });

  // Not invalidated after a send: an outbound message does not move the window.
  const { data: windowState, isLoading: isWindowLoading } = useQuery({
    queryKey: ["admin", "profiles", profileId, "whatsapp-window"],
    queryFn: () => getProfileWhatsAppWindow(profileId),
    enabled: isWhatsApp,
    staleTime: 60_000,
  });

  // Outside the 24h window the message travels as a template variable, which
  // Meta caps and which grows when line breaks are flattened — so the count that
  // matters is of the flattened text, not what is in the textarea.
  const isTemplateMode = isWhatsApp && windowState?.mode === "TEMPLATE";
  const flattenedLength = isTemplateMode
    ? flattenForTemplateVariable(text).length
    : 0;
  const isOverTemplateLimit = flattenedLength > ADMIN_MESSAGE_VAR_MAX;

  const { mutate: send, isPending } = useMutation({
    mutationFn: () => sendProfileMessage(profileId, channel, text.trim()),
    onSuccess: (result) => {
      setText("");
      toast.success(
        result.deliveryMode === "TEMPLATE"
          ? "Message sent via approved template."
          : "Message sent successfully.",
      );
      queryClient.invalidateQueries({
        queryKey: ["admin", "profiles", profileId, "messages"],
      });
      setTimeout(
        () => scrollToBottom(bottomRef.current, "smooth"),
        100,
      );
    },
    onError: (error) => {
      toast.error(friendlyError(error, "Couldn't send the message. Try again."));
    },
  });

  useEffect(() => {
    scrollToBottom(bottomRef.current, "instant");
  }, [messages]);

  const canSend =
    text.trim().length > 0 && !isPending && !isOverTemplateLimit;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSend) {
      send();
    }
  };

  const inputArea = (
    <div className="border-t bg-background px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-1 py-1 text-xs">
          <span className="px-2 text-muted-foreground">Channel</span>
          <div className="inline-flex rounded-full bg-background p-0.5">
            <Button
              type="button"
              size="xs"
              variant={channel === "WHATSAPP" ? "default" : "ghost"}
              className="rounded-full px-3 text-[11px]"
              onClick={() => setChannel("WHATSAPP")}
            >
              WhatsApp
            </Button>
            <Button
              type="button"
              size="xs"
              variant={channel === "EMAIL" ? "default" : "ghost"}
              className="rounded-full px-3 text-[11px]"
              onClick={() => setChannel("EMAIL")}
            >
              Email
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isWhatsApp && (
            <WhatsAppWindowBadge
              state={windowState}
              isLoading={isWindowLoading}
            />
          )}
          {isTemplateMode && (
            <span
              className={cn(
                "text-[11px] tabular-nums",
                isOverTemplateLimit
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {flattenedLength}/{ADMIN_MESSAGE_VAR_MAX}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground hidden sm:block">
            Ctrl+Enter to send
          </span>
        </div>
      </div>
      {canManageContent && (
        <div className="mt-1 space-y-2">
          <div className="flex justify-end">
            {/* Same templates as the header's quick message, so the wording a
                worker receives does not depend on where the admin started. */}
            <QuickMessagePicker
              profileType={profileType}
              firstName={firstName}
              onPick={setText}
              disabled={isPending}
            />
          </div>
          <div className="flex items-end gap-2 rounded-xl border bg-muted/40 px-3 py-2">
          <Textarea
            className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[72px]"
            placeholder="Write a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending}
          />
          <Button
            size="icon"
            className="shrink-0 h-9 w-9 rounded-full"
            onClick={() => send()}
            disabled={!canSend}
          >
            <IconSend className="size-4" />
          </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex h-40 items-center justify-center text-muted-foreground text-sm">
          Loading messages...
        </CardContent>
      </Card>
    );
  }

  if (messages.length === 0) {
    return (
      <Card className="w-full flex flex-col overflow-hidden h-[760px]">
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16">
          <IconMessageCircle className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">
            No messages yet. Start the conversation below.
          </p>
        </div>
        {inputArea}
      </Card>
    );
  }

  return (
    <Card className="w-full flex flex-col overflow-hidden h-[760px]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-5 py-3 shrink-0">
        <span className="font-semibold uppercase">Messages</span>
        {onBotPausedChange && (
          <BotPauseToggle
            paused={botPaused}
            disabled={!!isTogglingBotPause}
            onChange={onBotPausedChange}
          />
        )}
        <span className="text-muted-foreground text-xs ml-auto">
          {messages.length} message{messages.length === 1 ? "" : "s"}
        </span>
        <MessageExportMenu messages={messages} profileName={profileName} />
      </div>

      {/* Chat area */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <ChatDoodleBg />
        <CardContent className="absolute inset-0 flex flex-col gap-4 p-5 overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              profileName={profileName}
            />
          ))}
          <div ref={bottomRef} />
        </CardContent>
      </div>

      {/* Input */}
      {inputArea}
    </Card>
  );
}

function MessageBubble({
  message,
  profileName,
}: Readonly<{
  message: AdminProfileMessage;
  profileName: string;
}>) {
  const isOutbound = message.direction === "OUTBOUND";

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1",
        isOutbound ? "items-end" : "items-start",
      )}
    >
      <span className="text-xs text-muted-foreground px-1">
        {messageSenderLabel(message, profileName)}
      </span>
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          isOutbound
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm",
        )}
      >
        {message.body}
      </div>
      <span className="text-[11px] text-muted-foreground px-1">
        {formatTime(message.createdAt)}
      </span>
    </div>
  );
}

/**
 * "I'm answering this one — VoVa, stay out of it."
 *
 * Beside the title rather than in the Actions menu, because the decision is
 * made while looking at the conversation, and a control you have to go hunting
 * for is one nobody remembers exists.
 *
 * Deliberately states what is true right now rather than what the click will
 * do. A switch labelled with its own action ("Disable VoVa") is ambiguous the
 * moment you look away and come back.
 */
function BotPauseToggle({
  paused,
  disabled,
  onChange,
}: Readonly<{
  paused: boolean;
  disabled: boolean;
  onChange: (paused: boolean) => void;
}>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!paused)}
      title={
        paused
          ? "VoVa is not replying to this profile. Click to hand the conversation back."
          : "VoVa is replying to this profile. Click to answer it yourself."
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        paused
          ? "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400"
          : "bg-muted text-muted-foreground hover:bg-muted/70",
      )}
    >
      {paused ? (
        <IconRobotOff className="size-3.5" />
      ) : (
        <IconRobot className="size-3.5" />
      )}
      {paused ? "VoVa off" : "VoVa on"}
    </button>
  );
}
