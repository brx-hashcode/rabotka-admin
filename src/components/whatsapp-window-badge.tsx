import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import { Skeleton } from "#/components/ui/skeleton";
import { ADMIN_MESSAGE_VAR_MAX } from "#/lib/whatsapp-template-text";
import type { WhatsAppWindowState } from "#/lib/api/profiles-controller";

/**
 * Tells the admin how their WhatsApp message will actually go out.
 *
 * WhatsApp only accepts free-form text while the profile has messaged us in the
 * last 24h. Outside that window the send goes through an approved template, and
 * the message is flattened onto a single line to satisfy Meta's rules on
 * template variables. That is a visible difference in what the profile receives,
 * so the admin gets to see it before hitting send.
 *
 * Advisory only — it never blocks sending. The window can open or lapse between
 * this render and the request landing, and the backend recomputes it anyway.
 */
export function WhatsAppWindowBadge({
  state,
  isLoading,
}: Readonly<{
  state: WhatsAppWindowState | undefined;
  isLoading: boolean;
}>) {
  // Same footprint as the badge, so the row does not jump when it resolves.
  if (isLoading || !state) {
    return <Skeleton className="h-5 w-36 rounded-md" />;
  }

  const { label, dot, tooltip } = describe(state);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="bg-card shadow-soft inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px]">
          <span className={`size-1.5 shrink-0 rounded-full ${dot}`} />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-70">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function describe(state: WhatsAppWindowState) {
  if (!state.hasPhone) {
    return {
      label: "No phone number",
      dot: "bg-muted-foreground",
      tooltip:
        "This profile has no phone number, so it cannot be reached on WhatsApp. Use email instead.",
    };
  }

  if (state.windowOpen) {
    return {
      label: "Free-form · window open",
      dot: "bg-emerald-500",
      tooltip:
        "The profile messaged us within the last 24h, so your text is delivered exactly as written, line breaks and all.",
    };
  }

  return {
    label: "Template · window closed",
    dot: "bg-amber-500",
    tooltip:
      `Outside WhatsApp's 24h window. Your message is delivered inside an approved ` +
      `template and flattened to a single paragraph, with blank lines shown as "·". ` +
      `Maximum ${ADMIN_MESSAGE_VAR_MAX} characters.`,
  };
}
