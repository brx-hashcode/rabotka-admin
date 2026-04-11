import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
  ClaimBoard,
  CreateClaimModal,
  ClaimDetailSheet,
} from "#/features/claims";
import type { AdminClaimItem } from "#/lib/api/claims-controller";
import { useRole } from "#/hooks/use-role";

export default function ClaimsPage() {
  const [selectedClaim, setSelectedClaim] = useState<AdminClaimItem | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const { canManageContent } = useRole();

  return (
    <div className="flex flex-col gap-4 h-full pt-6">
      <div className="flex items-center justify-end">
        {canManageContent && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            Add a Claim
          </Button>
        )}
      </div>
      <ClaimBoard onViewDetail={setSelectedClaim} />
      <CreateClaimModal open={createOpen} onOpenChange={setCreateOpen} />
      {selectedClaim && (
        <ClaimDetailSheet
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
        />
      )}
    </div>
  );
}
