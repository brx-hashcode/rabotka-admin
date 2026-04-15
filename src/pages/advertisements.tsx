import { useState, type ReactNode } from "react";
import { Plus, Megaphone } from "lucide-react";
import { useQueryState, parseAsString } from "nuqs";
import { PageListHeader } from "#/components/page-list-header";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { AdvertisementCard } from "#/features/advertisements/components/advertisement-card";
import { AdvertisementDialog } from "#/features/advertisements/components/advertisement-dialog";
import { useAdvertisementsList } from "#/hooks/use-advertisements-list";
import { ADVERTISEMENT_STATUS_LABELS } from "#/lib/status-labels";

const ALL = "__all__";

export default function AdvertisementsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useAdvertisementsList();

  const [status, setStatus] = useQueryState("status", parseAsString.withDefault(""));

  let listSection: ReactNode;

  if (isLoading) {
    listSection = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={`ad-skeleton-${i + 1}`} className="h-96 rounded-2xl" />
        ))}
      </div>
    );
  } else if (data.length === 0) {
    listSection = (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <div className="bg-muted rounded-full p-5">
          <Megaphone className="size-10 text-muted-foreground" />
        </div>
        <p className="font-medium text-lg">No advertisements yet</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          Create your first advertisement campaign to start reaching your audience.
        </p>
        <Button className="mt-2" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New Advertisement
        </Button>
      </div>
    );
  } else {
    listSection = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((ad) => (
          <AdvertisementCard key={ad.id} advertisement={ad} />
        ))}
      </div>
    );
  }

  return (
    <div className="pt-6">
      <PageListHeader
        title="Advertisements"
        description="Review, approve and manage all advertisement campaigns."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New Advertisement
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Select
          value={status || ALL}
          onValueChange={(v) => setStatus(v === ALL ? "" : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {Object.entries(ADVERTISEMENT_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {listSection}

      <AdvertisementDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
