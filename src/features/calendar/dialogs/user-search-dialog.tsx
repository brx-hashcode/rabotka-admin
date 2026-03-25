import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { getUsersList } from "#/lib/api/users-controller";
import { SearchDialog } from "../components/search-dialog";
import { initials } from "../utils";
import type { IUser } from "../interfaces";

type UserSearchDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (v: boolean) => void;
  readonly selected: IUser[];
  readonly onToggle: (item: IUser) => void;
};

export function UserSearchDialog({
  open,
  onOpenChange,
  selected,
  onToggle,
}: Readonly<UserSearchDialogProps>) {
  const handleSearch = async (query: string) => {
    if (query.trim().length < 1) return [];
    const response = await getUsersList({ q: query, limit: 8 });
    return response.data.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      picturePath: null,
    })) as IUser[];
  };

  const renderResult = (item: IUser) => (
    <>
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="text-xs">
          {initials(item.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium truncate">{item.name}</span>
        <span className="text-xs text-muted-foreground truncate">
          {item.email}
        </span>
      </div>
    </>
  );

  return (
    <SearchDialog<IUser>
      open={open}
      onOpenChange={onOpenChange}
      selected={selected}
      onToggle={onToggle}
      title="User"
      placeholder="Search users…"
      onSearch={handleSearch}
      renderResult={renderResult}
    />
  );
}
