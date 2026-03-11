import { useState } from "react";
import { IconLoader2 } from "@tabler/icons-react";
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
import { Textarea } from "#/components/ui/textarea";
import { Label } from "#/components/ui/label";

type RejectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending?: boolean;
  onConfirm: (note: string) => void;
};

export function RejectDialog({
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: Readonly<RejectDialogProps>) {
  const [note, setNote] = useState("");

  function handleConfirm() {
    if (!note.trim()) return;
    onConfirm(note.trim());
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) setNote("");
    onOpenChange(isOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject payment</AlertDialogTitle>
          <AlertDialogDescription>
            Please provide a reason for rejection. The user will see this note.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Label htmlFor="rejection-note">Rejection reason</Label>
          <Textarea
            id="rejection-note"
            placeholder="Enter reason..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isPending}
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending || !note.trim()}
          >
            {isPending && <IconLoader2 className="mr-2 size-4 animate-spin" />}
            Reject
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
