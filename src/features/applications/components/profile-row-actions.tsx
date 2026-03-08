import { buttonVariants } from "#/components/ui/button";
import type { AdminProfileListItem } from "#/lib/api/profiles-controller";
import { Link } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";

type ProfileRowActionsProps = Readonly<{
  profile: AdminProfileListItem;
}>;

export function ProfileRowActions({ profile }: ProfileRowActionsProps) {
  return (
    <Link
      to="/profiles/$profileId"
      params={{ profileId: profile.id }}
      className={buttonVariants({ variant: "ghost", size: "icon" })}
    >
      <EyeIcon className="size-4" aria-hidden />
    </Link>
  );
}
