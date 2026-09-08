import { useState } from "react";
import { IconFileText } from "@tabler/icons-react";

import type { AdminKycDocumentItem } from "#/lib/api/profiles-controller";
import { kycDocumentRawUrl } from "#/lib/api/profiles-controller";
import { getVerificationStatusLabel } from "#/lib/status-labels";

import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { Card } from "#/components/ui/card";

import { docCategoryLabel, docTypeLabel } from "../helpers";
import { getVerificationStatusBadgeClass } from "#/features/applications/components/profile-columns";

type Props = {
  profileId: string;
  doc: AdminKycDocumentItem;
  onPreview: () => void;
};

export function KycDocumentCard({ profileId, doc, onPreview }: Props) {
  // The fetch can still fail after the server said the file was there — the
  // object could have gone missing between the two requests. Without this the
  // browser paints its own broken-image glyph and the card says nothing, which
  // reads as "the document is missing" rather than "loading it failed".
  const [failed, setFailed] = useState(false);

  const available = doc.fileAvailable && !failed;
  const isImage = available && doc.contentKind === "image";

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0">
      <div className="bg-muted relative flex h-36 items-center justify-center">
        {isImage ? (
          <img
            src={kycDocumentRawUrl(profileId, doc.id)}
            alt={docCategoryLabel(doc.documentCategory)}
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <IconFileText className="text-muted-foreground size-12" />
            {!available && (
              <span className="text-muted-foreground text-[10px]">
                Fichier indisponible
              </span>
            )}
          </div>
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
          disabled={!available}
        >
          {available ? "Preview" : "Indisponible"}
        </Button>
      </div>
    </Card>
  );
}
