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
import { ProfilePaymentsContent } from "./profile-detail/components/profile-payments-content";
import { ProfileMessagesContent } from "./profile-detail/components/profile-messages-content";
import { ProfileTimeline } from "./profile-detail/components/profile-timeline";
import { KycVerificationModal } from "./profile-detail/components/kyc-verification-modal";
import { StatusVerificationModal } from "./profile-detail/components/status-verification-modal";
import { DocumentViewerDrawer } from "./profile-detail/components/document-viewer-drawer";
import { ConfirmDialog } from "#/features/team/components/confirm-dialog";

type ProfileTab = "general" | "kyc" | "payments" | "messages";

const PROFILE_TABS: { label: string; value: ProfileTab }[] = [
  { label: "General", value: "general" },
  { label: "KYC Information", value: "kyc" },
  { label: "Payments", value: "payments" },
  { label: "Messages", value: "messages" },
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

  const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalTarget, setStatusModalTarget] = useState<
    "ACTIVE" | "SUSPENDED"
  >("ACTIVE");
  const [drawerDoc, setDrawerDoc] = useState<ViewerDocument | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    setConfirmPaymentOpen(false);
  };

  const handlePreviewDoc = (doc: ViewerDocument) => {
    setDrawerDoc(doc);
    setDrawerOpen(true);
  };

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
              <Skeleton key={`skeleton-${i + 1}`} className="h-12 w-full" />
            ))}
          </div>
          <div className="col-span-5 space-y-4 lg:col-span-2">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={`skeleton-${i + 1}`} className="h-20 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="space-y-6 pt-6">
      <Tabs
        value={tabValue}
        onValueChange={(value) => setActiveTab(value as ProfileTab)}
        className="w-full"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList className="h-9 w-full sm:w-auto">
            {PROFILE_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="cursor-pointer"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {canConfirmPayment && (
              <Button
                variant="default"
                onClick={() => setConfirmPaymentOpen(true)}
              >
                <IconCreditCard className="size-4" />
                Confirm Payment
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

        <TabsContent value="kyc">
          <ProfileKycContent
            profile={profile}
            onPreviewDoc={handlePreviewDoc}
          />
        </TabsContent>

        <TabsContent value="payments">
          <ProfilePaymentsContent
            profileId={profileId}
            onPreviewDoc={handlePreviewDoc}
          />
        </TabsContent>

        <TabsContent value="messages">
          <ProfileMessagesContent
            profileId={profileId}
            profileName={`${profile.firstName} ${profile.lastName}`}
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmPaymentOpen}
        onOpenChange={setConfirmPaymentOpen}
        title="Confirm payment"
        description="This will manually mark the payment as confirmed and activate the profile's account. Only do this if you have verified the payment outside the system."
        actionLabel="Confirm payment"
        onConfirm={handleConfirmPayment}
        isPending={isConfirmingPayment}
        variant="default"
      />

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
