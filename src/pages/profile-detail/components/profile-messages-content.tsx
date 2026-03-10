import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconMessageCircle, IconSend } from "@tabler/icons-react";
import { toast } from "sonner";
import { cn } from "#/lib/utils";
import { Card, CardContent } from "#/components/ui/card";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import {
  getProfileMessages,
  sendProfileMessage,
  type AdminProfileMessage,
} from "#/lib/api/profiles-controller";

type Channel = "WHATSAPP" | "EMAIL";

type Props = {
  profileId: string;
  profileName: string;
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
}: Readonly<Props>) {
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin", "profiles", profileId, "messages"],
    queryFn: () => getProfileMessages(profileId),
  });

  const { mutate: send, isPending } = useMutation({
    mutationFn: () => sendProfileMessage(profileId, channel, text.trim()),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({
        queryKey: ["admin", "profiles", profileId, "messages"],
      });
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    },
    onError: () => {
      toast.error("Failed to send message.");
    },
  });

  const canSend = text.trim().length > 0 && !isPending;

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
        <span className="text-[11px] text-muted-foreground hidden sm:block">
          Ctrl+Enter to send
        </span>
      </div>
      <div className="mt-1 flex items-end gap-2 rounded-xl border bg-muted/40 px-3 py-2">
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
        <span className="text-muted-foreground text-xs ml-auto">
          {messages.length} message{messages.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Chat area */}
      <CardContent className="flex flex-col gap-4 p-5 overflow-y-auto flex-1 min-h-0">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} profileName={profileName} />
        ))}
        <div ref={bottomRef} />
      </CardContent>

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
        {isOutbound ? "System" : profileName}
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
