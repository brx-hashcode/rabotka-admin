import { IconFileText, IconShieldCheck } from "@tabler/icons-react";

import type {
  AdminProfileDetailResponse,
  AdminVerificationImageItem,
} from "#/lib/api/profiles-controller";
import { getVerificationStatusLabel } from "#/lib/status-labels";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

import { statusBadgeVariant, formatDate } from "../helpers";
import { KycDocumentCard } from "./kyc-document-card";
import type { ViewerDocument } from "./document-viewer-drawer";
import { toKycViewerDoc } from "./document-viewer-drawer";
import { isLikelyImageAsset } from "#/lib/media/is-likely-image-asset";

type Props = {
  profile: AdminProfileDetailResponse;
  onPreviewDoc: (doc: ViewerDocument) => void;
};

export function ProfileKycContent({ profile, onPreviewDoc }: Readonly<Props>) {
  return (
    <div className="space-y-6">
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

      {profile.kycVerificationNote && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Verification decision note</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={
                profile.verificationStatus === "REJECTED"
                  ? "bg-destructive/10 text-destructive rounded p-3 text-sm"
                  : "bg-muted rounded p-3 text-sm"
              }
            >
              {profile.kycVerificationNote}
            </p>
          </CardContent>
        </Card>
      )}

      {!profile.kycVerificationNote && profile.rejectionReason && (
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

      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase">Documents</h3>
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
                onPreview={() => onPreviewDoc(toKycViewerDoc(doc))}
              />
            ))}
          </div>
        )}
      </div>

      {profile.verificationImages && profile.verificationImages.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-semibold flex items-center gap-2 uppercase tracking-wide">
            <IconShieldCheck className="size-4" />
            Verification Images
          </h3>
          <div className="grid min-w-0 grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {profile.verificationImages.map((img, index) => (
              <VerificationImageCard
                key={img.id}
                image={img}
                index={index}
                onPreview={() =>
                  onPreviewDoc({
                    url: img.imageUrl,
                    title: `Verification Image ${index + 1}`,
                    description: `Uploaded by ${img.uploadedBy ?? "Admin"} — ${formatDate(img.createdAt)}`,
                    fileType: "image",
                  })
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VerificationImageCard({
  image,
  index,
  onPreview,
}: Readonly<{
  image: AdminVerificationImageItem;
  index: number;
  onPreview: () => void;
}>) {
  const isImage = isLikelyImageAsset(image.imageUrl);

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0">
      <div className="bg-muted relative flex h-36 items-center justify-center">
        {isImage ? (
          <img
            src={image.imageUrl}
            alt={`Verification ${index + 1}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <IconFileText className="text-muted-foreground size-12" />
        )}
        <Badge
          variant="outline"
          className="absolute top-2 right-2 bg-background/80"
        >
          <IconShieldCheck className="mr-1 size-3" />
          Verification
        </Badge>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium">Verification Image {index + 1}</p>
        <p className="text-muted-foreground text-xs">
          {image.uploadedBy ?? "Admin"}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={onPreview}
        >
          Preview
        </Button>
      </div>
    </Card>
  );
}
