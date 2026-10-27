import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Check,
  FileSearch,
  FileText,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Unlock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  updateBusinessPlan,
  type BusinessPlan,
} from "#/lib/api/business-plans-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { BUSINESS_PLANS_KEY } from "#/hooks/use-business-plans-list";
import { PlanDialog } from "./plan-dialog";

const quotaLabel = (n: number | null, unit: string) =>
  n === null ? `Unlimited ${unit}` : `${n.toLocaleString()} ${unit}`;

type PlanCardProps = {
  plan: BusinessPlan;
  canManage: boolean;
};

/** One business plan, as the bundles page draws its bundles. */
export function PlanCard({ plan, canManage }: Readonly<PlanCardProps>) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);

  const { mutate: doToggle, isPending: isToggling } = useMutation({
    mutationFn: () => updateBusinessPlan(plan.id, { isActive: !plan.isActive }),
    onSuccess: () => {
      toast.success(plan.isActive ? "Plan deactivated" : "Plan activated");
      queryClient.invalidateQueries({ queryKey: BUSINESS_PLANS_KEY });
    },
    onError: (err: Error) => toast.error(friendlyError(err, "Couldn't update the plan. Try again.")),
  });

  const features = [
    plan.includesPreselection && "Preselection of profiles",
    plan.includesFieldAgents && "Field agents",
    plan.priorityVisibility && "Priority visibility",
  ].filter(Boolean) as string[];

  return (
    <>
      <div className="relative flex flex-col rounded-2xl border bg-card overflow-hidden">
        <div className="flex-1 flex flex-col p-5 gap-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="bg-muted rounded-lg p-2">
              <Building2 className="size-6 text-muted-foreground" />
            </div>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 -mr-1 -mt-1" disabled={isToggling}>
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
                    {plan.isActive ? (
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
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Name & status */}
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-base leading-tight">{plan.name}</p>
            <div className="flex items-center gap-1.5">
              {plan.isActive ? (
                <Badge className="w-fit text-[10px] py-0 bg-emerald-500 text-white border-transparent">Active</Badge>
              ) : (
                <Badge className="w-fit text-[10px] py-0 bg-rose-500 text-white border-transparent">Inactive</Badge>
              )}
              <span className="text-muted-foreground text-[11px]">{plan.code}</span>
            </div>
          </div>

          {/* Prices */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold tracking-tight">{plan.monthlyPriceFcfa.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground mb-1">FCFA / month</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {plan.annualPriceFcfa.toLocaleString()} FCFA / year
            </span>
          </div>

          {plan.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 -mt-2">{plan.description}</p>
          )}

          <div className="border-t" />

          {/* What it includes */}
          <ul className="flex flex-col gap-2.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Unlock className="size-3.5 shrink-0 text-foreground" />
              <span className="font-medium text-foreground">{quotaLabel(plan.unlocksPerPeriod, "contact unlocks")}</span>
              <span>per period</span>
            </li>
            <li className="flex items-center gap-2">
              <FileText className="size-3.5 shrink-0 text-foreground" />
              <span className="font-medium text-foreground">{quotaLabel(plan.activeOffersLimit, "active offers")}</span>
            </li>
            {plan.cvScreeningsPerPeriod === 0 ? (
              <li className="flex items-center gap-2">
                <FileSearch className="size-3.5 shrink-0 text-foreground" />
                <span>No CV screening</span>
              </li>
            ) : (
              <li className="flex items-start gap-2">
                <FileSearch className="mt-0.5 size-3.5 shrink-0 text-foreground" />
                <span>
                  <span className="font-medium text-foreground">{quotaLabel(plan.cvScreeningsPerPeriod, "CVs screened")}</span>{" "}
                  per period
                  <span className="block text-xs">
                    {plan.cvBatchMax} per upload · {plan.cvFileMaxMb} MB max · kept {plan.cvRetentionDays} days ·{" "}
                    {plan.cvChatQuestions ? `${plan.cvChatQuestions} questions per CV` : "no chat"}
                  </span>
                </span>
              </li>
            )}
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="size-3.5 shrink-0 text-emerald-500" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t bg-muted/30">
          <p className="text-muted-foreground text-xs">Display order {plan.sortOrder}</p>
        </div>
      </div>

      <AlertDialog open={toggleOpen} onOpenChange={setToggleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{plan.isActive ? "Deactivate plan?" : "Activate plan?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {plan.isActive
                ? `"${plan.name}" will no longer be offered to businesses. Running periods continue until they end.`
                : `"${plan.name}" will be offered to businesses in their space.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => doToggle()}
              disabled={isToggling}
              className={plan.isActive ? "" : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs border-0 outline-none ring-0"}
            >
              {isToggling ? "Saving…" : plan.isActive ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PlanDialog open={editOpen} onOpenChange={setEditOpen} plan={plan} />
    </>
  );
}
