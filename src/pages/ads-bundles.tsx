import { useState, type ReactNode } from "react";
import { Plus, Megaphone } from "lucide-react";
import { PageListHeader } from "#/components/page-list-header";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { BundleCard } from "#/features/ads-bundles/components/bundle-card";
import { BundleDialog } from "#/features/ads-bundles/components/bundle-dialog";
import { useBundlesList } from "#/hooks/use-bundles-list";

export default function AdsBundlesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: bundles, isLoading } = useBundlesList();

  let listSection: ReactNode;

  if (isLoading) {
    listSection = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={`bundle-skeleton-${i + 1}`}
            className="h-52 rounded-2xl"
          />
        ))}
      </div>
    );
  } else if (bundles.length === 0) {
    listSection = (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <div className="bg-muted rounded-full p-5">
          <Megaphone className="size-10 text-muted-foreground" />
        </div>
        <p className="font-medium text-lg">No bundles yet</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          Bundles define the pricing, reach, and delivery channels for ad
          campaigns.
        </p>
        <Button className="mt-2" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Create your first bundle
        </Button>
      </div>
    );
  } else {
    listSection = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {bundles.map((bundle) => (
          <BundleCard key={bundle.id} bundle={bundle} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <PageListHeader
        title="Advertisements Bundles"
        description="Manage advertisement bundles available for campaigns."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New Bundle
          </Button>
        }
      />

      {listSection}

      <BundleDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
