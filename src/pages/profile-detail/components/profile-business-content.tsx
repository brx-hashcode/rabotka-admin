import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconAlertTriangle,
  IconBuilding,
  IconCheck,
  IconEye,
  IconFileText,
  IconPhoto,
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
import { Input } from "#/components/ui/input";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { Textarea } from "#/components/ui/textarea";
import { getVerificationStatusBadgeClass } from "#/features/applications/components/profile-columns";
import { ConfirmDialog } from "#/features/team/components/confirm-dialog";

import { formatDate } from "../helpers";
import type { ViewerDocument } from "./document-viewer-drawer";

type Props = {
  profileId: string;
  onPreviewDoc: (doc: ViewerDocument) => void;
};

/** What the refusal dialog is about: the business, or one of its papers. */
type Refusing = { kind: "business" } | { kind: "document"; doc: AdminBusinessDocument };
/** What the approval confirmation is about. */
type Approving = { kind: "business" } | { kind: "document"; doc: AdminBusinessDocument };

function fileKind(mimeType: string | null): string | undefined {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType?.startsWith("image/")) return "image";
  return undefined;
}

/** As profile-form.tsx: the small uppercase label above each field. */
function FieldLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {children}
    </label>
  );
}

/** A read-only field, drawn like the General tab's inputs. */
function Field({
  label,
  value,
  className,
}: Readonly<{ label: string; value: string | null | undefined; className?: string }>) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <FieldLabel>{label}</FieldLabel>
      <Input value={value || "—"} readOnly disabled />
    </div>
  );
}

/** As profile-general-summary.tsx: one label/value line. */
function Row({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-muted-foreground shrink-0">{label}</div>
      <div className="text-right font-medium">{children}</div>
    </div>
  );
}

