import { useState } from "react";
import type { Table as TableInstance } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconRestore } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { ConfirmDialog } from "#/features/team/components/confirm-dialog";

type BulkRestoreButtonProps<TData> = Readonly<{
  table: TableInstance<TData>;
  /** Calls the resource's bulk-restore endpoint with the selected row ids. */
  restoreFn: (ids: string[]) => Promise<{ count: number }>;
  /** React Query key of the list to refetch afterwards. */
  queryKey: readonly unknown[];
  /** Singular entity name used in labels (e.g. "profile"). */
  entityLabel: string;
  disabled?: boolean;
}>;

/**
 * Un-archives the selected rows, clearing `deleted_at`.
 *
 * Only meaningful in the archived view, so pages render it in place of the
 * delete button while the "Deleted" filter is on. Mirrors BulkDeleteButton's
 * contract so the two are interchangeable in a toolbar.
 */
export function BulkRestoreButton<TData>({
  table,
  restoreFn,
  queryKey,
  entityLabel,
  disabled = false,
}: BulkRestoreButtonProps<TData>) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const ids = table
    .getSelectedRowModel()
    .rows.map((row) => (row.original as { id?: string }).id)
    .filter((id): id is string => typeof id === "string");
  const count = ids.length;

  const mutation = useMutation({
    mutationFn: () => restoreFn(ids),
    onSuccess: (result) => {
      setOpen(false);
      table.resetRowSelection();
      void queryClient.invalidateQueries({ queryKey });
      toast.success(
        `Restored ${result.count} ${entityLabel}${result.count === 1 ? "" : "s"}.`,
      );
    },
    onError: (error) => toast.error(error.message),
  });

  if (disabled || count === 0) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 shrink-0"
        onClick={() => setOpen(true)}
      >
        <IconRestore className="size-4" aria-hidden />
        Restore ({count})
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Restore ${count} ${entityLabel}${count === 1 ? "" : "s"}?`}
        description={`The selected ${entityLabel}${count === 1 ? "" : "s"} will return to the active list.`}
        actionLabel="Restore"
        isPending={mutation.isPending}
        onConfirm={() => mutation.mutate()}
      />
    </>
  );
}
