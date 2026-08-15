import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import type { TEventEditScope } from "#/features/calendar/types";

const OPTIONS: { scope: TEventEditScope; label: string }[] = [
  { scope: "THIS", label: "This event" },
  { scope: "THIS_AND_FOLLOWING", label: "This and following events" },
  { scope: "ALL", label: "All events" },
];

type IProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "edit" | "delete";
  onConfirm: (scope: TEventEditScope) => void;
}>;

/**
 * Asks which occurrences an edit or delete should reach.
 *
 * Three buttons rather than radios plus a confirm: there is no radio-group in
 * the UI kit, and picking is the confirmation — the extra click buys nothing.
 */
export function RecurringScopeDialog({
  open,
  onOpenChange,
  mode,
  onConfirm,
}: IProps) {
  const isDelete = mode === "delete";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDelete ? "Delete repeating event" : "Edit repeating event"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDelete
              ? "This event repeats. Choose which occurrences to delete."
              : "This event repeats. Choose which occurrences to change."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2">
          {OPTIONS.map((option) => (
            <Button
              key={option.scope}
              type="button"
              variant={
                isDelete && option.scope !== "THIS" ? "destructive" : "outline"
              }
              className="w-full justify-start"
              onClick={() => {
                onOpenChange(false);
                onConfirm(option.scope);
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
