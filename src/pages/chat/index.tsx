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
} from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
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
  NewConversationDialog,
  UserSearch,
  type PickUser,
} from "./new-conversation-dialog";

/** WhatsApp-style scattered doodle tile, drawn once and reused as a background.
 *  Neutral gray strokes at low opacity read well over both the light and dark
 *  chat canvases. */
const DOODLE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320' viewBox='0 0 320 320'><g fill='none' stroke='%23667781' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M28 40h34a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H44l-10 9v-9h-6a6 6 0 0 1-6-6V46a6 6 0 0 1 6-6z'/><path d='M168 34c-8-9-22-3-22 8 0 9 12 16 22 24 10-8 22-15 22-24 0-11-14-17-22-8z'/><circle cx='268' cy='52' r='20'/><path d='M260 50a3 3 0 0 0 6 0M270 50a3 3 0 0 0 6 0M260 60c4 5 12 5 16 0'/><rect x='36' y='150' width='52' height='38' rx='6'/><circle cx='62' cy='169' r='9'/><path d='M46 150l6-9h20l6 9'/><path d='M176 200v-44l30-6v44'/><circle cx='170' cy='202' r='7'/><circle cx='200' cy='196' r='7'/><path d='M278 168l4 12 12 1-9 8 3 12-10-7-10 7 3-12-9-8 12-1z'/><rect x='30' y='250' width='48' height='34' rx='4'/><path d='M30 254l24 16 24-16'/><circle cx='168' cy='266' r='22'/><path d='M168 252v14l10 6'/><path d='M250 258h40M250 270h30M250 282h36'/></g></svg>`;

const WHATSAPP_BG = `url("data:image/svg+xml,${DOODLE_SVG}")`;

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
      <header className="flex items-center gap-3 border-b bg-[#f0f2f5] p-3 dark:bg-[#202c33]">
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
          <GroupMembersDialog conversation={conversation} meId={meId} />
        )}
      </header>

      <div className="relative flex-1 overflow-hidden bg-[#efeae2] dark:bg-[#0b141a]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.05]"
          style={{ backgroundImage: WHATSAPP_BG, backgroundRepeat: "repeat" }}
        />
        <div className="relative h-full space-y-1 overflow-y-auto px-4 py-4 md:px-[6%]">
          {messages.map((m, i) => {
            const mine = m.senderId === meId;
            const prev = messages[i - 1];
            const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
            // Group consecutive messages from the same sender: only the first
            // gets a tail + (in groups) the sender name.
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
                    <span className="rounded-md bg-white/80 px-3 py-1 text-[11px] font-medium text-[#54656f] shadow-sm dark:bg-[#182229] dark:text-[#8696a0]">
                      {dayLabel(m.createdAt)}
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "flex",
                    mine ? "justify-end" : "justify-start",
                    startOfGroup ? "mt-2" : "mt-0.5",
                  )}
                >
                  <div
                    className={cn(
                      "relative max-w-[75%] rounded-lg px-2.5 py-1.5 text-sm shadow-sm md:max-w-[65%]",
                      mine
                        ? "bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]"
                        : "bg-white text-[#111b21] dark:bg-[#202c33] dark:text-[#e9edef]",
                      startOfGroup &&
                        (mine ? "rounded-tr-none" : "rounded-tl-none"),
                    )}
                  >
                    {startOfGroup && (
                      <span
                        className={cn(
                          "absolute top-0 h-3 w-2 overflow-hidden",
                          mine ? "-right-2" : "-left-2",
                        )}
                        aria-hidden
                      >
                        <span
                          className={cn(
                            "absolute top-0 block size-3 rotate-45",
                            mine
                              ? "-left-1 bg-[#d9fdd3] dark:bg-[#005c4b]"
                              : "-right-1 bg-white dark:bg-[#202c33]",
                          )}
                        />
                      </span>
                    )}
                    {isGroup && !mine && startOfGroup && (
                      <div className="mb-0.5 text-xs font-semibold text-[#1f9d55] dark:text-[#53bdeb]">
                        {m.senderName}
                      </div>
                    )}
                    {m.deletedAt ? (
                      <em className="opacity-60">Message deleted</em>
                    ) : (
                      <>
                        {m.attachments.map((a) => (
                          <Attachment key={a.key} attachment={a} />
                        ))}
                        {m.body && (
                          <span className="whitespace-pre-wrap break-words align-bottom">
                            {m.body}
                          </span>
                        )}
                      </>
                    )}
                    {/* time + ticks, floated bottom-right WhatsApp-style */}
                    <span className="float-right ml-2 mt-1 inline-flex translate-y-0.5 items-center gap-0.5 text-[10px] text-[#667781] dark:text-[#8696a0]">
                      {m.editedAt ? "edited " : ""}
                      {formatTime(m.createdAt)}
                      {mine &&
                        !m.deletedAt &&
                        (seen ? (
                          <IconChecks className="size-3.5 text-[#53bdeb]" />
                        ) : (
                          <IconCheck className="size-3.5" />
                        ))}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {typingNames.length > 0 && (
            <div className="mt-2 flex justify-start">
              <div className="rounded-lg rounded-tl-none bg-white px-3 py-2 text-xs italic text-[#667781] shadow-sm dark:bg-[#202c33] dark:text-[#8696a0]">
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

function GroupMembersDialog({
  conversation,
  meId,
}: Readonly<{ conversation: ChatConversationItem; meId?: string }>) {
  const [open, setOpen] = useState(false);
  const addMembers = useAddMembers(conversation.id);
  const removeMember = useRemoveMember(conversation.id);
  const isTeam = conversation.isTeam;
  const members = conversation.participants;
  const memberIds = members.map((m) => m.userId);

  const add = async (user: PickUser) => {
    try {
      await addMembers.mutateAsync([user.id]);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        title="Members"
        onClick={() => setOpen(true)}
      >
        <IconUsers className="size-5" />
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {conversation.name ?? "Group"} · {members.length} members
          </DialogTitle>
        </DialogHeader>

        {isTeam && (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            The Team channel syncs automatically with all active team members,
            so its membership can’t be edited here.
          </p>
        )}

        <div className="max-h-56 space-y-1 overflow-y-auto">
          {members.map((m) => {
            const self = m.userId === meId;
            return (
              <div
                key={m.userId}
                className="flex items-center gap-2 rounded-md px-2 py-1.5"
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {initials(m.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {m.name}
                    {self && " (You)"}
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
                    className="ml-auto text-muted-foreground hover:text-destructive"
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

        {!isTeam && (
          <>
            <div className="border-t pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Add members
              </p>
              <UserSearch
                meId={meId}
                selectedIds={[]}
                excludeIds={memberIds}
                onPick={add}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-1.5 text-destructive hover:text-destructive"
              disabled={removeMember.isPending}
              onClick={() => meId && void remove(meId, true)}
            >
              <IconLogout className="size-4" />
              Leave group
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
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
