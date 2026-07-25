import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  IconPaperclip,
  IconSend,
  IconX,
  IconChecks,
  IconCheck,
  IconUsers,
  IconLogout,
  IconUserMinus,
  IconUserPlus,
} from "@tabler/icons-react";

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
  useAddMembers,
  useRemoveMember,
} from "#/hooks/use-chat";
import type {
  ChatAttachment,
  ChatConversationItem,
} from "#/lib/api/chat-controller";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "#/components/ui/sheet";
import { ChatDoodleBg } from "#/pages/profile-detail/components/chat-doodle-bg";
import {
  NewConversationDialog,
  UserSearch,
  type PickUser,
} from "./new-conversation-dialog";

/** Same-day grouping key for the date separators in a thread. */
function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year:
      d.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

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

  return (
    <section className="flex flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b px-5 py-3">
        <Avatar className="size-9">
          <AvatarFallback>{initials(title)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{title}</div>
          <div className="truncate text-xs text-muted-foreground">
            {isGroup
              ? conversation.participants
                  .map((p) => p.name.split(/\s+/)[0])
                  .join(", ")
              : "Direct message"}
          </div>
        </div>
        {isGroup && (
          <GroupMembersSheet conversation={conversation} meId={meId} />
        )}
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden text-foreground">
        <ChatDoodleBg />
        <div className="absolute inset-0 flex flex-col gap-1 overflow-y-auto p-5 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {messages.map((m, i) => {
            const mine = m.senderId === meId;
            const prev = messages[i - 1];
            const newDay =
              !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
            // Group consecutive messages from the same sender: only the first
            // shows the sender's name + the squared "tail" corner.
            const startOfGroup =
              newDay || !prev || prev.senderId !== m.senderId;
            const seen =
              mine &&
              conversation.participants.some(
                (p) =>
                  p.userId !== meId &&
                  p.lastReadAt &&
                  p.lastReadAt >= m.createdAt,
              );
            return (
              <div key={m.id}>
                {newDay && (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-md bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                      {dayLabel(m.createdAt)}
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "flex w-full flex-col gap-1",
                    mine ? "items-end" : "items-start",
                    startOfGroup ? "mt-2" : "mt-0.5",
                  )}
                >
                  {startOfGroup && isGroup && !mine && (
                    <span className="px-1 text-xs text-muted-foreground">
                      {m.senderName}
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                      startOfGroup &&
                        (mine ? "rounded-tr-sm" : "rounded-tl-sm"),
                    )}
                  >
                    {m.deletedAt ? (
                      <em className="opacity-70">Message deleted</em>
                    ) : (
                      <>
                        {m.attachments.map((a) => (
                          <Attachment key={a.key} attachment={a} />
                        ))}
                        {m.body && (
                          <span className="whitespace-pre-wrap break-words">
                            {m.body}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <span className="flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
                    {m.editedAt ? "edited · " : ""}
                    {formatTime(m.createdAt)}
                    {mine &&
                      !m.deletedAt &&
                      (seen ? (
                        <IconChecks className="size-3.5 text-primary" />
                      ) : (
                        <IconCheck className="size-3.5" />
                      ))}
                  </span>
                </div>
              </div>
            );
          })}
          {typingNames.length > 0 && (
            <div className="mt-2 flex justify-start">
              <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-xs italic text-muted-foreground">
                {typingNames.join(", ")}{" "}
                {typingNames.length === 1 ? "is" : "are"} typing…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

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

function GroupMembersSheet({
  conversation,
  meId,
}: Readonly<{ conversation: ChatConversationItem; meId?: string }>) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const addMembers = useAddMembers(conversation.id);
  const removeMember = useRemoveMember(conversation.id);
  const isTeam = conversation.isTeam;
  const members = conversation.participants;
  const memberIds = members.map((m) => m.userId);

  const add = async (user: PickUser) => {
    try {
      await addMembers.mutateAsync([user.id]);
      setAdding(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async (userId: string, self: boolean) => {
    try {
      await removeMember.mutateAsync(userId);
      if (self) setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setAdding(false);
      }}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        title="Group info"
        onClick={() => setOpen(true)}
      >
        <IconUsers className="size-5" />
      </Button>
      <SheetContent
        side="right"
        className="w-3/4 gap-0 p-0 sm:w-1/4 sm:max-w-none"
      >
        {/* Group identity */}
        <SheetHeader className="items-center gap-2 border-b bg-muted/30 py-6 text-center">
          <Avatar className="size-20">
            <AvatarFallback className="text-2xl">
              {initials(conversation.name ?? "Group")}
            </AvatarFallback>
          </Avatar>
          <SheetTitle className="text-lg">
            {conversation.name ?? "Group"}
          </SheetTitle>
          <span className="text-xs text-muted-foreground">
            {isTeam ? "Team channel · " : "Group · "}
            {members.length} members
          </span>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {/* Add members */}
          {!isTeam && (
            <div className="border-b p-4">
              {adding ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Add members</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setAdding(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <UserSearch
                    meId={meId}
                    selectedIds={[]}
                    excludeIds={memberIds}
                    onPick={add}
                  />
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setAdding(true)}
                >
                  <IconUserPlus className="size-4" />
                  Add member
                </Button>
              )}
            </div>
          )}

          {isTeam && (
            <p className="border-b bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              The Team channel syncs automatically with all active team members,
              so its membership can’t be edited here.
            </p>
          )}

          {/* Members list */}
          <div className="p-2">
            <p className="px-2 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {members.length} members
            </p>
            <div className="space-y-0.5">
              {members.map((m) => {
                const self = m.userId === meId;
                return (
                  <div
                    key={m.userId}
                    className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60"
                  >
                    <Avatar className="size-10 shrink-0">
                      <AvatarFallback>{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {m.name}
                        {self && (
                          <span className="text-muted-foreground"> (You)</span>
                        )}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {m.role}
                      </span>
                    </div>
                    {!isTeam && !self && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-auto text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        title={`Remove ${m.name}`}
                        disabled={removeMember.isPending}
                        onClick={() => void remove(m.userId, false)}
                      >
                        <IconUserMinus className="size-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Leave */}
        {!isTeam && (
          <div className="border-t p-4">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={removeMember.isPending}
              onClick={() => meId && void remove(meId, true)}
            >
              <IconLogout className="size-4" />
              Leave group
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
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
