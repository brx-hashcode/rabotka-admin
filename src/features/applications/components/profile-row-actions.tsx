import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { EyeIcon, MoreHorizontal } from "lucide-react";
import { IconLink } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type { AdminProfileListItem } from "#/lib/api/profiles-controller";
import { createPaymentLink } from "#/lib/api/payment-requests-controller";

type ProfileRowActionsProps = Readonly<{
  profile: AdminProfileListItem;
}>;

export function ProfileRowActions({ profile }: ProfileRowActionsProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const sendLinkMutation = useMutation({
    mutationFn: () => createPaymentLink(profile.id),
    onSuccess: ({ paymentUrl }) => {
      navigator.clipboard.writeText(paymentUrl).catch(() => {});
      setCopied(true);
      toast.success("Payment link created and copied to clipboard.");
      setTimeout(() => setCopied(false), 3000);
    },
    onError: () => toast.error("Failed to create payment link."),
  });

  const canSendPaymentLink = profile.status === "PENDING_PAYMENT";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            navigate({
              to: "/profiles/$profileId",
              params: { profileId: profile.id },
              replace: true,
            })
          }
        >
          <EyeIcon className="mr-2 size-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!canSendPaymentLink || sendLinkMutation.isPending}
          onClick={() => sendLinkMutation.mutate()}
        >
          <IconLink className="mr-2 size-4" />
          {copied ? "Link copied!" : "Send payment link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
