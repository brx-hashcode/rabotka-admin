import type { ReactNode } from "react";
import { useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Table as TableInstance,
  type VisibilityState,
} from "@tanstack/react-table";

import { Table } from "#/components/table/table";
import { TableBottom } from "#/components/table/table-bottom";
import { TableFooter } from "#/components/table/table-footer";
import { TableHeader } from "#/components/table/table-header";

export type DataTableProps<TData, TValue> = Readonly<{
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  isLoading?: boolean;
  isPaginated?: boolean;
  totalCount?: number;
  initialPageSize?: number;
  header?:
    | ReactNode
    | ((table: TableInstance<TData>) => ReactNode);
  footer?: ReactNode;
  emptyMessage?: string;
  getRowId?: (row: TData) => string;
  enableRowSelection?: boolean;
}>;

export function DataTable<TData, TValue>({
  data,
  columns,
  isLoading = false,
  isPaginated = false,
  totalCount = 0,
  initialPageSize = 10,
  header,
  footer,
  emptyMessage = "No results.",
  getRowId,
  enableRowSelection = false,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      ...(enableRowSelection && { rowSelection }),
      columnVisibility,
    },
    ...(enableRowSelection && {
      enableRowSelection: true,
      onRowSelectionChange: setRowSelection,
    }),
    onColumnVisibilityChange: setColumnVisibility,
    ...(getRowId && { getRowId }),
  });

  const showFooter = isPaginated || footer != null;

  const headerContent =
    header == null
      ? null
      : typeof header === "function"
        ? header(table)
        : header;

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-lg">
      {headerContent != null && <TableHeader>{headerContent}</TableHeader>}
      <Table<TData> table={table} isLoading={isLoading} emptyMessage={emptyMessage} />
      {showFooter && (
        <TableFooter>
          {isPaginated ? (
            <TableBottom total={totalCount} initialLimit={initialPageSize} />
          ) : (
            footer
          )}
        </TableFooter>
      )}
    </div>
  );
}
