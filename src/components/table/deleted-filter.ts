import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";

/**
 * Shared "Deleted" toolbar filter: a single toggle that switches a table
 * between active rows (default) and archived (soft-deleted) rows.
 *
 * The toolbar filters are multi-select arrays, so the selection is
 * `["true"]` when archived rows are requested and `[]` otherwise.
 */
export const deletedFilterOptions = [
  { value: "true", label: "Show archived" },
] as const;

/** Whether the "Deleted" filter is toggled on for the given nuqs array value. */
export function isDeletedSelected(value: string[] | undefined): boolean {
  return value?.includes("true") ?? false;
}

/**
 * Reads the shared "deleted" toolbar filter from the URL. Pages use this to
 * hide the bulk-delete button while archived rows are shown — those rows are
 * already deleted, so offering delete again is meaningless.
 */
export function useIsDeletedView(): boolean {
  const [deleted] = useQueryState(
    "deleted",
    parseAsArrayOf(parseAsString).withDefault([] as string[]),
  );
  return isDeletedSelected(deleted);
}
