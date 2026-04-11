import { IconFileText } from "@tabler/icons-react";

import type {
  AdminProfileDetailResponse,
  AdminKycDocumentItem,
} from "#/lib/api/profiles-controller";
import {
  getAccountStatusLabel,
  getVerificationStatusLabel,
} from "#/lib/status-labels";

import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

import { statusBadgeVariant, formatDate } from "../helpers";
import { KycDocumentCard } from "./kyc-document-card";

type Props = {
  profile: AdminProfileDetailResponse;
  onPreviewDoc: (doc: AdminKycDocumentItem) => void;
};

export function ProfileSummary({ profile, onPreviewDoc }: Props) {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Account Status
            </p>
            <Badge
              variant={statusBadgeVariant(profile.status)}
              className="mt-1"
            >
              {getAccountStatusLabel(profile.status)}
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              KYC Status
            </p>
            <Badge
              variant={statusBadgeVariant(profile.verificationStatus)}
              className="mt-1"
            >
              {getVerificationStatusLabel(profile.verificationStatus)}
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Member Since
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatDate(profile.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Reliability
            </p>
            <p className="mt-1 text-sm font-medium">
              {profile.reliabilityScore != null
                ? `${profile.reliabilityScore}/100`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <p className="text-muted-foreground">Job Offers</p>
            <p className="text-right font-medium">{profile.jobOffersCount}</p>
            <p className="text-muted-foreground">Applications</p>
            <p className="text-right font-medium">
              {profile.applicationsCount}
            </p>
            <p className="text-muted-foreground">Penalties</p>
            <p className="text-right font-medium">{profile.penaltiesCount}</p>
            <p className="text-muted-foreground">Unpaid Penalties</p>
            <p className="text-right font-medium text-red-600">
              {profile.unpaidPenaltiesCount}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Verification details */}
      {(profile.verifiedAt ||
        profile.kycVerificationNote ||
        profile.rejectionReason) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Verification Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {profile.verifiedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verified At</span>
                  <span className="font-medium">
                    {formatDate(profile.verifiedAt)}
                  </span>
                </div>
              )}
              {profile.verifiedBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verified By</span>
                  <span className="font-medium">{profile.verifiedBy}</span>
                </div>
              )}
              {profile.kycVerificationNote && (
                <div className="pt-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Decision note
                  </p>
                  <p
                    className={
                      profile.verificationStatus === "REJECTED"
                        ? "bg-destructive/10 text-destructive mt-1 rounded p-2 text-xs"
                        : "bg-muted mt-1 rounded p-2 text-xs"
                    }
                  >
                    {profile.kycVerificationNote}
                  </p>
                </div>
              )}
              {!profile.kycVerificationNote && profile.rejectionReason && (
                <div className="pt-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Rejection Reason
                  </p>
                  <p className="bg-destructive/10 text-destructive mt-1 rounded p-2 text-xs">
                    {profile.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KYC Documents */}
      <div className="min-w-0">
        <h3 className="mb-3 text-sm font-semibold">KYC Documents</h3>
        {profile.kycDocuments.length === 0 ? (
          <Card className="py-8">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <IconFileText className="text-muted-foreground mb-2 size-10" />
              <p className="text-muted-foreground text-sm">
                No documents uploaded yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid min-w-0 grid-cols-2 gap-3">
            {profile.kycDocuments.map((doc) => (
              <KycDocumentCard
                key={doc.id}
                doc={doc}
                onPreview={() => onPreviewDoc(doc)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
