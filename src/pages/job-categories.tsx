import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Tag } from "lucide-react";
import { PageListHeader } from "#/components/page-list-header";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { CategoryCard } from "#/features/job-categories/components/category-card";
import { CreateCategoryModal } from "#/features/job-categories/components/create-category-modal";
import { listJobCategories } from "#/lib/api/job-categories-controller";

export default function JobCategoriesPage() {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin", "job-categories"],
    queryFn: () => listJobCategories(),
  });

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
        <p className="font-medium text-lg">No categories yet</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          Categories help workers find relevant missions and improve matching.
        </p>
        <Button className="mt-2" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Add category
        </Button>
      </div>
    );
  } else {
    listSection = (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    );
  }

  return (
    <div className="pt-6">
      <PageListHeader
        title="Job Categories"
        description="Manage mission categories for workers and job offers."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Add category
          </Button>
        }
      />

      {listSection}

      <CreateCategoryModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
