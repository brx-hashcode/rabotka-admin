import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";
import { Send, Paperclip, X } from "lucide-react";
import { useId, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Textarea } from "#/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  sendProfileMessage,
  getProfileWhatsAppWindow,
  type AdminProfileListItem,
  type MessageChannel,
} from "#/lib/api/profiles-controller";
import { ProfileCombobox } from "#/components/profile-combobox";
import { IconSend } from "@tabler/icons-react";
import { useRole } from "#/hooks/use-role";
import { QuickMessagePicker } from "#/components/quick-message-picker";
import { WhatsAppWindowBadge } from "#/components/whatsapp-window-badge";
import {
  flattenForTemplateVariable,
  ADMIN_MESSAGE_VAR_MAX,
} from "#/lib/whatsapp-template-text";
import { friendlyError } from "#/lib/api/friendly-error";

export const DirectMessagesButton = ({
  className,
}: Readonly<{ className?: string }>) => {
  const { canEditArea } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] =
    useState<AdminProfileListItem | null>(null);
  const [channel, setChannel] = useState<MessageChannel>("EMAIL");
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const messageId = useId();

  const isWhatsApp = channel === "WHATSAPP";

  // Not invalidated after a send: an outbound message does not move the window.
  const { data: windowState, isLoading: isWindowLoading } = useQuery({
    queryKey: ["admin", "profiles", selectedProfile?.id, "whatsapp-window"],
    queryFn: () => getProfileWhatsAppWindow(selectedProfile!.id),
    enabled: isWhatsApp && !!selectedProfile,
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
    mutationFn: () => {
      if (!selectedProfile) throw new Error("No profile selected");
      return sendProfileMessage(
        selectedProfile.id,
        channel,
        text.trim(),
        channel === "EMAIL" ? attachments : undefined,
      );
    },
    onSuccess: (result) => {
      toast.success(
        result.deliveryMode === "TEMPLATE"
          ? "Message sent via approved template."
          : "Message sent successfully.",
      );
      handleClose();
    },
    onError: (error) => {
      toast.error(friendlyError(error, "Couldn't send the message. Try again."));
    },
  });

  const canSend =
    !!selectedProfile &&
    text.trim().length > 0 &&
    !isPending &&
    !isOverTemplateLimit;

  /** Appends the template so an already-typed message is never lost. */
  const applyTemplate = (message: string) => {
    setText((prev) => (prev.trim() ? `${prev.trimEnd()}\n\n${message}` : message));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSend) send();
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedProfile(null);
    setText("");
    setChannel("EMAIL");
    setAttachments([]);
  };

  // Ask about the area this button ACTS on, not the page it happens to sit on.
  // It sends a message to a profile (POST admin/profiles/:id/messages), so
  // `/profiles` is the question. Keyed off the current page it disappeared on
  // the dashboard and the audit log — pages nobody writes to — for every role
  // whose write access is decided per area rather than by seniority.
  if (!canEditArea("/profiles")) return null;

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn("h-9 justify-start gap-2 px-3 cursor-pointer", className)}
        variant="default"
      >
        <Send className="size-4" />
        <span>Quick message</span>
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent className="w-full sm:max-w-xl flex flex-col gap-0 p-0 max-h-[90vh]">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle>Send Quick Message</DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col gap-5 px-6 py-5 overflow-y-auto">
            <ProfileCombobox
              value={selectedProfile}
              onChange={setSelectedProfile}
              label="Recipient"
              placeholder="Search by name, email or phone…"
            />

            {/* Channel selector */}
            <fieldset className="flex flex-col gap-1.5 border-0 p-0 m-0">
              <legend className="text-sm font-medium">Channel</legend>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-1 py-1 text-xs w-fit">
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
                {isWhatsApp && selectedProfile && (
                  <WhatsAppWindowBadge
                    state={windowState}
                    isLoading={isWindowLoading}
                  />
                )}
              </div>
            </fieldset>

            {/* Message textarea */}
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={messageId} className="text-sm font-medium">
                  Message
                </label>
                <div className="flex items-center gap-2">
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
                  <QuickMessagePicker
                    profileType={selectedProfile?.profileType}
                    firstName={selectedProfile?.firstName}
                    onPick={applyTemplate}
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="flex items-end gap-2 rounded-xl border bg-muted/40 px-2 py-1 flex-1 min-h-65">
                <Textarea
                  id={messageId}
                  className="resize-y border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-h-60 p-1"
                  placeholder="Write a message…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Attachments — email only */}
            {channel === "EMAIL" && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">
                  Attachments{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional, max 5)
                  </span>
                </span>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors">
                  <Paperclip className="size-4 shrink-0" />
                  <span>Attach files</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    disabled={isPending}
                    onChange={(e) => {
                      const picked = Array.from(e.target.files ?? []);
                      if (attachments.length + picked.length > 5) {
                        toast.error("Maximum 5 attachments allowed");
                        return;
                      }
                      setAttachments((prev) => [...prev, ...picked]);
                      e.target.value = "";
                    }}
                  />
                </label>
                {attachments.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {attachments.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between rounded-md border px-3 py-1.5 text-xs"
                      >
                        <span className="truncate min-w-0">
                          {f.name}{" "}
                          <span className="text-muted-foreground">
                            ({(f.size / 1024).toFixed(0)} KB)
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachments((prev) =>
                              prev.filter((_, j) => j !== i),
                            )
                          }
                          className="ml-2 shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${f.name}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Send button */}
          <div className="px-6 py-4 border-t shrink-0">
            <Button
              className="w-full gap-2 cursor-pointer"
              onClick={() => send()}
              disabled={!canSend}
            >
              <IconSend className="size-4" />
              {isPending ? "Sending…" : "Send message"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
