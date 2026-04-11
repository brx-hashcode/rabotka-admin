import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";

import { usePagination } from "#/hooks/use-pagination";
import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { appConfig } from "#/config";

type TableBottomProps = Readonly<{
  total: number;
  initialLimit?: number;
}>;

const PAGE_SIZE_OPTIONS = [appConfig.defaultPaginationLimit, 20, 30, 40, 50];

export function TableBottom({
  total,
  initialLimit = appConfig.defaultPaginationLimit,
}: TableBottomProps) {
  const {
    currentPage,
    totalPages,
    limit,
    startItem,
    endItem,
    setPageLimit,
    goToFirst,
    goToLast,
    goToPrevious,
    goToNext,
    canGoPrevious,
    canGoNext,
  } = usePagination(total, initialLimit);

  const handlePageSizeChange = (value: string) => {
    setPageLimit(Number(value));
  };

  const canGoFirst = currentPage > 1;
  const canGoLast = currentPage < totalPages;

  const rangeLabel =
    total === 0
      ? "No results"
      : `Showing ${startItem}–${endItem} of ${total}`;

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
      <p className="text-muted-foreground min-w-0 text-sm tabular-nums">
        {rangeLabel}
      </p>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-6 gap-y-2">
        <div className="hidden min-w-0 items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select value={`${limit}`} onValueChange={handlePageSizeChange}>
            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
              <SelectValue placeholder={limit} />
            </SelectTrigger>
            <SelectContent side="top">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-0 shrink-0 items-center gap-4">
          <p className="text-foreground text-sm font-medium tabular-nums whitespace-nowrap">
            Page {currentPage} of {totalPages || 1}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={goToFirst}
              disabled={!canGoFirst}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={goToPrevious}
              disabled={!canGoPrevious}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={goToNext}
              disabled={!canGoNext}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={goToLast}
              disabled={!canGoLast}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
