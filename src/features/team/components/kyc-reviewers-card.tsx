import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconPlus, IconShieldCheck, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "#/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "#/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
import { Skeleton } from "#/components/ui/skeleton";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  getUsersList,
  setKycReviewer,
  type AdminUserListItem,
} from "#/lib/api/users-controller";
import { TEAM_ROLE_LABELS, labelOf } from "#/lib/status-labels";

/**
 * Roles that can verify KYC, so the only ones that may join the group.
 * Mirrors `KYC_REVIEWER_ROLES` in the backend, which enforces it.
 */
const KYC_REVIEWER_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "SUPPORT",
  "FINANCE",
]);

function fullName(u: AdminUserListItem): string {
  return `${u.firstName} ${u.lastName}`.trim();
}

/**
 * The KYC verification group: the few team members emailed each time a
 * profile is created, to review its documents. Picked person by person —
 * a role alone never puts anyone in it.
 */
export function KycReviewersCard({
  canManage,
}: Readonly<{ canManage: boolean }>) {
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);

  // The whole team, not the table's page: a member on page 2 is still a
  // member. 100 is the API's cap and well above the size of this team.
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", "kyc-group"],
    queryFn: () => getUsersList({ page: 1, limit: 100 }),
  });
  const team = data?.data ?? [];
  const members = team.filter((u) => u.kycReviewer);
  const candidates = team.filter(
    (u) => !u.kycReviewer && u.isActive && KYC_REVIEWER_ROLES.has(u.role),
  );

  const mutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      setKycReviewer(id, enabled),
    onSuccess: (user, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(
        enabled
          ? `${fullName(user)} joined the KYC verification group`
          : `${fullName(user)} left the KYC verification group`,
      );
    },
    onError: (error) => {
      toast.error(
        friendlyError(error, "Couldn't update the KYC verification group. Try again."),
      );
    },
  });

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5">
        <div className="flex min-w-0 items-start gap-3">
          <IconShieldCheck className="text-primary mt-0.5 size-5 shrink-0" />
          <div className="min-w-0 space-y-1">
            <CardTitle>KYC verification group</CardTitle>
            <CardDescription>
              These members get an email each time a profile is created, to
              review its identity documents.
            </CardDescription>
          </div>
        </div>

        {canManage && (
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger
              render={
                <Button size="sm" variant="outline" disabled={isLoading} />
              }
            >
              <IconPlus className="mr-1.5 size-4" />
              Add member
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0">
              <Command>
                <CommandInput placeholder="Search the team..." />
                <CommandList className="max-h-64">
                  <CommandEmpty>
                    No one else can join: only active Super admins, Admins,
                    Managers, Support and Finance can verify KYC.
                  </CommandEmpty>
                  <CommandGroup>
                    {candidates.map((u) => (
                      <CommandItem
                        key={u.id}
                        value={`${fullName(u)} ${u.email}`}
                        onSelect={() => {
                          mutation.mutate({ id: u.id, enabled: true });
                          setPickerOpen(false);
                        }}
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm">{fullName(u)}</span>
                          <span className="text-muted-foreground truncate text-xs">
                            {labelOf(TEAM_ROLE_LABELS, u.role)} · {u.email}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <CardContent className="px-6 pt-4 pb-5">
        {isLoading && <Skeleton className="h-12 w-full max-w-md rounded-lg" />}

        {!isLoading && members.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No one receives new-profile KYC emails yet.
            {canManage && " Add the people who will review them."}
          </p>
        )}

        {!isLoading && members.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {members.map((u) => (
              <li
                key={u.id}
                className="bg-muted/60 flex items-center gap-2.5 rounded-lg py-1.5 pr-1.5 pl-2"
              >
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {(u.firstName[0] ?? "").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-sm font-medium">
                    {fullName(u)}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {labelOf(TEAM_ROLE_LABELS, u.role)}
                    {!u.isActive && " · deactivated, not emailed"}
                  </span>
                </div>
                {canManage && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove ${fullName(u)} from the KYC verification group`}
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: u.id, enabled: false })}
                  >
                    <IconX className="size-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
