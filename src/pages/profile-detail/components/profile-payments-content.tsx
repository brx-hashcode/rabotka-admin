import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconCreditCard, IconFileText } from "@tabler/icons-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import {
  getProfilePaymentRequests,
  type AdminProfilePaymentRequest,
} from "#/lib/api/profiles-controller";
import {
  approvePaymentRequest,
  rejectPaymentRequest,
} from "#/lib/api/payment-requests-controller";
import { ConfirmDialog } from "#/features/team/components/confirm-dialog";
import { RejectDialog } from "#/features/payment-requests/components/reject-dialog";
import type { ViewerDocument } from "./document-viewer-drawer";
import { Badge } from "#/components/ui/badge";

const STATUS_BADGE: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  SUBMITTED: { label: "Submitted", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

function formatDate(v: string) {
  try {
    return new Date(v).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return v;
  }
}

type Props = {
  profileId: string;
  onPreviewDoc: (doc: ViewerDocument) => void;
};

export function ProfilePaymentsContent({
  profileId,
  onPreviewDoc,
}: Readonly<Props>) {
  const queryClient = useQueryClient();
  const queryKey = ["admin", "profiles", profileId, "payment-requests"];

  const { data: requests = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getProfilePaymentRequests(profileId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const [approveTarget, setApproveTarget] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const approveMutation = useMutation({
    mutationFn: (id: string) => approvePaymentRequest(id),
    onSuccess: () => {
      invalidate();
      toast.success("Payment approved.");
      setApproveTarget(null);
    },
    onError: () => toast.error("Failed to approve payment."),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      rejectPaymentRequest(id, note),
    onSuccess: () => {
      invalidate();
      toast.success("Payment rejected.");
      setRejectTarget(null);
    },
    onError: () => toast.error("Failed to reject payment."),
  });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
        Loading payments...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="py-12">
        <CardContent className="flex flex-col items-center justify-center text-center">
          <IconCreditCard className="text-muted-foreground mb-2 size-10" />
          <p className="text-muted-foreground text-sm">
            No payment requests yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {requests.map((req) => (
          <PaymentRequestCard
            key={req.id}
            request={req}
            onPreviewDoc={onPreviewDoc}
            onApprove={() => setApproveTarget(req.id)}
            onReject={() => setRejectTarget(req.id)}
          />
        ))}
      </div>

      <ConfirmDialog
        open={approveTarget != null}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title="Approve payment"
        description="This will mark the payment as approved and activate the user's account."
        actionLabel="Approve"
        onConfirm={() => approveTarget && approveMutation.mutate(approveTarget)}
        isPending={approveMutation.isPending}
        variant="default"
      />

      <RejectDialog
        open={rejectTarget != null}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        isPending={rejectMutation.isPending}
        onConfirm={(note) =>
          rejectTarget && rejectMutation.mutate({ id: rejectTarget, note })
        }
      />
    </>
  );
}

function PaymentRequestCard({
  request,
  onPreviewDoc,
  onApprove,
  onReject,
}: Readonly<{
  request: AdminProfilePaymentRequest;
  onPreviewDoc: (doc: ViewerDocument) => void;
  onApprove: () => void;
  onReject: () => void;
}>) {
  const cfg = STATUS_BADGE[request.status] ?? {
    label: request.status,
    variant: "secondary" as const,
  };
  const canProcess = request.status === "SUBMITTED";

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <IconCreditCard className="text-muted-foreground size-4 shrink-0" />
          <span className="text-sm font-semibold uppercase">
            Payment Request
          </span>
          <Badge
            variant={cfg.variant}
            className="px-2 py-0.5 text-[0.7rem] uppercase tracking-wide"
          >
            {cfg.label}
          </Badge>
        </div>
        <div className="flex flex-col items-start gap-2 text-xs sm:flex-row sm:items-center sm:gap-3">
          {canProcess && (
            <div className="flex gap-2">
              <Button size="sm" variant="default" onClick={onApprove}>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={onReject}>
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoField label="Created" value={formatDate(request.createdAt)} />
            <InfoField label="Updated" value={formatDate(request.updatedAt)} />
            {request.paymentReference && (
              <InfoField
                label="Reference"
                value={request.paymentReference}
                mono
              />
            )}
          </div>

          {request.rejectionNote && (
            <div className="rounded-md bg-destructive/10 px-4 py-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-destructive/70">
                Rejection reason
              </p>
              <p className="text-sm text-destructive">
                {request.rejectionNote}
              </p>
            </div>
          )}

          {request.proofImages.length === 0 && (
            <p className="text-muted-foreground text-xs italic">
              No proof of payment uploaded.
            </p>
          )}
        </div>

        <div className="p-5">
          {request.proofImages.length > 0 ? (
            <>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Proof of payment ({request.proofImages.length})
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {request.proofImages.map((url, i) => (
                  <ProofImageCard
                    key={url}
                    url={url}
                    index={i}
                    onPreview={() =>
                      onPreviewDoc({
                        url,
                        title: `Proof of payment ${i + 1}`,
                        description: `Submitted — ${formatDate(request.createdAt)}`,
                      })
                    }
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[100px] items-center justify-center">
              <p className="text-muted-foreground text-sm">
                No images attached.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function InfoField({
  label,
  value,
  mono = false,
}: Readonly<{
  label: string;
  value: string;
  mono?: boolean;
}>) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function ProofImageCard({
  url,
  index,
  onPreview,
}: Readonly<{
  url: string;
  index: number;
  onPreview: () => void;
}>) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0">
      <button
        type="button"
        className="bg-muted relative flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden border-0 p-0 text-left transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={onPreview}
        aria-label={`Preview proof of payment ${index + 1}`}
      >
        {imgFailed ? (
          <IconFileText className="text-muted-foreground size-10" />
        ) : (
          <img
            src={url}
            alt={`Proof ${index + 1}`}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        )}
      </button>
      <div className="p-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={onPreview}
        >
          Preview
        </Button>
      </div>
    </Card>
  );
}
