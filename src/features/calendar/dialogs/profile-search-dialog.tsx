import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { getProfilesList } from "#/lib/api/profiles-controller";
import { SearchDialog } from "../components/search-dialog";
import { initials } from "../utils";
import type { ICalendarProfile } from "../interfaces";

type ProfileSearchDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (v: boolean) => void;
  readonly selected: ICalendarProfile[];
  readonly onToggle: (item: ICalendarProfile) => void;
};

export function ProfileSearchDialog({
  open,
  onOpenChange,
  selected,
  onToggle,
}: Readonly<ProfileSearchDialogProps>) {
  const handleSearch = async (query: string) => {
    if (query.trim().length < 1) return [];
    const response = await getProfilesList({ q: query, limit: 8 });
    return response.data.map((p) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`.trim(),
      email: p.email,
      phone: p.phone,
      avatarUrl: p.avatarUrl ?? null,
    })) as ICalendarProfile[];
  };

  const renderResult = (item: ICalendarProfile) => (
    <>
      <Avatar className="size-8 shrink-0">
        {item.avatarUrl && (
          <AvatarImage
            src={item.avatarUrl}
            alt={item.name}
            className="object-cover"
          />
        )}
        <AvatarFallback className="text-xs">
          {initials(item.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium truncate">{item.name}</span>
        <span className="text-xs text-muted-foreground truncate">
          {item.email} · {item.phone}
        </span>
      </div>
    </>
  );

  return (
    <SearchDialog<ICalendarProfile>
      open={open}
      onOpenChange={onOpenChange}
      selected={selected}
      onToggle={onToggle}
      title="Profile"
      placeholder="Search profiles…"
      onSearch={handleSearch}
      renderResult={renderResult}
    />
  );
}
