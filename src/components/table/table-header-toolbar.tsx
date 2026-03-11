import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";
import type { Table as TableInstance } from "@tanstack/react-table";
import {
  ListFilterIcon,
  LayoutListIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";

import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { cn } from "#/lib/utils";

export type TableHeaderToolbarFilterOption = Readonly<{
  value: string;
  label: string;
}>;

export type TableHeaderToolbarFilter = Readonly<{
  id: string;
  label: string;
  options: readonly TableHeaderToolbarFilterOption[];
}>;

export type TableHeaderToolbarProps<TData = unknown> = Readonly<{
  searchParamKey?: string;
  searchPlaceholder?: string;
  filters?: readonly TableHeaderToolbarFilter[];
  table?: TableInstance<TData>;
  children?: ReactNode;
}>;

export function TableHeaderToolbar<TData = unknown>({
  searchParamKey = "q",
  searchPlaceholder,
  filters = [],
  table,
  children,
}: TableHeaderToolbarProps<TData>) {
  const showSearch = searchPlaceholder != null;
  const showFilters = filters.length > 0;
  const showView = table != null;
  const showActions = children != null;

  const parsers = useMemo(() => {
    const arrayParser = parseAsArrayOf(parseAsString).withDefault(
      [] as string[],
    );
    const base = {
      [searchParamKey]: parseAsString.withDefault(""),
    } as Record<
      string,
      typeof arrayParser | ReturnType<typeof parseAsString.withDefault>
    >;
    for (const f of filters) {
      base[f.id] = arrayParser;
    }
    return base;
  }, [searchParamKey, filters]);

  const [queryState, setQueryState] = useQueryStates(
    parsers as Parameters<typeof useQueryStates>[0],
  );

  const search = (queryState[searchParamKey] as string) ?? "";
  const hasActiveFilters =
    search !== "" ||
    filters.some(
      (f) => ((queryState[f.id] as string[] | undefined)?.length ?? 0) > 0,
    );

  const handleReset = () => {
    setQueryState({
      [searchParamKey]: "",
      ...Object.fromEntries(filters.map((f) => [f.id, [] as string[]])),
    });
  };

  const setSearch = (value: string | null) => {
    setQueryState((prev) => ({ ...prev, [searchParamKey]: value ?? "" }));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {showSearch && (
          <div className="relative min-w-[200px] max-w-sm flex-1 rounded-md border border-input bg-background shadow-xs">
            <SearchIcon
              className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              placeholder={searchPlaceholder ?? "Filter..."}
              value={search}
              onChange={(e) => setSearch(e.target.value || null)}
              className={cn(
                "h-9 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0",
                search && "pr-8",
              )}
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 size-8 -translate-y-1/2"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <XIcon className="size-4" aria-hidden />
              </Button>
            )}
          </div>
        )}
        {showFilters &&
          filters.map((filter) => (
            <FilterDropdown
              key={filter.id}
              filter={filter}
              selected={(queryState[filter.id] as string[] | undefined) ?? []}
              setSelected={(valueOrUpdater) =>
                setQueryState((prev) => ({
                  ...prev,
                  [filter.id]:
                    typeof valueOrUpdater === "function"
                      ? valueOrUpdater(
                          (prev[filter.id] as string[] | undefined) ?? [],
                        )
                      : valueOrUpdater,
                }))
              }
            />
          ))}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5"
            onClick={handleReset}
          >
            Reset
            <XIcon className="size-4" aria-hidden />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showView && <ViewDropdown table={table} />}
        {showActions && (
          <div className="flex items-center gap-2">{children}</div>
        )}
      </div>
    </div>
  );
}

function FilterDropdown({
  filter,
  selected,
  setSelected,
}: Readonly<{
  filter: TableHeaderToolbarFilter;
  selected: string[];
  setSelected: (value: string[] | ((prev: string[]) => string[])) => void;
}>) {
  const [filterSearch, setFilterSearch] = useState("");

  const toggle = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const filteredOptions = useMemo(() => {
    if (!filterSearch.trim()) return filter.options;
    const q = filterSearch.trim().toLowerCase();
    return filter.options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [filter.options, filterSearch]);

  const selectedLabels = useMemo(
    () =>
      selected
        .map((v) => filter.options.find((o) => o.value === v)?.label)
        .filter(Boolean) as string[],
    [selected, filter.options],
  );

  const showTags = selected.length > 0 && selected.length <= 2;
  const showCountBadge = selected.length > 2;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 flex-wrap justify-center gap-1.5 border-dashed cursor-pointer"
          type="button"
        >
          <ListFilterIcon className="size-4 shrink-0" aria-hidden />
          <span>{filter.label}</span>
          {showCountBadge && (
            <span className="bg-primary text-primary-foreground inline-flex aspect-square w-6 items-center justify-center rounded-full text-xs font-medium">
              {selected.length}
            </span>
          )}
          {showTags &&
            selectedLabels.map((label) => (
              <span
                key={label}
                className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
              >
                {label}
              </span>
            ))}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-56 w-(--radix-dropdown-menu-trigger-width)"
      >
        <DropdownMenuLabel className="font-normal p-0">
          <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5">
            <SearchIcon
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden
            />
            <Input
              placeholder={`Search ${filter.label}...`}
              className="placeholder:text-muted-foreground h-7 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {filteredOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="flex cursor-pointer items-center gap-2 py-1.5 pl-2 pr-2"
            onSelect={(e) => {
              e.preventDefault();
              toggle(option.value);
            }}
          >
            <Checkbox
              checked={selected.includes(option.value)}
              onCheckedChange={() => toggle(option.value)}
              className="pointer-events-none shrink-0"
              aria-hidden
            />
            <span className="min-w-0 flex-1">{option.label}</span>
          </DropdownMenuItem>
        ))}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-center text-sm cursor-pointer"
              onClick={() => setSelected([])}
            >
              Clear filters
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ViewDropdown<TData>({
  table,
}: Readonly<{ table: TableInstance<TData> }>) {
  const columns = table.getAllColumns().filter((col) => col.getCanHide());

  if (columns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 cursor-pointer gap-1.5"
        >
          <LayoutListIcon className="size-4" aria-hidden />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[max(var(--radix-dropdown-menu-trigger-width),14rem)]"
      >
        {columns.map((column) => {
          const label =
            typeof column.columnDef.header === "string"
              ? column.columnDef.header
              : column.id;
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value: boolean | "indeterminate") =>
                column.toggleVisibility(value === true)
              }
            >
              {label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
