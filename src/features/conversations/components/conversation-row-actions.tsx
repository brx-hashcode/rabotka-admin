import { buttonVariants } from "#/components/ui/button";
import type { AdminConversationListItem } from "#/lib/api/conversations-controller";
import { Link } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";

type ConversationRowActionsProps = Readonly<{
  conversation: AdminConversationListItem;
}>;

export function ConversationRowActions({
  conversation,
}: ConversationRowActionsProps) {
  return (
    <Link
      to="/conversations/$conversationId"
      params={{ conversationId: conversation.id }}
      className={buttonVariants({ variant: "ghost", size: "icon" })}
    >
      <EyeIcon className="size-4" aria-hidden />
    </Link>
  );
}
