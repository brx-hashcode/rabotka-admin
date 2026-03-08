import { useState } from "react";
import { IconShieldCheck, IconUserCheck } from "@tabler/icons-react";

import { useProfileDetail } from "#/hooks/use-profile-detail";
import type { AdminKycDocumentItem } from "#/lib/api/profiles-controller";
import { getProfileTypeLabel } from "#/lib/status-labels";

import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";

import { ProfileForm } from "./profile-detail/components/profile-form";
import { ProfileSummary } from "./profile-detail/components/profile-summary";
import { KycVerificationModal } from "./profile-detail/components/kyc-verification-modal";
import { StatusVerificationModal } from "./profile-detail/components/status-verification-modal";
import { DocumentViewerDrawer } from "./profile-detail/components/document-viewer-drawer";

export default function ProfileDetailPage({
  profileId,
}: {
  profileId: string;
}) {
  const {
    profile,
    isLoading,
    isError,
    updateProfile: submitUpdate,
    isUpdating,
    verifyProfile: submitVerify,
    isVerifying,
    updateStatus: submitStatus,
    isUpdatingStatus,
  } = useProfileDetail(profileId);

  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [drawerDoc, setDrawerDoc] = useState<AdminKycDocumentItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Handlers
  const handleSave = async (data: {
    firstName: string;
    lastName: string;
    address: string;
    description: string;
  }) => {
    await submitUpdate(data);
  };

  const handleKycSubmit = async (
    decision: "VERIFIED" | "REJECTED",
    reason?: string,
  ) => {
    await submitVerify({ decision, reason });
    setKycModalOpen(false);
  };

  const handleStatusSubmit = async (status: string) => {
    await submitStatus({ status });
    setStatusModalOpen(false);
  };

  const handlePreviewDoc = (doc: AdminKycDocumentItem) => {
    setDrawerDoc(doc);
    setDrawerOpen(true);
  };

  // Conditional action visibility based on current status
  const showKycAction =
    profile != null && profile.verificationStatus !== "VERIFIED";
  const showStatusAction =
    profile != null && profile.status !== "BANNED";

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-5 space-y-4 lg:col-span-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
          <div className="col-span-5 space-y-4 lg:col-span-2">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !profile) {
    return (
      <div className="flex h-64 items-center justify-center pt-4">
        <p className="text-muted-foreground">
          Failed to load profile. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Header + Action bar */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold">
            {profile.firstName} {profile.lastName}
          </h2>
          <p className="text-muted-foreground text-sm">
            {getProfileTypeLabel(profile.profileType)} — {profile.email}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showKycAction && (
            <Button variant="outline" onClick={() => setKycModalOpen(true)}>
              <IconShieldCheck className="size-4" />
              KYC Verification
            </Button>
          )}
          {showStatusAction && (
            <Button variant="outline" onClick={() => setStatusModalOpen(true)}>
              <IconUserCheck className="size-4" />
              Status Verification
            </Button>
          )}
        </div>
      </div>

      {/* Main 5-column grid */}
      <div className="grid grid-cols-5 gap-6">
        {/* Left — 3 cols */}
        <div className="col-span-5 lg:col-span-3">
          <ProfileForm
            profile={profile}
            onSave={handleSave}
            isSaving={isUpdating}
          />
        </div>

        {/* Right — 2 cols */}
        <div className="col-span-5 lg:col-span-2">
          <ProfileSummary
            profile={profile}
            onPreviewDoc={handlePreviewDoc}
          />
        </div>
      </div>

      {/* Modals — only mounted when relevant */}
      {showKycAction && (
        <KycVerificationModal
          open={kycModalOpen}
          onOpenChange={setKycModalOpen}
          profile={profile}
          onSubmit={handleKycSubmit}
          isPending={isVerifying}
        />
      )}

      {showStatusAction && (
        <StatusVerificationModal
          open={statusModalOpen}
          onOpenChange={setStatusModalOpen}
          currentStatus={profile.status}
          onSubmit={handleStatusSubmit}
          isPending={isUpdatingStatus}
        />
      )}

      <DocumentViewerDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        document={drawerDoc}
      />
    </div>
  );
}
