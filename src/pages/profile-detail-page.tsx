import { useState } from "react";
import {
  IconShieldCheck,
  IconPlayerPlay,
  IconPlayerPause,
  IconBrandWhatsapp,
  IconChevronDown,
  IconFileText,
} from "@tabler/icons-react";
import { useQueryState, parseAsStringEnum } from "nuqs";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useProfileDetail } from "#/hooks/use-profile-detail";
import type { ViewerDocument } from "./profile-detail/components/document-viewer-drawer";

import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";

import { ProfileForm } from "./profile-detail/components/profile-form";
import { ProfileGeneralSummary } from "./profile-detail/components/profile-general-summary";
import { ProfileKycContent } from "./profile-detail/components/profile-kyc-content";
import { ProfileBusinessContent } from "./profile-detail/components/profile-business-content";
import { ProfilePaymentsContent } from "./profile-detail/components/profile-payments-content";
import { ProfileReferralsContent } from "./profile-detail/components/profile-referrals-content";
import { ProfileInvoicesContent } from "./profile-detail/components/profile-invoices-content";
import { ProfileMessagesContent } from "./profile-detail/components/profile-messages-content";
import { ProfileVovaMemory } from "./profile-detail/components/profile-vova-memory";
import { ProfilePortfolioContent } from "./profile-detail/components/profile-portfolio-content";
import { ProfileNotificationsContent } from "./profile-detail/components/profile-notifications-content";
import { ProfileTimeline } from "./profile-detail/components/profile-timeline";
import { KycVerificationModal } from "./profile-detail/components/kyc-verification-modal";
import { StatusVerificationModal } from "./profile-detail/components/status-verification-modal";
import { DocumentViewerDrawer } from "./profile-detail/components/document-viewer-drawer";
import { ConfirmDialog } from "#/features/team/components/confirm-dialog";
import {
  sendVerificationLink,
  downloadAdminProfileAgreement,
} from "#/lib/api/profiles-controller";
import type {
  AdminVerifyDocumentRef,
  AdminUpdateProfileParams,
} from "#/lib/api/profiles-controller";
import { useRole } from "#/hooks/use-role";

type ProfileTab =
  | "general"
  | "business"
  | "kyc"
  | "payments"
  | "invoices"
  | "referrals"
  | "messages"
  | "notifications"
  | "portfolio";

