import { useState } from "react";
import { toast } from "sonner";
import {
  IconMessagePlus,
  IconUsersGroup,
  IconSearch,
  IconX,
  IconCheck,
  IconPlus,
} from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { cn } from "#/lib/utils";
import { useAdminMe } from "#/hooks/use-admin-me";
import { getUsersList } from "#/lib/api/users-controller";
import { useCreateDirect, useCreateGroup } from "#/hooks/use-chat";

export type PickUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Debounced-ish searchable user list, searching name + email (like Events). */
export function UserSearch({
  meId,
  selectedIds,
  excludeIds = [],
  onPick,
}: Readonly<{
  meId?: string;
  selectedIds: string[];
  excludeIds?: string[];
  onPick: (user: PickUser) => void;
}>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickUser[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getUsersList({ q: value.trim(), limit: 8 });
      setResults(
        res.data
          .filter((u) => u.id !== meId && !excludeIds.includes(u.id))
          .map((u) => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`.trim(),
            email: u.email,
            role: u.role,
          })),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 transition-colors focus-within:border-ring focus-within:bg-transparent">
        <IconSearch className="size-4 shrink-0 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => void runSearch(e.target.value)}
          className="h-7 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {loading && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        )}
        {!loading && query.trim().length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Type to search team members.
          </p>
        )}
        {!loading && query.trim().length > 0 && results.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No members found.
          </p>
        )}
        {results.map((u) => {
          const isSelected = selectedIds.includes(u.id);
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => onPick(u)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent",
                isSelected && "bg-accent",
              )}
            >
              <IconCheck
                className={cn(
                  "size-4 shrink-0",
                  isSelected ? "opacity-100" : "opacity-0",
                )}
              />
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {initials(u.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{u.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {u.email}
                </span>
              </div>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {u.role}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Props = Readonly<{ onCreated: (conversationId: string) => void }>;

export function NewConversationDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const { data: me } = useAdminMe();
  const createDirect = useCreateDirect();
  const createGroup = useCreateGroup();

  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<PickUser[]>([]);

  const reset = () => {
    setGroupName("");
    setMembers([]);
  };

  const startDirect = async (user: PickUser) => {
    try {
      const convo = await createDirect.mutateAsync(user.id);
      setOpen(false);
      reset();
      onCreated(convo.id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleMember = (user: PickUser) =>
    setMembers((prev) =>
      prev.some((m) => m.id === user.id)
        ? prev.filter((m) => m.id !== user.id)
        : [...prev, user],
    );

  const startGroup = async () => {
    if (!groupName.trim() || members.length === 0) {
      toast.error("Name the group and add at least one member.");
      return;
    }
    try {
      const convo = await createGroup.mutateAsync({
        name: groupName.trim(),
        memberIds: members.map((m) => m.id),
      });
      setOpen(false);
      reset();
      onCreated(convo.id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <Button
        size="icon"
        variant="secondary"
        className="size-8 rounded-full"
        onClick={() => setOpen(true)}
        aria-label="New conversation"
        title="New conversation"
      >
        <IconPlus className="size-5" />
      </Button>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="space-y-0 border-b bg-muted/30 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
              <IconMessagePlus className="size-5" />
            </div>
            <div className="space-y-0.5 text-left">
              <DialogTitle className="text-lg leading-tight">
                New conversation
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Start a direct message or create a group with your team.
              </p>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="direct" className="p-5">
          <TabsList className="grid w-full grid-cols-2 rounded-lg bg-muted p-1">
            <TabsTrigger value="direct" className="gap-1.5 rounded-md">
              <IconMessagePlus className="size-4" /> Direct
            </TabsTrigger>
            <TabsTrigger value="group" className="gap-1.5 rounded-md">
              <IconUsersGroup className="size-4" /> Group
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="pt-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Pick a team member to start a 1:1 chat.
            </p>
            <UserSearch meId={me?.id} selectedIds={[]} onPick={startDirect} />
          </TabsContent>

          <TabsContent value="group" className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <IconUsersGroup className="size-5" />
              </div>
              <Input
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="h-10"
              />
            </div>

            {members.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {members.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pl-1 pr-2 text-xs font-medium text-primary"
                  >
                    <Avatar className="size-5">
                      <AvatarFallback className="bg-primary/20 text-[9px] text-primary">
                        {initials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    {m.name}
                    <button
                      type="button"
                      className="rounded-full hover:bg-primary/20"
                      onClick={() => toggleMember(m)}
                    >
                      <IconX className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                Add members
              </p>
              <UserSearch
                meId={me?.id}
                selectedIds={members.map((m) => m.id)}
                onPick={toggleMember}
              />
            </div>

            <Button
              className="w-full gap-1.5"
              onClick={() => void startGroup()}
              disabled={createGroup.isPending || !groupName.trim() || members.length === 0}
            >
              <IconUsersGroup className="size-4" />
              Create group{members.length > 0 ? ` · ${members.length}` : ""}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
