import type { ReactNode } from "react";
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

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /**
   * Plain text for the common case. Rich nodes are allowed so a dialog can
   * explain itself with structure (e.g. a list of what blocks the action).
   */
  description: ReactNode;
  actionLabel: string;
  onConfirm: () => void;
  isPending?: boolean;
  variant?: "default" | "destructive";
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  onConfirm,
  isPending,
  variant = "default",
}: Readonly<ConfirmDialogProps>) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {/*
            Radix renders the description as a <p>. `asChild` hands that role to
            the caller's own element instead, so rich content (lists, divs) does
            not end up illegally nested inside a paragraph.
          */}
          <AlertDialogDescription asChild={typeof description !== "string"}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button variant={variant} onClick={onConfirm} disabled={isPending}>
            {isPending && <IconLoader2 className="mr-2 size-4 animate-spin" />}
            {actionLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
