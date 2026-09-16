import { useState } from "react";
import type { Table as TableInstance } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { ConfirmDialog } from "#/features/team/components/confirm-dialog";
import { friendlyError } from "#/lib/api/friendly-error";

type BulkDeleteButtonProps<TData> = Readonly<{
  table: TableInstance<TData>;
  /** Calls the resource's bulk-delete endpoint with the selected row ids. */
  deleteFn: (ids: string[]) => Promise<{ count: number }>;
  /** React Query key of the list to refetch after deletion. */
  queryKey: readonly unknown[];
  /** Singular entity name used in the button label / messages (e.g. "profile"). */
  entityLabel: string;
  /** Hide the action entirely when the current admin lacks permission. */
  disabled?: boolean;
}>;

/**
 * Toolbar action that archives (soft-deletes) the rows currently selected in a
 * table. Renders only when at least one row is selected. Reads the selection
 * straight off the TanStack table instance, so any table using the shared
 * select column gets bulk delete by dropping this in its toolbar.
 */
export function BulkDeleteButton<TData>({
  table,
  deleteFn,
  queryKey,
  entityLabel,
  disabled = false,
}: BulkDeleteButtonProps<TData>) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const selectedRows = table.getSelectedRowModel().rows;
  const ids = selectedRows
    .map((row) => (row.original as { id?: string }).id)
    .filter((id): id is string => typeof id === "string");
  const count = ids.length;

  const mutation = useMutation({
    mutationFn: () => deleteFn(ids),
    onSuccess: (result) => {
      setOpen(false);
      table.resetRowSelection();
      void queryClient.invalidateQueries({ queryKey });
      toast.success(
        `Deleted ${result.count} ${entityLabel}${result.count === 1 ? "" : "s"}.`,
      );
    },
    onError: (error) => toast.error(friendlyError(error, "Couldn't archive these items. Try again.")),
  });

  if (disabled || count === 0) return null;

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="gap-1.5 shrink-0"
        onClick={() => setOpen(true)}
      >
        <IconTrash className="size-4" aria-hidden />
        Delete ({count})
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${count} ${entityLabel}${count === 1 ? "" : "s"}?`}
        description={`This archives the selected ${entityLabel}${count === 1 ? "" : "s"}. They will no longer appear in the table.`}
        actionLabel="Delete"
        variant="destructive"
        isPending={mutation.isPending}
        onConfirm={() => mutation.mutate()}
      />
    </>
  );
}
