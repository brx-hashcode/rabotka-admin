import { useMemo, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  getQuickMessageTemplates,
  groupQuickMessageTemplates,
  renderQuickMessage,
} from "#/lib/quick-message-templates";

type Props = {
  /** Narrows the list to the templates that make sense for this recipient. */
  profileType?: string | null;
  /** Fills `{{prenom}}` in the picked template. */
  firstName?: string | null;
  /** Receives the ready-to-send text. */
  onPick: (message: string) => void;
  disabled?: boolean;
};

export function QuickMessagePicker({
  profileType,
  firstName,
  onPick,
  disabled,
}: Readonly<Props>) {
  const [open, setOpen] = useState(false);

  const groups = useMemo(
    () => groupQuickMessageTemplates(getQuickMessageTemplates(profileType)),
    [profileType],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          disabled={disabled}
        >
          <MessageSquareText />
          Modèles
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        {groups.map((group) => (
          <DropdownMenuGroup key={group.category}>
            <DropdownMenuLabel className="text-muted-foreground text-[11px] uppercase tracking-wide">
              {group.category}
            </DropdownMenuLabel>
            {group.templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                className="flex cursor-pointer flex-col items-start gap-0.5 py-1.5"
                onSelect={() => {
                  onPick(renderQuickMessage(template, firstName));
                  setOpen(false);
                }}
              >
                <span className="text-sm font-medium">{template.label}</span>
                <span className="text-muted-foreground line-clamp-1 text-xs">
                  {template.body.split("\n\n")[1] ?? template.body}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
