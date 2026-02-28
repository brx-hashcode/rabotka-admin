import type { ColumnDef } from "@tanstack/react-table";
import type { ComponentType } from "react";

import { Checkbox } from "#/components/ui/checkbox";

export type DataTableColumnMeta = {
  align?: "left" | "right" | "center";
};

export type ColumnsActionsProps<T> = {
  row: T;
};

export type ColumnsActionsComponent<T> = ComponentType<ColumnsActionsProps<T>>;

export function getCommonColumns<T>({
  additionalColumns = [],
  columnsActions: ColumnsActions,
}: {
  additionalColumns?: ColumnDef<T>[];
  columnsActions?: ColumnsActionsComponent<T>;
}): ColumnDef<T>[] {
  const columns: ColumnDef<T>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    ...additionalColumns,
  ];

  if (ColumnsActions) {
    columns.push({
      id: "actions",
      header: () => <div className="hidden">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ColumnsActions row={row.original} />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 100,
    });
  }

  return columns;
}
