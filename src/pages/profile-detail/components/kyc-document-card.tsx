import { IconFileText } from "@tabler/icons-react";

import type { AdminKycDocumentItem } from "#/lib/api/profiles-controller";
import { getVerificationStatusLabel } from "#/lib/status-labels";

import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { Card } from "#/components/ui/card";

import { docCategoryLabel, docTypeLabel } from "../helpers";
import { getVerificationStatusBadgeClass } from "#/features/applications/components/profile-columns";
import { isLikelyImageAsset } from "#/lib/media/is-likely-image-asset";

type Props = {
  doc: AdminKycDocumentItem;
  onPreview: () => void;
};

export function KycDocumentCard({ doc, onPreview }: Props) {
  const isImage = isLikelyImageAsset(doc.documentUrl);

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0">
      <div className="bg-muted relative flex h-36 items-center justify-center">
        {isImage ? (
          <img
            src={doc.documentUrl}
            alt={docCategoryLabel(doc.documentCategory)}
            className="h-full w-full object-cover"
          />
        ) : (
          <IconFileText className="text-muted-foreground size-12" />
        )}
        <Badge
          className={`absolute top-2 right-2 ${getVerificationStatusBadgeClass(doc.verificationStatus)}`}
        >
          {getVerificationStatusLabel(doc.verificationStatus)}
        </Badge>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium">
          {docCategoryLabel(doc.documentCategory)}
        </p>
        <p className="text-muted-foreground text-xs">
          {docTypeLabel(doc.documentType)}
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
