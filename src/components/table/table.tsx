import {
  flexRender,
  type Table as TableInstance,
} from "@tanstack/react-table";

import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";

type TableProps<TData> = Readonly<{
  table: TableInstance<TData>;
  isLoading?: boolean;
  emptyMessage?: string;
}>;

const SKELETON_ROWS = 4;

function SkeletonLoader<TData>({
  columnCount,
}: {
  columnCount: number;
}) {
  return (
    <>
      {Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
        <TableRow key={`skeleton-${rowIndex}`}>
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <TableCell key={`skeleton-${rowIndex}-${colIndex}`} className="h-12">
              <div className="bg-muted h-6 w-full animate-pulse rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function Table<TData>({
  table,
  isLoading = false,
  emptyMessage = "No results.",
}: TableProps<TData>) {
  const columns = table.getAllColumns();
  const columnCount = columns.length;

  return (
    <UITable>
      <TableHeader className="bg-muted sticky top-0 z-10">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} colSpan={header.colSpan}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <SkeletonLoader columnCount={columnCount} />
        ) : table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={columnCount}
              className="h-24 text-center"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </UITable>
  );
}
