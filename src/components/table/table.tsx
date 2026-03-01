import { flexRender, type Table as TableInstance } from "@tanstack/react-table";

import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";

type AlignMeta = { align?: "left" | "right" | "center" };

function getAlignClass(meta: AlignMeta | undefined): string {
  if (!meta?.align) return "text-left";
  if (meta.align === "right") return "text-right";
  if (meta.align === "center") return "text-center";
  return "text-left";
}

type TableProps<TData> = Readonly<{
  table: TableInstance<TData>;
  isLoading?: boolean;
  emptyMessage?: string;
}>;

const SKELETON_ROWS = 4;

const SkeletonLoader = ({ columnCount }: Readonly<{ columnCount: number }>) => {
  return (
    <>
      {Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
        <TableRow key={`skeleton-${rowIndex + 1}`}>
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <TableCell
              key={`skeleton-${rowIndex}-${colIndex}`}
              className="h-12"
            >
              <div className="bg-muted h-6 w-full animate-pulse rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};

function TableBodyContent<TData>({
  table,
  isLoading,
  columnCount,
  emptyMessage,
}: Readonly<{
  table: TableInstance<TData>;
  isLoading: boolean;
  columnCount: number;
  emptyMessage: string;
}>) {
  if (isLoading) {
    return <SkeletonLoader columnCount={columnCount} />;
  }
  const rows = table.getRowModel().rows;
  if (rows?.length) {
    return (
      <>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            data-state={row.getIsSelected() && "selected"}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                className={getAlignClass(
                  cell.column.columnDef.meta as AlignMeta | undefined
                )}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </>
    );
  }
  return (
    <TableRow>
      <TableCell colSpan={columnCount} className="h-24 text-center">
        {emptyMessage}
      </TableCell>
    </TableRow>
  );
}

export function Table<TData>({
  table,
  isLoading = false,
  emptyMessage = "No results.",
}: TableProps<TData>) {
  const columnCount = table.getAllColumns().length;

  return (
    <div className="overflow-hidden rounded-lg border">
      <UITable>
        <TableHeader className="bg-muted sticky top-0 z-10">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                className={getAlignClass(
                  header.column.columnDef.meta as AlignMeta | undefined
                )}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        <TableBodyContent
          table={table}
          isLoading={isLoading}
          columnCount={columnCount}
          emptyMessage={emptyMessage}
        />
      </TableBody>
      </UITable>
    </div>
  );
}
