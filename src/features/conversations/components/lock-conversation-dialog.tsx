import { useState } from "react";
import { IconLock, IconLockOpen } from "@tabler/icons-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";

/**
 * Lock / unlock, with the three facts spelled out before the tap.
 *
 * All three, because each one is something somebody would otherwise assume
 * wrongly: that it silences both sides (it does), that it deletes the history
 * (it does not), and that it is final (it is not). A confirm step that only
 * says "are you sure?" makes the reader guess at all three.
 */
export function LockConversationDialog({
  isClosed,
  workerName,
  employerName,
  onConfirm,
  disabled,
}: Readonly<{
  isClosed: boolean;
  workerName: string;
  employerName: string;
  onConfirm: () => void;
  disabled?: boolean;
}>) {
  const [open, setOpen] = useState(false);

  const confirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <>
      <Button
        variant={isClosed ? "outline" : "destructive"}
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        {isClosed ? (
          <IconLockOpen className="mr-2 size-4" aria-hidden />
        ) : (
          <IconLock className="mr-2 size-4" aria-hidden />
        )}
        {isClosed ? "Unlock conversation" : "Lock conversation"}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isClosed
                ? "Unlock this conversation?"
                : "Lock this conversation?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                {isClosed ? (
                  <p>
                    {workerName} and {employerName} will be able to write to
                    each other again. Messages are still moderated as before.
                  </p>
                ) : (
                  <>
                    <p>
                      {workerName} and {employerName} will not be able to write
                      in it again. Each of them sees the thread marked as closed
                      instead of a message box.
                    </p>
                    <p>
                      Nothing is deleted — both of them keep every message they
                      have already exchanged.
                    </p>
                    <p className="text-muted-foreground">
                      You can unlock it again from this page.
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirm}>
              {isClosed ? "Unlock" : "Lock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
