import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  CalendarDays,
  Repeat2,
} from "lucide-react";
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
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  deleteBundle,
  updateBundle,
  type AdBundle,
} from "#/lib/api/advertisements-controller";
import { BundleDialog } from "./bundle-dialog";

function channelBadgeClass(channel: string): string {
  switch (channel) {
    case "EMAIL":
      return "text-[10px] py-0 px-1.5 bg-sky-500/15 text-sky-500 border-sky-500/30";
    case "WHATSAPP":
      return "text-[10px] py-0 px-1.5 bg-green-500/15 text-green-500 border-green-500/30";
    case "BOTH":
      return "text-[10px] py-0 px-1.5 bg-violet-500/15 text-violet-500 border-violet-500/30";
    default:
      return "text-[10px] py-0 px-1.5";
  }
}

type BundleCardProps = {
  bundle: AdBundle;
};

export function BundleCard({ bundle }: Readonly<BundleCardProps>) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);

  const { mutate: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteBundle(bundle.id),
    onSuccess: () => {
      toast.success("Bundle deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "bundles"] });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to delete bundle"),
  });

  const { mutate: doToggle, isPending: isToggling } = useMutation({
    mutationFn: () => updateBundle(bundle.id, { isActive: !bundle.is_active }),
    onSuccess: () => {
      toast.success(
        bundle.is_active ? "Bundle deactivated" : "Bundle activated",
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "bundles"] });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to update bundle"),
  });

  const channelLabel =
    bundle.allowed_channels.length >= 2
      ? "BOTH"
      : (bundle.allowed_channels[0] ?? "—");

  return (
    <>
      <div
        className="relative flex flex-col rounded-2xl border bg-card overflow-hidden"
      >

        <div className="flex-1 flex flex-col p-5 gap-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-base leading-tight">
                {bundle.name}
              </p>
              {bundle.is_active ? (
                <Badge className="w-fit text-[10px] py-0 bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                  Active
                </Badge>
              ) : (
                <Badge className="w-fit text-[10px] py-0 bg-rose-500/15 text-rose-500 border-rose-500/30">
                  Inactive
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 -mr-1 -mt-1"
                  disabled={isToggling}
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setToggleOpen(true)}>
                  {bundle.is_active ? (
                    <>
                      <ToggleLeft className="size-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleRight className="size-4" />
                      Activate
                    </>
                  )}
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

          {/* Price */}
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold tracking-tight">
              {Number(bundle.price).toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground mb-1">
              {bundle.currency}
            </span>
          </div>

          {/* Description */}
          {bundle.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 -mt-2">
              {bundle.description}
            </p>
          )}

          {/* Divider */}
          <div className="border-t" />

          {/* Features list */}
          <ul className="flex flex-col gap-2.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Users className="size-3.5 shrink-0 text-foreground" />
              <span>
                Up to{" "}
                <span className="font-medium text-foreground">
                  {bundle.max_reach.toLocaleString()}
                </span>{" "}
                recipients
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CalendarDays className="size-3.5 shrink-0 text-foreground" />
              <span>
                Max duration:{" "}
                <span className="font-medium text-foreground">
                  {bundle.max_duration_days} days
                </span>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Repeat2 className="size-3.5 shrink-0 text-foreground" />
              <span>
                <span className="font-medium text-foreground">
                  {bundle.max_frequency_per_week}×
                </span>{" "}
                per week
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Badge className={channelBadgeClass(channelLabel)}>
                {channelLabel}
              </Badge>
              <span>delivery channel</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t bg-muted/30">
          <p className="text-muted-foreground text-xs">
            Created {format(new Date(bundle.created_at), "dd/MM/yyyy")}
          </p>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bundle?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{bundle.name}&rdquo; will be permanently deleted. This
              action cannot be undone. Bundles with advertisements attached
              cannot be deleted.
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

      <BundleDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        bundle={bundle}
      />
    </>
  );
}
