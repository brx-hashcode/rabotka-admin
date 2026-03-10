import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconCreditCard, IconFileText, IconCheck, IconX } from "@tabler/icons-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
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

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
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

export function ProfilePaymentsContent({ profileId, onPreviewDoc }: Readonly<Props>) {
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
          <p className="text-muted-foreground text-sm">No payment requests yet.</p>
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
}: {
  request: AdminProfilePaymentRequest;
  onPreviewDoc: (doc: ViewerDocument) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const cfg = STATUS_BADGE[request.status] ?? {
    label: request.status,
    variant: "secondary" as const,
  };
  const canProcess = request.status === "SUBMITTED";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-medium">
            Payment Request
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
            {canProcess && (
              <>
                <Button size="sm" variant="default" onClick={onApprove}>
                  <IconCheck className="mr-1 size-3.5" />
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={onReject}>
                  <IconX className="mr-1 size-3.5" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Created</p>
            <p className="mt-0.5 font-medium">{formatDate(request.createdAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Updated</p>
            <p className="mt-0.5 font-medium">{formatDate(request.updatedAt)}</p>
          </div>
          {request.paymentReference && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Reference</p>
              <p className="mt-0.5 font-medium font-mono text-xs">{request.paymentReference}</p>
            </div>
          )}
        </div>

        {request.rejectionNote && (
          <div className="rounded bg-destructive/10 p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Rejection reason</p>
            <p className="text-sm text-destructive">{request.rejectionNote}</p>
          </div>
        )}

        {request.proofImages.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Proof of payment</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {request.proofImages.map((url, i) => (
                <ProofImageCard
                  key={url}
                  url={url}
                  index={i}
                  onPreview={() =>
                    onPreviewDoc({
                      url,
                      title: `Proof of payment ${i + 1}`,
                      description: `Uploaded — ${formatDate(request.createdAt)}`,
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProofImageCard({
  url,
  index,
  onPreview,
}: {
  url: string;
  index: number;
  onPreview: () => void;
}) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0">
      <div className="bg-muted relative flex h-28 items-center justify-center">
        {isImage ? (
          <img
            src={url}
            alt={`Proof ${index + 1}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <IconFileText className="text-muted-foreground size-10" />
        )}
      </div>
      <div className="p-2">
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={onPreview}>
          Preview
        </Button>
      </div>
    </Card>
  );
}
