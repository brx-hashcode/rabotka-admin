import { useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type { AdminProfileListItem } from "#/lib/api/profiles-controller";
import { IconDotsVertical } from "@tabler/icons-react";

type ProfileRowActionsProps = Readonly<{
  profile: AdminProfileListItem;
}>;

export function ProfileRowActions({ profile }: ProfileRowActionsProps) {
  const navigate = useNavigate();

  const handleView = () => {
    navigate({ to: "/profiles/$profileId", params: { profileId: profile.id } });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Open actions">
          <IconDotsVertical className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleView}>View</DropdownMenuItem>
        <DropdownMenuItem onClick={() => alert(`Update ${profile.id}`)}>
          Update
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => alert(`Activate ${profile.id}`)}>
          Activate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => alert(`Deactivate ${profile.id}`)}>
          Deactivate
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => alert(`Delete ${profile.id}`)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
