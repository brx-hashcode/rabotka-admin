import { buttonVariants } from "#/components/ui/button";
import type { AdminApplicationListItem } from "#/lib/api/applications-controller";
import { Link } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";

type ApplicationRowActionsProps = Readonly<{
  application: AdminApplicationListItem;
}>;

export function ApplicationRowActions({
  application,
}: ApplicationRowActionsProps) {
  return (
    <Link
      to="/applications/$applicationId"
      params={{ applicationId: application.id }}
      className={buttonVariants({ variant: "ghost", size: "icon" })}
    >
      <EyeIcon className="size-4" aria-hidden />
    </Link>
  );
}
