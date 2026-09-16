import { useState } from "react";
import type { Table as TableInstance } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconAlertTriangle, IconTrashX } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { ConfirmDialog } from "#/features/team/components/confirm-dialog";
import { friendlyError } from "#/lib/api/friendly-error";

/** Shape the API returns with a 409 when linked records block the purge. */
type PurgeBlocker = { label: string; count: number };

type BulkPurgeButtonProps<TData> = Readonly<{
  table: TableInstance<TData>;
  /** Calls the resource's bulk-purge endpoint with the selected row ids. */
  purgeFn: (ids: string[]) => Promise<{ count: number }>;
  queryKey: readonly unknown[];
  entityLabel: string;
  disabled?: boolean;
}>;

/**
 * Permanently deletes archived rows. SUPER_ADMIN only — the page passes
 * `disabled` from `canPurge`.
 *
 * The server refuses rows carrying records that must outlive them (payments,
 * invoices, KYC documents, ledger entries) and answers 409 with per-relation
 * counts. Those counts are surfaced verbatim: "delete failed" would leave the
 * admin with no idea what to do next, and retrying will never help.
 */
export function BulkPurgeButton<TData>({
  table,
  purgeFn,
  queryKey,
  entityLabel,
  disabled = false,
}: BulkPurgeButtonProps<TData>) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [blockers, setBlockers] = useState<PurgeBlocker[] | null>(null);

  const ids = table
    .getSelectedRowModel()
    .rows.map((row) => (row.original as { id?: string }).id)
    .filter((id): id is string => typeof id === "string");
  const count = ids.length;

  const mutation = useMutation({
    mutationFn: () => purgeFn(ids),
    onSuccess: (result) => {
      setOpen(false);
      setBlockers(null);
      table.resetRowSelection();
      void queryClient.invalidateQueries({ queryKey });
      toast.success(
        `Permanently deleted ${result.count} ${entityLabel}${result.count === 1 ? "" : "s"}.`,
      );
    },
    onError: (error) => {
      const found = extractBlockers(error);
      if (found) {
        setBlockers(found);
        return;
      }
      setOpen(false);
      toast.error(friendlyError(error, "Couldn't delete these items. Try again."));
    },
  });

  if (disabled || count === 0) return null;

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) setBlockers(null);
  };

  const plural = count === 1 ? "" : "s";
  const confirmTitle = `Permanently delete ${count} ${entityLabel}${plural}?`;

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="gap-1.5 shrink-0"
        onClick={() => setOpen(true)}
      >
        <IconTrashX className="size-4" aria-hidden />
        Delete permanently ({count})
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={close}
        title={blockers ? "Cannot delete permanently" : confirmTitle}
        description={
          blockers ? (
            <div className="space-y-2">
              <p>
                These {entityLabel}s are linked to records that must be kept, so
                they cannot be destroyed:
              </p>
              <ul className="list-disc space-y-0.5 pl-5">
                {blockers.map((b) => (
                  <li key={b.label}>
                    <span className="font-medium">{b.count}</span> {b.label}
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground">
                They stay archived and remain restorable.
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <IconAlertTriangle
                className="text-destructive mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <span>
                This cannot be undone. The selected {entityLabel}
                {plural} and everything attached to{" "}
                {count === 1 ? "it" : "them"} will be erased from the database.
              </span>
            </div>
          )
        }
        actionLabel={blockers ? "Close" : "Delete permanently"}
        variant="destructive"
        isPending={mutation.isPending}
        onConfirm={() => (blockers ? close(false) : mutation.mutate())}
      />
    </>
  );
}

/**
 * Pulls the `blockers` array out of a 409 body.
 *
 * `mvc-front-sdk` throws an `ApiError` whose `body` is the parsed JSON — note
 * its `response` field is the raw `Response`, not the payload, so `body` is the
 * only place to look.
 */
function extractBlockers(error: unknown): PurgeBlocker[] | null {
  const body = (error as { body?: unknown })?.body ?? error;
  const blockers = (body as { blockers?: unknown })?.blockers;
  if (!Array.isArray(blockers)) return null;
  const valid = blockers.filter(
    (b): b is PurgeBlocker =>
      typeof (b as PurgeBlocker)?.label === "string" &&
      typeof (b as PurgeBlocker)?.count === "number",
  );
  return valid.length > 0 ? valid : null;
}
