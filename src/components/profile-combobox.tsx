import { useState } from "react";
import { Check, ChevronsUpDown, SearchIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  getProfilesList,
  type AdminProfileListItem,
} from "#/lib/api/profiles-controller";

type Props = {
  value: AdminProfileListItem | null;
  onChange: (profile: AdminProfileListItem | null) => void;
  profileType?: string[];
  placeholder?: string;
  label?: string;
};

export function ProfileCombobox({
  value,
  onChange,
  profileType,
  placeholder = "Search by name, email or phone…",
  label,
}: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: results = [] } = useQuery({
    queryKey: ["admin", "profiles", "combobox", search, profileType],
    queryFn: () =>
      getProfilesList({
        q: search,
        limit: 8,
        ...(profileType?.length ? { profile_type: profileType } : {}),
      }).then((r) => r.data),
    enabled: search.trim().length >= 1,
  });

  return (
    <div className="flex flex-col gap-1.5">
      {label != null && (
        <span className="text-sm font-medium">{label}</span>
      )}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {value
              ? `${value.firstName} ${value.lastName}`.trim() || value.email
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-(--radix-dropdown-menu-trigger-width)"
        >
          <DropdownMenuLabel className="p-0 font-normal">
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
          {search.trim().length > 0 && results.length === 0 && (
            <p className="text-muted-foreground px-3 py-4 text-center text-sm">
              No profiles found.
            </p>
          )}
          {results.map((profile) => (
            <DropdownMenuItem
              key={profile.id}
              className="flex cursor-pointer items-center gap-2 py-1.5 pl-2 pr-2"
              onSelect={() => {
                onChange(profile);
                setOpen(false);
                setSearch("");
              }}
            >
              <Check
                className={cn(
                  "h-4 w-4 shrink-0",
                  value?.id === profile.id ? "opacity-100" : "opacity-0",
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
  );
}
