import { flexRender, type Table as TableInstance } from "@tanstack/react-table";

import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { cn } from "#/lib/utils";

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
  /**
   * Fill the parent's height and scroll inside, header pinned, instead of
   * growing with its rows. The parent must have a bounded height.
   */
  fillHeight?: boolean;
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
          <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                className={getAlignClass(
                  cell.column.columnDef.meta as AlignMeta | undefined,
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
  fillHeight = false,
}: TableProps<TData>) {
  const columnCount = table.getAllColumns().length;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border",
        fillHeight && "flex min-h-0 flex-1 flex-col",
      )}
    >
      {/* With fillHeight the container is the vertical scroller too, so the
          sticky header sticks to it rather than to a parent that never moves. */}
      <UITable containerClassName={fillHeight ? "min-h-0 flex-1 overflow-auto" : undefined}>
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  className={cn(
                    getAlignClass(
                      header.column.columnDef.meta as AlignMeta | undefined,
                    ),
                    "uppercase",
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
