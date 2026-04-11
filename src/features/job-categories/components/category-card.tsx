import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import {
  deleteJobCategory,
  type AdminJobCategory,
} from "#/lib/api/job-categories-controller";
import { EditCategoryModal } from "./edit-category-modal";

type CategoryCardProps = {
  category: AdminJobCategory;
};

export function CategoryCard({ category }: Readonly<CategoryCardProps>) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { mutate: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteJobCategory(category.id),
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "job-categories"] });
    },
    onError: () => toast.error("Failed to delete category"),
  });

  return (
    <>
      <div className="bg-card border rounded-2xl overflow-hidden flex flex-col">
        <div className="flex-1 p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            {/* Icon */}
            <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0 select-none">
              {category.icon ?? "📁"}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 -mr-1 -mt-1"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1 min-w-0">
            <p className="font-medium text-sm leading-snug line-clamp-2">
              {category.name}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {category.slug}
            </p>
            {category.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 pt-0.5">
                {category.description}
              </p>
            )}
          </div>
        </div>

        <div className="px-4 py-2.5 border-t bg-muted/30">
          <p className="text-muted-foreground text-xs">
            {format(new Date(category.created_at), "dd/MM/yyyy")}
          </p>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{category.name}&rdquo; will be permanently deleted. Job
              offers linked to this category will lose their category. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => doDelete()}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditCategoryModal
        open={editOpen}
        onOpenChange={setEditOpen}
        category={category}
      />
    </>
  );
}
