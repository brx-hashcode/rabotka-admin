import { useState } from "react";
import { PageListHeader } from "#/components/page-list-header";
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
    <div className="flex h-full flex-col gap-4 pt-6">
      <PageListHeader
        title="Expense Claims"
        description="Review and manage worker and employer claims from the board."
        actions={
          canManageContent ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              Add a Claim
            </Button>
          ) : null
        }
      />
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
