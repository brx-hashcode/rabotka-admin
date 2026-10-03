import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";

type ProfileCellProps = {
  name: string;
  /** Second line. Leave it out for a name alone; an empty string shows "—". */
  email?: string;
  avatarUrl: string | null;
};

function getInitials(name: Readonly<string>): string {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase().slice(0, 2) || "?";
}

export function ProfileCell({
  name,
  email,
  avatarUrl,
}: Readonly<ProfileCellProps>) {
  const displayName = name || "—";
  const initials = getInitials(displayName);

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        {avatarUrl ? (
          <AvatarImage
            src={avatarUrl}
            alt={displayName}
            className="object-cover"
          />
        ) : null}
        <AvatarFallback className="font-semibold bg-primary text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{displayName}</span>
        {email !== undefined && (
          <span className="text-muted-foreground truncate text-xs">
            {email || "—"}
          </span>
        )}
      </div>
    </div>
  );
}
