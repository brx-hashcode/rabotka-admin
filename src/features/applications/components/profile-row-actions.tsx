import { Button } from "#/components/ui/button";
import type { AdminProfileListItem } from "#/lib/api/profiles-controller";
import { useNavigate } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";

type ProfileRowActionsProps = Readonly<{
  profile: AdminProfileListItem;
}>;

export function ProfileRowActions({ profile }: ProfileRowActionsProps) {
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() =>
        navigate({
          to: "/profiles/$profileId",
          params: { profileId: profile.id },
          replace: true,
        })
      }
    >
      <EyeIcon className="size-4" aria-hidden />
    </Button>
  );
}
