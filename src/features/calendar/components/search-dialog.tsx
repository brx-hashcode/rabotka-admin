import { Check, SearchIcon } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { cn } from "#/lib/utils";
import { initials } from "../utils";

type SearchResult<T> = T & {
  id: string;
  email?: string;
  phone?: string;
  avatarUrl?: string | null;
};

type SearchDialogProps<T extends SearchResult<T>> = {
  readonly open: boolean;
  readonly onOpenChange: (v: boolean) => void;
  readonly selected: T[];
  readonly onToggle: (item: T) => void;
  readonly title: string;
  readonly placeholder: string;
  readonly onSearch: (query: string) => Promise<SearchResult<T>[]>;
  readonly renderResult: (item: SearchResult<T>, isSelected: boolean) => React.ReactNode;
};

export function SearchDialog<T extends SearchResult<T>>({
  open,
  onOpenChange,
  selected,
  onToggle,
  title,
  placeholder,
  onSearch,
  renderResult,
}: Readonly<SearchDialogProps<T>>) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult<T>[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (value: string) => {
    setSearch(value);
    if (value.trim().length >= 1) {
      setIsLoading(true);
      try {
        const res = await onSearch(value);
        setResults(res);
      } finally {
        setIsLoading(false);
      }
    } else {
      setResults([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add {title}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 border rounded-md px-3 py-2">
          <SearchIcon className="size-4 text-muted-foreground shrink-0" />
          <Input
            placeholder={placeholder}
            className="placeholder:text-muted-foreground h-7 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {isLoading && (
            <p className="text-muted-foreground text-sm text-center py-4">
              Loading…
            </p>
          )}
          {search.trim().length === 0 && !isLoading && (
            <p className="text-muted-foreground text-sm text-center py-4">
              Type to search.
            </p>
          )}
          {search.trim().length > 0 && results.length === 0 && !isLoading && (
            <p className="text-muted-foreground text-sm text-center py-4">
              No results found.
            </p>
          )}
          {results.map((item) => {
            const isSelected = selected.some((v) => v.id === item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent transition-colors",
                  isSelected && "bg-accent",
                )}
              >
                <Check
                  className={cn(
                    "size-4 shrink-0",
                    isSelected ? "opacity-100" : "opacity-0",
                  )}
                />
                {renderResult(item, isSelected)}
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
