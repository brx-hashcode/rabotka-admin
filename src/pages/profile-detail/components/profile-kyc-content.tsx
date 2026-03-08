import { IconFileText } from "@tabler/icons-react";

import type {
  AdminProfileDetailResponse,
  AdminKycDocumentItem,
} from "#/lib/api/profiles-controller";
import { getVerificationStatusLabel } from "#/lib/status-labels";

import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

import { statusBadgeVariant, formatDate } from "../helpers";
import { KycDocumentCard } from "./kyc-document-card";

type Props = {
  profile: AdminProfileDetailResponse;
  onPreviewDoc: (doc: AdminKycDocumentItem) => void;
};

export function ProfileKycContent({ profile, onPreviewDoc }: Props) {
  return (
    <div className="space-y-6">
      {/* KYC Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Verification Status
            </p>
            <Badge
              variant={statusBadgeVariant(profile.verificationStatus)}
              className="mt-2"
            >
              {getVerificationStatusLabel(profile.verificationStatus)}
            </Badge>
          </CardContent>
        </Card>

        {profile.verifiedAt && (
          <Card className="gap-2 py-4">
            <CardContent className="px-4">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Verified At
              </p>
              <p className="mt-2 text-sm font-medium">
                {formatDate(profile.verifiedAt)}
              </p>
            </CardContent>
          </Card>
        )}

        {profile.verifiedBy && (
          <Card className="gap-2 py-4">
            <CardContent className="px-4">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Verified By
              </p>
              <p className="mt-2 text-sm font-medium">{profile.verifiedBy}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rejection Reason */}
      {profile.rejectionReason && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rejection Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="bg-destructive/10 text-destructive rounded p-3 text-sm">
              {profile.rejectionReason}
            </p>
          </CardContent>
        </Card>
      )}

      {/* KYC Documents */}
      <div>
        <h3 className="mb-4 text-sm font-semibold">Documents</h3>
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
          <div className="grid min-w-0 grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
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
