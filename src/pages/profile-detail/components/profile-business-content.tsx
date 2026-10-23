import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconAlertTriangle,
  IconBuilding,
  IconCheck,
  IconFileText,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import {
  businessDocumentRawUrl,
  getProfileBusiness,
  verifyProfileBusiness,
  verifyProfileBusinessDocument,
  type AdminBusinessDetail,
  type AdminBusinessDocument,
  type VerificationDecision,
} from "#/lib/api/profiles-controller";
import { getVerificationStatusLabel } from "#/lib/status-labels";
import { useRole } from "#/hooks/use-role";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Skeleton } from "#/components/ui/skeleton";
import { Textarea } from "#/components/ui/textarea";
import { getVerificationStatusBadgeClass } from "#/features/applications/components/profile-columns";

import { formatDate } from "../helpers";
import type { ViewerDocument } from "./document-viewer-drawer";

type Props = {
  profileId: string;
  onPreviewDoc: (doc: ViewerDocument) => void;
};

/** What the refusal dialog is about: the business, or one of its papers. */
type Refusing = { kind: "business" } | { kind: "document"; doc: AdminBusinessDocument };

function fileKind(mimeType: string | null): string | undefined {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType?.startsWith("image/")) return "image";
  return undefined;
}

/**
 * The « Business » tab: the organisation behind a business profile, its
 * documents, and the decision — which, for a business, is what verifies and
 * activates the account (there is no personal KYC). The business is told by
 * email and in-app notification; business accounts get no WhatsApp.
 */
