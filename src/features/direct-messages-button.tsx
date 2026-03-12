import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";
import { Send, ChevronsUpDown, Check } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "#/components/ui/command";
import { Textarea } from "#/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getProfilesList,
  sendProfileMessage,
  type AdminProfileListItem,
} from "#/lib/api/profiles-controller";
import { IconSend } from "@tabler/icons-react";

type Channel = "WHATSAPP" | "EMAIL";

export const DirectMessagesButton = ({
  className,
}: Readonly<{ className?: string }>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] =
    useState<AdminProfileListItem | null>(null);
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [text, setText] = useState("");

  const { data: searchResults = [] } = useQuery({
    queryKey: ["admin", "profiles", "dm-search", search],
    queryFn: () => getProfilesList({ q: search, limit: 8 }).then((r) => r.data),
    enabled: search.trim().length >= 1,
    staleTime: 10_000,
  });

  const { mutate: send, isPending } = useMutation({
    mutationFn: () => {
      if (!selectedProfile) throw new Error("No profile selected");
      return sendProfileMessage(selectedProfile.id, channel, text.trim());
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
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn("h-9 justify-start gap-2 px-3 cursor-pointer", className)}
        variant="default"
      >
        <Send className="size-4" />
        <span>Quick messages</span>
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
            {/* Profile combobox */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Recipient</label>
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedProfile
                      ? `${selectedProfile.firstName} ${selectedProfile.lastName}`
                      : "Search by name, email or phone…"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) p-0"
                  align="start"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search profiles…"
                      value={search}
                      onValueChange={setSearch}
                    />
                    <CommandList>
                      {search.trim().length === 0 && (
                        <CommandEmpty>Type to search profiles.</CommandEmpty>
                      )}
                      {search.trim().length > 0 &&
                        searchResults.length === 0 && (
                          <CommandEmpty>No profiles found.</CommandEmpty>
                        )}
                      {searchResults.length > 0 && (
                        <CommandGroup>
                          {searchResults.map((profile) => (
                            <CommandItem
                              key={profile.id}
                              value={profile.id}
                              onSelect={() => {
                                setSelectedProfile(profile);
                                setComboOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedProfile?.id === profile.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {profile.firstName} {profile.lastName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {profile.email} · {profile.phone}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Channel selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Channel</label>
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
            </div>

            {/* Message textarea */}
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Message</label>
                <span className="text-[11px] text-muted-foreground hidden sm:block">
                  Ctrl+Enter to send
                </span>
              </div>
              <div className="flex items-end gap-2 rounded-xl border bg-muted/40 px-2 py-1 flex-1 min-h-[120px]">
                <Textarea
                  className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-h-[100px] p-1"
                  placeholder="Write a message…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isPending}
                />
              </div>
            </div>
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
