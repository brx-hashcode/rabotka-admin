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

  return (
    <div className="flex w-full items-center justify-between gap-4 py-3">
      <div className="flex-1" />
      <div className="flex w-full items-center gap-4 lg:w-fit lg:gap-8">
        <div className="hidden items-center gap-2 lg:flex">
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
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Page {currentPage} of {totalPages || 1}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
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
  );
}
