import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { IconPaperclip, IconSend, IconX } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { cn } from "#/lib/utils";
import { useAdminMe } from "#/hooks/use-admin-me";
import { useChatStore } from "#/stores/use-chat-store";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkRead,
  useUploadAttachment,
} from "#/hooks/use-chat";
import type {
  ChatAttachment,
  ChatConversationItem,
} from "#/lib/api/chat-controller";
import { NewConversationDialog } from "./new-conversation-dialog";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function conversationTitle(c: ChatConversationItem, meId?: string): string {
  if (c.type === "GROUP") return c.name ?? "Group";
  const other = c.participants.find((p) => p.userId !== meId);
  return other?.name ?? "Direct";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const { data: me } = useAdminMe();
  const meId = me?.id;
  const { data: conversations = [] } = useConversations();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const setActive = useChatStore((s) => s.setActiveConversation);
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);
  const typingByConversation = useChatStore((s) => s.typingByConversation);

  // Default to the first conversation (Team) once loaded.
  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  useEffect(() => {
    setActive(selectedId);
    return () => setActive(null);
  }, [selectedId, setActive]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-[calc(100vh-9rem)] overflow-hidden rounded-lg border">
      {/* Left: conversation list */}
      <aside className="flex w-72 shrink-0 flex-col border-r">
        <div className="flex items-center justify-between border-b p-3">
          <span className="font-semibold">Chat</span>
          <NewConversationDialog onCreated={setSelectedId} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => {
            const title = conversationTitle(c, meId);
            const other =
              c.type === "DIRECT"
                ? c.participants.find((p) => p.userId !== meId)
                : undefined;
            const online = other ? onlineUserIds.includes(other.userId) : false;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b px-3 py-2.5 text-left hover:bg-muted",
                  selectedId === c.id && "bg-muted",
                )}
              >
                <div className="relative">
                  <Avatar className="size-9">
                    <AvatarFallback>{initials(title)}</AvatarFallback>
                  </Avatar>
                  {other && (
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background",
                        online ? "bg-green-500" : "bg-muted-foreground/40",
                      )}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{title}</span>
                    {c.unreadCount > 0 && (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.lastMessage?.body ??
                      (c.lastMessage?.attachments.length
                        ? "📎 Attachment"
                        : "No messages yet")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right: thread */}
      {selected ? (
        <ChatThread
          key={selected.id}
          conversation={selected}
          meId={meId}
          typingUserIds={typingByConversation[selected.id] ?? []}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          Select a conversation
        </div>
      )}
    </div>
  );
}

function ChatThread({
  conversation,
  meId,
  typingUserIds,
}: Readonly<{
  conversation: ChatConversationItem;
  meId?: string;
  typingUserIds: string[];
}>) {
  const { data: page } = useMessages(conversation.id);
  const messages = page?.messages ?? [];
  const sendMessage = useSendMessage(conversation.id);
  const markRead = useMarkRead();
  const uploadAttachment = useUploadAttachment();
  const emitTyping = useChatStore((s) => s.emitTyping);

  const [text, setText] = useState("");
  const [pending, setPending] = useState<ChatAttachment[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isGroup = conversation.type === "GROUP";

  // Mark read on open and when new messages arrive while viewing.
  useEffect(() => {
    markRead.mutate(conversation.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, messages.length]);

  // Scroll to newest on message change.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const typingNames = useMemo(() => {
    const names = typingUserIds
      .map((id) => conversation.participants.find((p) => p.userId === id)?.name)
      .filter(Boolean) as string[];
    return names;
  }, [typingUserIds, conversation.participants]);

  const handleTyping = (value: string) => {
    setText(value);
    emitTyping(conversation.id, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(
      () => emitTyping(conversation.id, false),
      1500,
    );
  };

  const pickFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        const att = await uploadAttachment.mutateAsync(file);
        setPending((prev) => [...prev, att]);
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const send = async () => {
    const body = text.trim();
    if (!body && pending.length === 0) return;
    setText("");
    const attachments = pending;
    setPending([]);
    emitTyping(conversation.id, false);
    try {
      await sendMessage.mutateAsync({ body: body || undefined, attachments });
    } catch (e) {
      toast.error((e as Error).message);
      setText(body);
      setPending(attachments);
    }
  };

  const title = conversationTitle(conversation, meId);
  // "Seen by" for my last message = participants (excl. me) whose lastReadAt >= its createdAt.
  const myLast = [...messages].reverse().find((m) => m.senderId === meId);
  const seenBy = myLast
    ? conversation.participants
        .filter(
          (p) =>
            p.userId !== meId &&
            p.lastReadAt &&
            p.lastReadAt >= myLast.createdAt,
        )
        .map((p) => p.name)
    : [];

  return (
    <section className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b p-3">
        <Avatar className="size-8">
          <AvatarFallback>{initials(title)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">
            {isGroup
              ? `${conversation.participants.length} members`
              : "Direct message"}
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m) => {
          const mine = m.senderId === meId;
          return (
            <div
              key={m.id}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-lg px-3 py-2 text-sm",
                  mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {isGroup && !mine && (
                  <div className="mb-0.5 text-xs font-medium opacity-80">
                    {m.senderName}
                  </div>
                )}
                {m.deletedAt ? (
                  <em className="opacity-70">Message deleted</em>
                ) : (
                  <>
                    {m.body && <div className="whitespace-pre-wrap">{m.body}</div>}
                    {m.attachments.map((a) => (
                      <Attachment key={a.key} attachment={a} />
                    ))}
                  </>
                )}
                <div className="mt-0.5 text-right text-[10px] opacity-60">
                  {formatTime(m.createdAt)}
                  {m.editedAt ? " · edited" : ""}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {seenBy.length > 0 && (
        <div className="px-4 pb-1 text-right text-[11px] text-muted-foreground">
          Seen by {seenBy.join(", ")}
        </div>
      )}
      {typingNames.length > 0 && (
        <div className="px-4 pb-1 text-xs italic text-muted-foreground">
          {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"}{" "}
          typing…
        </div>
      )}

      {pending.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t px-4 py-2">
          {pending.map((a) => (
            <div
              key={a.key}
              className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
            >
              <IconPaperclip className="size-3" />
              <span className="max-w-32 truncate">{a.name}</span>
              <button
                type="button"
                onClick={() =>
                  setPending((prev) => prev.filter((x) => x.key !== a.key))
                }
              >
                <IconX className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 border-t p-3">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => void pickFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileRef.current?.click()}
          disabled={uploadAttachment.isPending}
        >
          <IconPaperclip className="size-5" />
        </Button>
        <Textarea
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Type a message…"
          className="max-h-32 min-h-10 flex-1 resize-none"
          rows={1}
        />
        <Button
          type="button"
          size="icon"
          onClick={() => void send()}
          disabled={sendMessage.isPending}
        >
          <IconSend className="size-5" />
        </Button>
      </div>
    </section>
  );
}

function Attachment({ attachment }: Readonly<{ attachment: ChatAttachment }>) {
  const isImage = attachment.mime.startsWith("image/");
  if (isImage) {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer">
        <img
          src={attachment.url}
          alt={attachment.name}
          className="mt-1 max-h-48 rounded-md"
        />
      </a>
    );
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="mt-1 flex items-center gap-1 underline"
    >
      <IconPaperclip className="size-3" />
      {attachment.name}
    </a>
  );
}
