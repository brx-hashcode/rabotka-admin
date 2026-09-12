import { buttonVariants } from "#/components/ui/button";
import type { AdminContactRecordListItem } from "#/lib/api/contact-records-controller";
import { Link } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";

type ContactRecordRowActionsProps = Readonly<{
  record: AdminContactRecordListItem;
}>;

export function ContactRecordRowActions({
  record,
}: ContactRecordRowActionsProps) {
  return (
    <Link
      to="/contact-records/$contactRecordId"
      params={{ contactRecordId: record.id }}
      className={buttonVariants({ variant: "ghost", size: "icon" })}
    >
      <EyeIcon className="size-4" aria-hidden />
    </Link>
  );
}
