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
  getReasonTemplates,
  groupReasonTemplates,
  type ReasonTemplateScope,
} from "#/lib/reason-templates";

type Props = {
  /** Narrows the list to the decision the admin is about to confirm. */
  scope: ReasonTemplateScope | null;
  /** Receives the snippet to insert. */
  onPick: (body: string) => void;
  disabled?: boolean;
};

export function ReasonTemplatePicker({
  scope,
  onPick,
  disabled,
}: Readonly<Props>) {
  const [open, setOpen] = useState(false);

  const groups = useMemo(
    () => groupReasonTemplates(getReasonTemplates(scope)),
    [scope],
  );

  // Nothing to suggest until a decision is picked — showing a dead trigger
  // would only invite a click that does nothing.
  if (groups.length === 0) return null;

  // A single section reads better without a header repeating the obvious.
  const showCategories = groups.length > 1;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
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
            {showCategories && (
              <DropdownMenuLabel className="text-muted-foreground text-[11px] uppercase tracking-wide">
                {group.category}
              </DropdownMenuLabel>
            )}
            {group.templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                className="flex cursor-pointer flex-col items-start gap-0.5 py-1.5"
                onSelect={() => {
                  onPick(template.body);
                  setOpen(false);
                }}
              >
                <span className="text-sm font-medium">{template.label}</span>
                <span className="text-muted-foreground line-clamp-2 text-xs">
                  {template.body}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
