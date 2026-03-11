import { buttonVariants } from "#/components/ui/button";
import type { AdminJobOfferListItem } from "#/lib/api/jobs-controller";
import { Link } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";

type JobRowActionsProps = Readonly<{
  job: AdminJobOfferListItem;
}>;

export function JobRowActions({ job }: JobRowActionsProps) {
  return (
    <Link
      to="/jobs/$jobId"
      params={{ jobId: job.id }}
      className={buttonVariants({ variant: "ghost", size: "icon" })}
    >
      <EyeIcon className="size-4" aria-hidden />
    </Link>
  );
}