const PROFILE_TABS: { label: string; value: ProfileTab }[] = [
  { label: "General", value: "general" },
  { label: "Business", value: "business" },
  { label: "Identity check (KYC)", value: "kyc" },
  { label: "Payments", value: "payments" },
  { label: "Invoices", value: "invoices" },
  { label: "Parrainage", value: "referrals" },
  { label: "Messages", value: "messages" },
  { label: "Notifications", value: "notifications" },
  { label: "Portfolio", value: "portfolio" },
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
    updateAvatar: submitAvatarUpdate,
    isUploadingAvatar,
    logs,
    isLoadingLogs,
    setBotPaused,
    isTogglingBotPause,
  } = useProfileDetail(profileId);

  const [sendVerifLinkOpen, setSendVerifLinkOpen] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalTarget, setStatusModalTarget] = useState<
    "ACTIVE" | "SUSPENDED"
  >("ACTIVE");
  const [drawerDoc, setDrawerDoc] = useState<ViewerDocument | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoadingAgreement, setIsLoadingAgreement] = useState(false);

  const { mutate: sendVerifLink, isPending: isSendingVerifLink } = useMutation({
    mutationFn: () => sendVerificationLink(profileId),
    onSuccess: () => {
      setSendVerifLinkOpen(false);
      toast.success("WhatsApp verification link sent.");
    },
    onError: () => {
      toast.error("Failed to send verification link.");
    },
  });

  // Only the changed fields — ProfileForm diffs against what it loaded, so the
  // activity timeline lists what was actually edited rather than every field on
  // the form.
  const handleSave = async (data: AdminUpdateProfileParams) => {
    await submitUpdate(data);
  };

  const handleKycSubmit = async (
    decision: "VERIFIED" | "REJECTED",
    reason: string,
    documents?: AdminVerifyDocumentRef[],
  ) => {
    await submitVerify({ decision, reason, documents });
    setKycModalOpen(false);
  };

  const handleStatusSubmit = async (
    status: "ACTIVE" | "SUSPENDED",
    reason?: string,
  ) => {
    await submitStatus({ status, reason });
    setStatusModalOpen(false);
  };

  const handlePreviewDoc = (doc: ViewerDocument) => {
    setDrawerDoc(doc);
    setDrawerOpen(true);
  };

  async function handleViewAgreement() {
    setIsLoadingAgreement(true);
    try {
      const blob = await downloadAdminProfileAgreement(profileId);
      const objectUrl = URL.createObjectURL(blob);
      handlePreviewDoc({
        url: objectUrl,
        title: "Accord Plateforme",
        description: `Agreement — ${profile?.firstName} ${profile?.lastName}`,
        fileType: "pdf",
        onDownload: () => {
          const a = globalThis.document.createElement("a");
          a.href = objectUrl;
          a.download = `accord_${profile?.firstName ?? ""}_${profile?.lastName ?? ""}.pdf`;
          a.click();
        },
      });
    } catch {
      toast.error("Failed to load agreement document");
    } finally {
      setIsLoadingAgreement(false);
    }
  }

  const { canManageContent } = useRole();

  const canVerifyKyc =
    profile != null && profile.verificationStatus !== "VERIFIED";
  /**
   * Activation requires a verified identity.
   *
   * Verifying KYC already sets the account ACTIVE — `ProfileService` flips
   * `status` and `whatsapp_connected` in the same transaction as the decision,
   * because "a verified profile left PENDING_ACTIVATION can do nothing". So for
   * an unverified profile this item was either redundant (KYC verification is
   * about to do it anyway) or wrong (it activates an account whose identity
   * nobody has checked), and admins were clicking it twice because neither
   * outcome was visible from here.
   *
   * What it leaves enabled is the case that actually needs it: re-activating a
   * verified profile that was suspended.
   */
  const canActivate =
    profile != null &&
    profile.status !== "ACTIVE" &&
    profile.status !== "BANNED" &&
    profile.verificationStatus === "VERIFIED";
  /**
   * Disabled specifically because the identity is unverified — as opposed to
   * because the account is already active or banned. Only this case gets a
   * reason printed, because only this case has something the admin can do
   * about it, one item up in the same menu.
   */
  const activateBlockedByKyc =
    profile != null &&
    profile.status !== "ACTIVE" &&
    profile.status !== "BANNED" &&
    profile.verificationStatus !== "VERIFIED";

  const canDeactivate = profile?.status === "ACTIVE";
  const canSendVerifLink = profile?.whatsappConnected === false;

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
                <Skeleton
                  key={`skeleton-${i + 1}`}
                  className="h-20 rounded-lg"
                />
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

  const isWorker = profile.profileType === "WORKER";
  // A business has no personal KYC: its organisation's papers, in the
  // « Business » tab, are what get reviewed — so it shows one or the other.
  const visibleTabs = PROFILE_TABS.filter(
    (t) =>
      (t.value !== "portfolio" || isWorker) &&
      (t.value !== "business" || profile.isBusiness) &&
      (t.value !== "kyc" || !profile.isBusiness),
  );

  return (
    <div className="space-y-6 pt-6">
      <Tabs
        value={tabValue}
        onValueChange={(value) => setActiveTab(value as ProfileTab)}
        className="w-full space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList className="h-9 w-full sm:w-auto">
            {visibleTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="cursor-pointer uppercase text-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleViewAgreement} disabled={isLoadingAgreement}>
              <IconFileText className="size-4" />
              {isLoadingAgreement ? "Loading..." : "View Agreement"}
            </Button>

            {canManageContent && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">
                    Actions
                    <IconChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    disabled={!canSendVerifLink}
                    onClick={() => canSendVerifLink && setSendVerifLinkOpen(true)}
                  >
                    <IconBrandWhatsapp className="size-4" />
                    Send verification link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!canVerifyKyc}
                    onClick={() => canVerifyKyc && setKycModalOpen(true)}
                  >
                    <IconShieldCheck className="size-4" />
                    Check identity (KYC)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={!canActivate}
                    onClick={() => {
                      if (!canActivate) return;
                      setStatusModalTarget("ACTIVE");
                      setStatusModalOpen(true);
                    }}
                  >
                    <IconPlayerPlay className="size-4" />
                    <span className="flex flex-col">
                      Activate
                      {activateBlockedByKyc && (
                        <span className="text-xs text-muted-foreground">
                          Check the identity first — that activates the account
                        </span>
                      )}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!canDeactivate}
                    onClick={() => {
                      if (!canDeactivate) return;
                      setStatusModalTarget("SUSPENDED");
                      setStatusModalOpen(true);
                    }}
                  >
                    <IconPlayerPause className="size-4" />
                    Suspend
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                onAvatarChange={submitAvatarUpdate}
                isUploadingAvatar={isUploadingAvatar}
                readOnly={!canManageContent}
                onPreviewDoc={handlePreviewDoc}
              />
            </div>
            <div className="col-span-5 min-w-0 space-y-6 lg:col-span-2">
              <ProfileGeneralSummary profile={profile} />
              <ProfileTimeline logs={logs} isLoading={isLoadingLogs} />
            </div>
          </div>
        </TabsContent>

        {profile.isBusiness && (
          <TabsContent value="business">
            <ProfileBusinessContent profileId={profileId} onPreviewDoc={handlePreviewDoc} />
          </TabsContent>
        )}

        <TabsContent value="kyc">
          <ProfileKycContent
            profile={profile}
            onPreviewDoc={handlePreviewDoc}
          />
        </TabsContent>

        <TabsContent value="payments">
          <ProfilePaymentsContent profileId={profileId} />
        </TabsContent>

        <TabsContent value="referrals">
          <ProfileReferralsContent profileId={profileId} />
        </TabsContent>

        <TabsContent value="invoices">
          <ProfileInvoicesContent profileId={profileId} />
        </TabsContent>

        <TabsContent value="messages" className="flex flex-col gap-4">
          <ProfileMessagesContent
            profileId={profileId}
            profileName={`${profile.firstName} ${profile.lastName}`}
            profileType={profile.profileType}
            firstName={profile.firstName}
            botPausedUntil={profile.botPausedUntil}
            onBotPausedChange={(paused) => void setBotPaused(paused)}
            isTogglingBotPause={isTogglingBotPause}
          />
          {/* Under the transcript, because a puzzling answer up there is usually
              explained by a line down here. */}
          <ProfileVovaMemory
            profileId={profileId}
            profileName={`${profile.firstName} ${profile.lastName}`}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <ProfileNotificationsContent profileId={profileId} />
        </TabsContent>

        {isWorker && (
          <TabsContent value="portfolio">
            <ProfilePortfolioContent
              profileId={profileId}
              onPreviewDoc={handlePreviewDoc}
            />
          </TabsContent>
        )}
      </Tabs>

      <ConfirmDialog
        open={sendVerifLinkOpen}
        onOpenChange={setSendVerifLinkOpen}
        title="Send verification link"
        description="This will generate a new WhatsApp verification link and send it to the profile's phone number. Any previous link will remain valid until it expires."
        actionLabel="Send via WhatsApp"
        onConfirm={() => sendVerifLink()}
        isPending={isSendingVerifLink}
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
