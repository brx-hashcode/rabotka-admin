import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

type UsePaginationReturn = {
  currentPage: number;
  totalPages: number;
  limit: number;
  setPageLimit: (newLimit: number) => void;
  goToFirst: () => void;
  goToLast: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  total: number;
  startItem: number;
  endItem: number;
};

export const usePagination = (
  total: number,
  initialLimit: number = 50
): UsePaginationReturn => {
  const [currentPage, setCurrentPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [limit, setLimit] = useQueryState(
    "limit",
    parseAsInteger.withDefault(initialLimit)
  );

  const totalPages = useMemo(
    () => Math.ceil(total / limit) || 1,
    [total, limit]
  );

  const goToFirst = useCallback((): void => {
    setCurrentPage(1);
  }, [setCurrentPage]);

  const goToLast = useCallback((): void => {
    setCurrentPage(totalPages);
  }, [totalPages, setCurrentPage]);

  const goToPrevious = useCallback((): void => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage, setCurrentPage]);

  const goToNext = useCallback((): void => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages, setCurrentPage]);

  const setPageLimit = useCallback(
    (newLimit: number): void => {
      setLimit(newLimit);
      setCurrentPage(1);
    },
    [setCurrentPage, setLimit]
  );

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const startItem = useMemo(
    () => (total === 0 ? 0 : (currentPage - 1) * limit + 1),
    [currentPage, limit, total]
  );
  const endItem = useMemo(
    () => Math.min(currentPage * limit, total),
    [currentPage, limit, total]
  );

  return {
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
    total,
    startItem,
    endItem,
  };
};
