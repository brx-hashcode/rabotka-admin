import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";
import { Send, ChevronsUpDown, Check, SearchIcon, Paperclip, X } from "lucide-react";
import { useId, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getProfilesList,
  sendProfileMessage,
  type AdminProfileListItem,
} from "#/lib/api/profiles-controller";
import { IconSend } from "@tabler/icons-react";
import { useRole } from "#/hooks/use-role";

type Channel = "WHATSAPP" | "EMAIL";

export const DirectMessagesButton = ({
  className,
}: Readonly<{ className?: string }>) => {
  const { canManageContent } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] =
    useState<AdminProfileListItem | null>(null);
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const messageId = useId();

  const { data: searchResults = [] } = useQuery({
    queryKey: ["admin", "profiles", "dm-search", search],
    queryFn: () => getProfilesList({ q: search, limit: 8 }).then((r) => r.data),
    enabled: search.trim().length >= 1,
    staleTime: 10_000,
  });

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
    onSuccess: () => {
      toast.success("Message sent successfully.");
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const canSend = !!selectedProfile && text.trim().length > 0 && !isPending;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSend) send();
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedProfile(null);
    setSearch("");
    setText("");
    setChannel("EMAIL");
    setComboOpen(false);
    setAttachments([]);
  };

  if (!canManageContent) return null;

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
            {/* Profile dropdown */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium" id="dm-recipient-label">
                Recipient
              </span>
              <DropdownMenu open={comboOpen} onOpenChange={setComboOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboOpen}
                    aria-labelledby="dm-recipient-label"
                    className="w-full justify-between font-normal"
                  >
                    {selectedProfile
                      ? `${selectedProfile.firstName} ${selectedProfile.lastName}`
                      : "Search by name, email or phone…"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-(--radix-dropdown-menu-trigger-width)"
                >
                  <DropdownMenuLabel className="font-normal p-0">
                    <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5">
                      <SearchIcon
                        className="text-muted-foreground size-4 shrink-0"
                        aria-hidden
                      />
                      <Input
                        placeholder="Search profiles…"
                        className="placeholder:text-muted-foreground h-7 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onPointerDown={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {search.trim().length === 0 && (
                    <p className="text-muted-foreground px-3 py-4 text-center text-sm">
                      Type to search profiles.
                    </p>
                  )}
                  {search.trim().length > 0 && searchResults.length === 0 && (
                    <p className="text-muted-foreground px-3 py-4 text-center text-sm">
                      No profiles found.
                    </p>
                  )}
                  {searchResults.map((profile) => (
                    <DropdownMenuItem
                      key={profile.id}
                      className="flex cursor-pointer items-center gap-2 py-1.5 pl-2 pr-2"
                      onSelect={() => {
                        setSelectedProfile(profile);
                        setComboOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selectedProfile?.id === profile.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {profile.firstName} {profile.lastName}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {profile.email} · {profile.phone}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Channel selector */}
            <fieldset className="flex flex-col gap-1.5 border-0 p-0 m-0">
              <legend className="text-sm font-medium">Channel</legend>
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
            </fieldset>

            {/* Message textarea */}
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-center justify-between">
                <label htmlFor={messageId} className="text-sm font-medium">
                  Message
                </label>
                <span className="text-[11px] text-muted-foreground hidden sm:block">
                  Ctrl+Enter to send
                </span>
              </div>
              <div className="flex items-end gap-2 rounded-xl border bg-muted/40 px-2 py-1 flex-1 min-h-[120px]">
                <Textarea
                  id={messageId}
                  className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-h-[100px] p-1"
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
