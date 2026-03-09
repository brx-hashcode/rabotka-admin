import { useState } from "react";
import {
  IconShieldCheck,
  IconPlayerPlay,
  IconPlayerPause,
  IconCreditCard,
} from "@tabler/icons-react";
import { useQueryState, parseAsStringEnum } from "nuqs";

import { useProfileDetail } from "#/hooks/use-profile-detail";
import type { ViewerDocument } from "./profile-detail/components/document-viewer-drawer";

import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";

import { ProfileForm } from "./profile-detail/components/profile-form";
import { ProfileGeneralSummary } from "./profile-detail/components/profile-general-summary";
import { ProfileKycContent } from "./profile-detail/components/profile-kyc-content";
import { ProfileTimeline } from "./profile-detail/components/profile-timeline";
import { KycVerificationModal } from "./profile-detail/components/kyc-verification-modal";
import { StatusVerificationModal } from "./profile-detail/components/status-verification-modal";
import { DocumentViewerDrawer } from "./profile-detail/components/document-viewer-drawer";

type ProfileTab = "general" | "kyc";

const PROFILE_TABS: { label: string; value: ProfileTab }[] = [
  { label: "General", value: "general" },
  { label: "KYC Information", value: "kyc" },
];

const profileTabParser = parseAsStringEnum<ProfileTab>(
  PROFILE_TABS.map((t) => t.value),
).withDefault("general");

export default function ProfileDetailPage({
  profileId,
}: Readonly<{
  profileId: string;
}>) {
  const [activeTab, setActiveTab] = useQueryState("tab", profileTabParser);

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
    confirmPayment: submitConfirmPayment,
    isConfirmingPayment,
    logs,
    isLoadingLogs,
  } = useProfileDetail(profileId);

  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalTarget, setStatusModalTarget] = useState<
    "ACTIVE" | "SUSPENDED"
  >("ACTIVE");
  const [drawerDoc, setDrawerDoc] = useState<ViewerDocument | null>(null);
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
    files?: File[],
  ) => {
    await submitVerify({ decision, reason, files });
    setKycModalOpen(false);
  };

  const handleStatusSubmit = async (
    status: "ACTIVE" | "SUSPENDED",
    reason?: string,
  ) => {
    await submitStatus({ status, reason });
    setStatusModalOpen(false);
  };

  const handleConfirmPayment = async () => {
    await submitConfirmPayment();
  };

  const handlePreviewDoc = (doc: ViewerDocument) => {
    setDrawerDoc(doc);
    setDrawerOpen(true);
  };

  // Conditional actions based on current state
  const canVerifyKyc =
    profile != null && profile.verificationStatus !== "VERIFIED";
  const canActivate =
    profile != null &&
    profile.status !== "ACTIVE" &&
    profile.status !== "BANNED";
  const canDeactivate = profile?.status === "ACTIVE";
  const canConfirmPayment = profile?.status === "PENDING_PAYMENT";

  const tabValue = activeTab ?? "general";

  if (isLoading) {
    return (
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-80" />
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
      <Tabs
        value={tabValue}
        onValueChange={(value) => setActiveTab(value as ProfileTab)}
        className="w-full"
      >
        {/* Header: Tabs + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList className="h-9 w-full sm:w-auto">
            {PROFILE_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {canConfirmPayment && (
              <Button
                variant="default"
                onClick={handleConfirmPayment}
                disabled={isConfirmingPayment}
              >
                <IconCreditCard className="size-4" />
                {isConfirmingPayment ? "Confirming..." : "Confirm Payment"}
              </Button>
            )}
            {canVerifyKyc && (
              <Button variant="outline" onClick={() => setKycModalOpen(true)}>
                <IconShieldCheck className="size-4" />
                KYC Verification
              </Button>
            )}
            {canActivate && !canConfirmPayment && (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusModalTarget("ACTIVE");
                  setStatusModalOpen(true);
                }}
              >
                <IconPlayerPlay className="size-4" />
                Activate
              </Button>
            )}
            {canDeactivate && (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusModalTarget("SUSPENDED");
                  setStatusModalOpen(true);
                }}
              >
                <IconPlayerPause className="size-4" />
                Suspend
              </Button>
            )}
          </div>
        </div>

        {/* General Tab */}
        <TabsContent value="general">
          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-5 min-w-0 lg:col-span-3">
              <ProfileForm
                profile={profile}
                onSave={handleSave}
                isSaving={isUpdating}
              />
            </div>
            <div className="col-span-5 min-w-0 space-y-6 lg:col-span-2">
              <ProfileGeneralSummary profile={profile} />
              <ProfileTimeline logs={logs} isLoading={isLoadingLogs} />
            </div>
          </div>
        </TabsContent>

        {/* KYC Information Tab */}
        <TabsContent value="kyc">
          <ProfileKycContent
            profile={profile}
            onPreviewDoc={handlePreviewDoc}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {canVerifyKyc && (
        <KycVerificationModal
          open={kycModalOpen}
          onOpenChange={setKycModalOpen}
          profile={profile}
          onSubmit={handleKycSubmit}
          isPending={isVerifying}
        />
      )}

      {(canActivate || canDeactivate) && (
        <StatusVerificationModal
          open={statusModalOpen}
          onOpenChange={setStatusModalOpen}
          targetStatus={statusModalTarget}
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