export function ProfileBusinessContent({ profileId, onPreviewDoc }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const { canManageContent } = useRole();
  const queryKey = ["admin-profile-business", profileId];
  const { data: business, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => getProfileBusiness(profileId),
  });
  const [refusing, setRefusing] = useState<Refusing | null>(null);
  const [reason, setReason] = useState("");

  const onSaved = (next: AdminBusinessDetail) => {
    queryClient.setQueryData(queryKey, next);
    // The decision changes the profile's own status and verification.
    void queryClient.invalidateQueries({ queryKey: ["admin", "profiles", profileId] });
  };

  const decideBusiness = useMutation({
    mutationFn: (input: { decision: VerificationDecision; reason?: string }) =>
      verifyProfileBusiness(profileId, input),
    onSuccess: (next, input) => {
      onSaved(next);
      toast.success(
        input.decision === "VERIFIED"
          ? "Business approved — the account is active. The business is notified by email."
          : "Business refused. The business is notified by email.",
      );
    },
    onError: (err: Error) => toast.error(err.message || "The decision could not be saved."),
  });

  const decideDocument = useMutation({
    mutationFn: (input: { documentId: string; decision: VerificationDecision; reason?: string }) =>
      verifyProfileBusinessDocument(profileId, input.documentId, {
        decision: input.decision,
        reason: input.reason,
      }),
    onSuccess: (next) => onSaved(next),
    onError: (err: Error) => toast.error(err.message || "The document could not be updated."),
  });

  function confirmRefusal() {
    if (!refusing || !reason.trim()) return;
    if (refusing.kind === "business") {
      decideBusiness.mutate({ decision: "REJECTED", reason: reason.trim() });
    } else {
      decideDocument.mutate({ documentId: refusing.doc.id, decision: "REJECTED", reason: reason.trim() });
    }
    setRefusing(null);
    setReason("");
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (isError || !business) {
    return (
      <Card className="py-8">
        <CardContent className="flex flex-col items-center text-center">
          <IconBuilding className="text-muted-foreground mb-2 size-10" />
          <p className="text-muted-foreground text-sm">No business found for this profile.</p>
        </CardContent>
      </Card>
    );
  }

  const decided = business.verificationStatus !== "PENDING";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Business verification
            </p>
            <Badge className={`mt-2 ${getVerificationStatusBadgeClass(business.verificationStatus)}`}>
              {getVerificationStatusLabel(business.verificationStatus)}
            </Badge>
          </CardContent>
        </Card>
        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Submitted
            </p>
            <p className="mt-2 text-sm font-medium">{formatDate(business.createdAt)}</p>
          </CardContent>
        </Card>
        {business.verifiedAt && (
          <Card className="gap-2 py-4">
            <CardContent className="px-4">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Decided
              </p>
              <p className="mt-2 text-sm font-medium">{formatDate(business.verifiedAt)}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {business.rejectionReason && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Refusal reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="bg-destructive/10 text-destructive rounded p-3 text-sm">
              {business.rejectionReason}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{business.name}</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {business.categoryLabel}
              {business.legalFormLabel ? ` · ${business.legalFormLabel}` : ""}
            </p>
          </div>
          {canManageContent && (
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                onClick={() => setRefusing({ kind: "business" })}
                disabled={decideBusiness.isPending || business.verificationStatus === "REJECTED"}
              >
                <IconX className="size-4" />
                Refuse
              </Button>
              <Button
                onClick={() => decideBusiness.mutate({ decision: "VERIFIED" })}
                disabled={decideBusiness.isPending || business.verificationStatus === "VERIFIED"}
              >
                <IconCheck className="size-4" />
                {decided ? "Approve again" : "Approve business"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Headcount" value={business.size ? `${business.size} employees` : null} />
            <Field label="RCCM" value={business.registrationNumber} />
            <Field label="NIU" value={business.taxId} />
            <Field label="SCIEN / SCIET" value={business.statisticalId} />
            <Field label="Address" value={[business.address, business.city].filter(Boolean).join(", ")} />
            <Field label="Country" value={business.countryCode} />
            <Field label="Contact email" value={business.email} />
            <Field label="Contact phone" value={business.phone} />
            <Field label="Website" value={business.website} />
          </dl>
          {business.description && (
            <p className="text-muted-foreground mt-6 whitespace-pre-line text-sm">{business.description}</p>
          )}
        </CardContent>
      </Card>

      {business.missingDocuments.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p>
            Required for this type and not provided:{" "}
            <span className="font-medium">
              {business.missingDocuments.map((g) => g.map((d) => d.label).join(" or ")).join(", ")}
            </span>
          </p>
        </div>
      )}

      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase">Business documents</h3>
        {business.documents.length === 0 ? (
          <Card className="py-8">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <IconFileText className="text-muted-foreground mb-2 size-10" />
              <p className="text-muted-foreground text-sm">No documents uploaded.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {business.documents.map((doc) => (
              <BusinessDocumentCard
                key={doc.id}
                profileId={profileId}
                doc={doc}
                canDecide={canManageContent}
                pending={decideDocument.isPending}
                onPreview={() =>
                  onPreviewDoc({
                    url: businessDocumentRawUrl(profileId, doc.id),
                    title: doc.label,
                    description: `${doc.fileName ?? "Document"} — Uploaded ${formatDate(doc.createdAt)}`,
                    fileType: fileKind(doc.mimeType),
                  })
                }
                onAccept={() => decideDocument.mutate({ documentId: doc.id, decision: "VERIFIED" })}
                onRefuse={() => setRefusing({ kind: "document", doc })}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!refusing}
        onOpenChange={(open) => {
          if (!open) {
            setRefusing(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {refusing?.kind === "document" ? `Refuse « ${refusing.doc.label} »` : "Refuse this business"}
            </DialogTitle>
            <DialogDescription>
              {refusing?.kind === "document"
                ? "The reason is kept on the document."
                : "The reason is sent to the business by email and in-app notification."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex. : l'extrait RCCM est illisible, merci d'en envoyer une copie nette."
            rows={4}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefusing(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRefusal} disabled={!reason.trim()}>
              Refuse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: Readonly<{ label: string; value: string | null | undefined }>) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 break-words font-medium">{value || "—"}</dd>
    </div>
  );
}

function BusinessDocumentCard({
  profileId,
  doc,
  canDecide,
  pending,
  onPreview,
  onAccept,
  onRefuse,
}: Readonly<{
  profileId: string;
  doc: AdminBusinessDocument;
  canDecide: boolean;
  pending: boolean;
  onPreview: () => void;
  onAccept: () => void;
  onRefuse: () => void;
}>) {
  const [failed, setFailed] = useState(false);
  const isImage = fileKind(doc.mimeType) === "image" && !failed;

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0">
      <button
        type="button"
        onClick={onPreview}
        className="bg-muted relative flex h-40 w-full cursor-pointer items-center justify-center"
        aria-label={`Preview ${doc.label}`}
      >
        {isImage ? (
          <img
            src={businessDocumentRawUrl(profileId, doc.id)}
            alt={doc.label}
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <IconFileText className="text-muted-foreground size-12" />
            <span className="text-muted-foreground text-xs">{fileKind(doc.mimeType) === "pdf" ? "PDF" : "File"}</span>
          </div>
        )}
        <Badge className={`absolute top-2 right-2 ${getVerificationStatusBadgeClass(doc.verificationStatus)}`}>
          {getVerificationStatusLabel(doc.verificationStatus)}
        </Badge>
      </button>
      <div className="space-y-3 p-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{doc.label}</p>
          <p className="text-muted-foreground truncate text-xs">{doc.fileName ?? "—"}</p>
          {doc.rejectionReason && (
            <p className="text-destructive mt-1 text-xs">{doc.rejectionReason}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onPreview} className="flex-1">
            Preview
          </Button>
          {canDecide && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onRefuse}
                disabled={pending || doc.verificationStatus === "REJECTED"}
                aria-label="Refuse document"
              >
                <IconX className="size-4" />
              </Button>
              <Button
                size="sm"
                onClick={onAccept}
                disabled={pending || doc.verificationStatus === "VERIFIED"}
                aria-label="Accept document"
              >
                <IconCheck className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
