import { buttonVariants } from "#/components/ui/button";
import type { AdminPenaltyListItem } from "#/lib/api/penalties-controller";
import { Link } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";

type PenaltyRowActionsProps = Readonly<{
  penalty: AdminPenaltyListItem;
}>;

export function PenaltyRowActions({ penalty }: PenaltyRowActionsProps) {
  return (
    <Link
      to="/penalties/$penaltyId"
      params={{ penaltyId: penalty.id }}
      className={buttonVariants({ variant: "ghost", size: "icon" })}
    >
      <EyeIcon className="size-4" aria-hidden />
    </Link>
  );
}
