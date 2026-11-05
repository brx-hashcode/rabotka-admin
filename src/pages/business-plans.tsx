import { useState, type ReactNode } from "react";
import { Building2, Plus } from "lucide-react";
import { PageListHeader } from "#/components/page-list-header";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { PlanCard } from "#/features/business-plans/components/plan-card";
import { PlanDialog } from "#/features/business-plans/components/plan-dialog";
import { useBusinessPlansList } from "#/hooks/use-business-plans-list";
import { useRole } from "#/hooks/use-role";

/**
 * Business subscription plans: prices, quotas and what each includes. A plan
 * is deactivated, never deleted — past periods point to it. The trial plan and
 * renewal reminders are in Settings → Business plans.
 */
export default function BusinessPlansPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: plans, isLoading } = useBusinessPlansList();
  const { canManageContent } = useRole();

  let listSection: ReactNode;

  if (isLoading) {
    listSection = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`plan-skeleton-${i + 1}`} className="h-72 rounded-2xl" />
        ))}
      </div>
    );
  } else if (plans.length === 0) {
    listSection = (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <div className="bg-muted rounded-full p-5">
          <Building2 className="size-10 text-muted-foreground" />
        </div>
        <p className="font-medium text-lg">No plans yet</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          Plans define what business subscriptions cost and include: contact unlocks, active offers, preselection,
          field agents and priority.
        </p>
        {canManageContent && (
          <Button className="mt-2" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Create your first plan
          </Button>
        )}
      </div>
    );
  } else {
    // Custom plans apart: each is one business's, made from its Subscription card.
    const catalog = plans.filter((p) => !p.businessId);
    const custom = plans.filter((p) => p.businessId);
    const grid = (list: typeof plans) => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.map((plan) => (
          <PlanCard key={plan.id} plan={plan} canManage={canManageContent} />
        ))}
      </div>
    );
    listSection = (
      <div className="space-y-10">
        {grid(catalog)}
        {custom.length > 0 && (
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">Custom plans</h2>
              <p className="text-muted-foreground text-sm">
                Each made for one business, the only one to see it. Create one from the business&apos;s Subscription
                card (Assign plan).
              </p>
            </div>
            {grid(custom)}
          </section>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageListHeader
        title="Business Plans"
        description="Subscription plans offered to business accounts. New prices apply to new purchases."
        actions={
          canManageContent ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New Plan
            </Button>
          ) : undefined
        }
      />

      {listSection}

      <PlanDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
