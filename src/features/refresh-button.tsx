import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { refreshDashboard } from "#/lib/api/dashboard-controller";
import { cn } from "#/lib/utils";

/**
 * Reloads what the current page shows: the dashboard's figures, and any list
 * or chart that is on screen.
 *
 * The server keeps the dashboard figures for two minutes, so the cache is
 * cleared there first; refetching alone could bring back the same numbers.
 */
export function RefreshButton() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (busy) return;
    setBusy(true);
    try {
      // A failed cache clear still deserves a refetch: worst case the figures
      // are up to two minutes old, as before.
      await refreshDashboard().catch(() => undefined);
      await queryClient.invalidateQueries({ refetchType: "active" });
      toast.success("Up to date");
    } catch {
      toast.error("Couldn't refresh. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => void refresh()}
      disabled={busy}
      aria-label="Refresh"
      title="Refresh"
    >
      <RefreshCw className={cn("h-[1.1rem] w-[1.1rem]", busy && "animate-spin")} />
    </Button>
  );
}
