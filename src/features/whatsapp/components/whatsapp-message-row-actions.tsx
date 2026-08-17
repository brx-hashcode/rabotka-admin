import { ArrowRight } from "lucide-react";
import { Button } from "#/components/ui/button";
import type { WhatsappMessageItem } from "#/lib/api/whatsapp-controller";

type WhatsappMessageRowActionsProps = {
  message: WhatsappMessageItem;
  onView: (message: WhatsappMessageItem) => void;
};

export function WhatsappMessageRowActions({
  message,
  onView,
}: Readonly<WhatsappMessageRowActionsProps>) {
  return (
    <Button variant="ghost" size="icon" onClick={() => onView(message)}>
      <ArrowRight className="size-4" aria-hidden />
    </Button>
  );
}