/**
 * The « Business » tab, laid out as the General tab: the organisation's
 * information on the left, its verification and documents on the right.
 * Approving the business is what verifies and activates the account (there is
 * no personal KYC); the business is told by email and in-app notification —
 * business accounts get no WhatsApp.
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
  const [approving, setApproving] = useState<Approving | null>(null);
  const [reason, setReason] = useState("");

  const onSaved = (next: AdminBusinessDetail) => {
    queryClient.setQueryData(queryKey, next);
    // Refetched too, and the profile with it: the decision changes the
    // profile's own status and verification, shown in the other tabs.
    void queryClient.invalidateQueries({ queryKey });
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

  function confirmApproval() {
    if (!approving) return;
    if (approving.kind === "business") {
      decideBusiness.mutate({ decision: "VERIFIED" });
    } else {
      decideDocument.mutate({ documentId: approving.doc.id, decision: "VERIFIED" });
    }
    setApproving(null);
  }

  function preview(doc: AdminBusinessDocument) {
    onPreviewDoc({
      url: businessDocumentRawUrl(profileId, doc.id),
      title: doc.label,
      description: `${doc.fileName ?? "Document"} — Uploaded ${formatDate(doc.createdAt)}`,
      fileType: fileKind(doc.mimeType),
    });
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-6">
        <Skeleton className="col-span-5 h-[520px] lg:col-span-3" />
        <div className="col-span-5 space-y-6 lg:col-span-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-64" />
        </div>
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

  const verified = business.verificationStatus === "VERIFIED";
  const refused = business.verificationStatus === "REJECTED";

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-5 min-w-0 lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase">Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="border-border bg-muted flex size-20 shrink-0 items-center justify-center rounded-full border-4 shadow-md">
                <IconBuilding className="text-muted-foreground size-8" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{business.name}</p>
                <p className="text-muted-foreground truncate text-sm">
                  {business.categoryLabel}
                  {business.legalFormLabel ? ` · ${business.legalFormLabel}` : ""}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {[business.email, business.phone].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Six columns, as the profile form: the identifiers three to a
                row, the pairs (contact, location) at three apiece. */}
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-6">
              <Field label="Raison sociale" value={business.name} className="sm:col-span-6" />
              <Field label="Type" value={business.categoryLabel} className="sm:col-span-3" />
              <Field label="Legal form" value={business.legalFormLabel} className="sm:col-span-3" />
              <Field label="RCCM" value={business.registrationNumber} className="sm:col-span-2" />
              <Field label="NIU" value={business.taxId} className="sm:col-span-2" />
              <Field label="SCIEN / SCIET" value={business.statisticalId} className="sm:col-span-2" />
              <Field label="Contact email" value={business.email} className="sm:col-span-3" />
              <Field label="Contact phone" value={business.phone} className="sm:col-span-3" />
              <Field label="Country" value={business.countryName ?? business.countryCode} className="sm:col-span-2" />
              <Field label="City" value={business.city} className="sm:col-span-2" />
              <Field
                label="Headcount"
                value={business.size ? `${business.size} employees` : null}
                className="sm:col-span-2"
              />
              <Field label="Address" value={business.address} className="sm:col-span-6" />
              <Field label="Website" value={business.website} className="sm:col-span-6" />
              <div className="space-y-1.5 sm:col-span-6">
                <FieldLabel>Description</FieldLabel>
                <Textarea value={business.description || "—"} readOnly disabled rows={5} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-5 min-w-0 space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 text-sm">
              <Row label="Business">
                <Badge className={getVerificationStatusBadgeClass(business.verificationStatus)}>
                  {getVerificationStatusLabel(business.verificationStatus)}
                </Badge>
              </Row>
              <Row label="Submitted">{formatDate(business.createdAt)}</Row>
              <Row label="Decided">{business.verifiedAt ? formatDate(business.verifiedAt) : "—"}</Row>
              <Row label="Documents">
                {business.documents.length} uploaded
              </Row>
            </div>

            {business.rejectionReason && (
              <p className="bg-destructive/10 text-destructive rounded p-3 text-sm">
                {business.rejectionReason}
              </p>
            )}

            {business.missingDocuments.length > 0 && (
              <div className="flex items-start gap-2 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <p>
                  Missing for this type:{" "}
                  <span className="font-medium">
                    {business.missingDocuments.map((g) => g.map((d) => d.label).join(" or ")).join(", ")}
                  </span>
                </p>
              </div>
            )}

            {/* Decided is decided: no buttons once verified. A refused
                business can still be approved after new papers. */}
            {canManageContent && !verified && (
              <div className={`grid gap-2 pt-2 ${refused ? "grid-cols-1" : "grid-cols-2"}`}>
                {!refused && (
                  <Button
                    variant="outline"
                    onClick={() => setRefusing({ kind: "business" })}
                    disabled={decideBusiness.isPending}
                  >
                    <IconX className="size-4" />
                    Refuse
                  </Button>
                )}
                <Button
                  onClick={() => setApproving({ kind: "business" })}
                  disabled={decideBusiness.isPending}
                >
                  <IconCheck className="size-4" />
                  Approve
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {business.documents.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <IconFileText className="text-muted-foreground mb-2 size-8" />
                <p className="text-muted-foreground text-sm">No documents uploaded.</p>
              </div>
            ) : (
              <ul className="divide-border divide-y">
                {business.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => preview(doc)}
                      className="bg-muted hover:bg-accent flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
                      aria-label={`Preview ${doc.label}`}
                    >
                      {fileKind(doc.mimeType) === "image" ? (
                        <IconPhoto className="text-muted-foreground size-5" />
                      ) : (
                        <IconFileText className="text-muted-foreground size-5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => preview(doc)}
                      className="min-w-0 flex-1 cursor-pointer text-left"
                    >
                      <p className="truncate text-sm font-medium hover:underline">{doc.label}</p>
                      <p className="text-muted-foreground truncate text-xs">{doc.fileName ?? "—"}</p>
                      {doc.rejectionReason && (
                        <p className="text-destructive truncate text-xs">{doc.rejectionReason}</p>
                      )}
                    </button>
                    <Badge className={getVerificationStatusBadgeClass(doc.verificationStatus)}>
                      {getVerificationStatusLabel(doc.verificationStatus)}
                    </Badge>
                    <div className="flex shrink-0 gap-1.5">
                      <Button size="icon-sm" variant="outline" onClick={() => preview(doc)} aria-label="Preview">
                        <IconEye className="size-3.5" />
                      </Button>
                      {/* Only what is still to decide: nothing once the
                          business is verified or the paper accepted. */}
                      {canManageContent && !verified && doc.verificationStatus !== "VERIFIED" && (
                        <>
                          {doc.verificationStatus !== "REJECTED" && (
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => setRefusing({ kind: "document", doc })}
                              disabled={decideDocument.isPending}
                              aria-label="Refuse document"
                              className="hover:text-destructive"
                            >
                              <IconX className="size-3.5" />
                            </Button>
                          )}
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => setApproving({ kind: "document", doc })}
                            disabled={decideDocument.isPending}
                            aria-label="Accept document"
                            className="hover:text-emerald-500"
                          >
                            <IconCheck className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!approving}
        onOpenChange={(open) => {
          if (!open) setApproving(null);
        }}
        title={approving?.kind === "document" ? `Accept « ${approving.doc.label} » ?` : `Approve ${business.name} ?`}
        description={
          approving?.kind === "document"
            ? "This document will be marked as verified."
            : "The business is verified and its account becomes active. Its pending documents are accepted, and the business is notified by email and in-app notification. This cannot be undone from here."
        }
        actionLabel={approving?.kind === "document" ? "Accept" : "Approve business"}
        onConfirm={confirmApproval}
        isPending={decideBusiness.isPending || decideDocument.isPending}
      />

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
