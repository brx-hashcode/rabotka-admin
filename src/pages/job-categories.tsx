import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Tag } from "lucide-react";
import { PageListHeader } from "#/components/page-list-header";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { CategoryCard } from "#/features/job-categories/components/category-card";
import { CategoryExportMenu } from "#/features/job-categories/components/category-export-menu";
import { CreateCategoryModal } from "#/features/job-categories/components/create-category-modal";
import { listJobCategories } from "#/lib/api/job-categories-controller";
import { matchesSearch } from "#/lib/search";

export default function JobCategoriesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin", "job-categories"],
    queryFn: () => listJobCategories(),
  });

  // Client-side: the whole list is already in hand (one unpaginated request of
  // a few dozen rows), so a round trip per keystroke would be slower and no
  // more accurate.
  //
  // Searches the description too, not just the name — half these domains are
  // found by what they cover ("carrelage", "rattrapage") rather than by their
  // title.
  const filtered = useMemo(
    () =>
      categories.filter((cat) =>
        matchesSearch(search, cat.name, cat.slug, cat.description),
      ),
    [categories, search],
  );

  const hasQuery = search.trim().length > 0;

  let listSection: ReactNode;

  if (isLoading) {
    listSection = (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={`cat-skeleton-${i + 1}`} className="h-44 rounded-2xl" />
        ))}
      </div>
    );
  } else if (categories.length === 0) {
    listSection = (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <div className="bg-muted rounded-full p-5">
          <Tag className="size-10 text-muted-foreground" />
        </div>
        <p className="font-medium text-lg">No domains yet</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          Domains help workers find relevant job offers and improve matching.
        </p>
        <Button className="mt-2" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Add category
        </Button>
      </div>
    );
  } else if (filtered.length === 0) {
    // Distinct from the empty-list state above: there ARE domains, this query
    // just found none, so the remedy is clearing the search, not creating one.
    listSection = (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <div className="bg-muted rounded-full p-5">
          <Search className="size-10 text-muted-foreground" />
        </div>
        <p className="font-medium text-lg">No match</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          No domain matches “{search.trim()}”.
        </p>
        <Button variant="outline" className="mt-2" onClick={() => setSearch("")}>
          Clear search
        </Button>
      </div>
    );
  } else {
    listSection = (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    );
  }

  return (
    <div className="pt-6">
      <PageListHeader
        title="Domains"
        description="Manage job domains for workers and job offers."
        actions={
          <>
            {/* Exports what the search is showing, not the whole table — the
                filtering is client-side, so `filtered` IS what is on screen. */}
            <CategoryExportMenu categories={filtered} disabled={isLoading} />
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Add category
            </Button>
          </>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search domains…"
            aria-label="Search domains"
            className="pl-8"
          />
        </div>
        {hasQuery && !isLoading && (
          <p className="text-muted-foreground shrink-0 text-sm">
            {filtered.length} of {categories.length}
          </p>
        )}
      </div>

      {listSection}

      <CreateCategoryModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
