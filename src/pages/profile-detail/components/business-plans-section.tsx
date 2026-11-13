import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconChevronDown, IconPlus, IconStack2 } from "@tabler/icons-react";
import { Button } from "#/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "#/components/ui/dropdown-menu";
import { Skeleton } from "#/components/ui/skeleton";
import { PlanCard } from "#/features/business-plans/components/plan-card";
import { PlanDialog } from "#/features/business-plans/components/plan-dialog";
import { useBusinessPlansList } from "#/hooks/use-business-plans-list";
import { useRole } from "#/hooks/use-role";
import type { BusinessPlan } from "#/lib/api/business-plans-controller";
import { getProfileBusiness } from "#/lib/api/profiles-controller";

/**
 * The plans made for this business alone (custom plans): they live here, not
 * on the global Business plans page, which keeps the public catalog. A new one
 * starts from a catalog plan's prices and quotas.
 */
export function BusinessPlansSection({ profileId }: Readonly<{ profileId: string }>) {
  const { canManageContent } = useRole();
  const { data: business } = useQuery({
    queryKey: ["admin-profile-business", profileId],
    queryFn: () => getProfileBusiness(profileId),
  });
  const { data: plans, isLoading } = useBusinessPlansList();
  const [template, setTemplate] = useState<BusinessPlan | null>(null);

  if (isLoading || !business) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={`custom-plan-skeleton-${i + 1}`} className="h-72 rounded-2xl" />
        ))}
      </div>
    );
  }

  const own = plans.filter((p) => p.businessId === business.id);
  const catalog = plans.filter((p) => !p.businessId && p.isActive);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Custom plans</h2>
          <p className="text-muted-foreground text-sm">
            Made for {business.name} alone, the only business to see them. Assign one from Organisation › Subscription.
          </p>
        </div>
        {canManageContent && catalog.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <IconPlus className="size-4" />
                New custom plan
                <IconChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {catalog.map((p) => (
                <DropdownMenuItem key={p.id} onSelect={() => setTemplate(p)}>
                  From {p.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {own.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-muted/40 py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <IconStack2 className="size-8 text-muted-foreground" />
          </div>
          <p className="font-medium">No custom plan</p>
          <p className="max-w-sm text-muted-foreground text-sm">
            {business.name} subscribes to the public catalog. Make a custom plan when it needs its own prices or quotas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {own.map((plan) => (
            <PlanCard key={plan.id} plan={plan} canManage={canManageContent} />
          ))}
        </div>
      )}

      <PlanDialog
        open={!!template}
        onOpenChange={(o) => !o && setTemplate(null)}
        template={template ?? undefined}
        forBusiness={{ id: business.id, name: business.name }}
      />
    </div>
  );
}
