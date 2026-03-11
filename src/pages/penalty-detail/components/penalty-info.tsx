import type { AdminPenaltyDetailResponse } from "#/lib/api/penalties-controller";
import {
  getApplicationStatusLabel,
  getJobOfferStatusLabel,
  getPaymentFlowLabel,
} from "#/lib/status-labels";

import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";

import { formatDateTime, formatAmount } from "../helpers";

function FieldLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {children}
    </label>
  );
}

function FieldValue({ children }: Readonly<{ children: React.ReactNode }>) {
  return <p className="text-sm">{children}</p>;
}

type Props = {
  penalty: AdminPenaltyDetailResponse;
};

export function PenaltyInfo({ penalty }: Readonly<Props>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Penalty Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div className="space-y-1.5">
            <FieldLabel>Amount</FieldLabel>
            <FieldValue>{formatAmount(penalty.amount)}</FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Payment Status</FieldLabel>
            <FieldValue>
              {penalty.paidAt ? "Paid" : "Unpaid"}
            </FieldValue>
          </div>

          <div className="col-span-2 space-y-1.5">
            <FieldLabel>Reason</FieldLabel>
            <FieldValue>{penalty.reason || "—"}</FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Applied At</FieldLabel>
            <FieldValue>{formatDateTime(penalty.appliedAt)}</FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Paid At</FieldLabel>
            <FieldValue>{formatDateTime(penalty.paidAt)}</FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Created At</FieldLabel>
            <FieldValue>{formatDateTime(penalty.createdAt)}</FieldValue>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Related job info */}
        <h4 className="text-muted-foreground mb-4 text-xs font-medium uppercase tracking-wide">
          Related Job
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div className="col-span-2 space-y-1.5">
            <FieldLabel>Job Title</FieldLabel>
            <FieldValue>{penalty.jobTitle}</FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Job Status</FieldLabel>
            <FieldValue>
              {getJobOfferStatusLabel(penalty.jobStatus)}
            </FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Application Status</FieldLabel>
            <FieldValue>
              {getApplicationStatusLabel(penalty.applicationStatus)}
            </FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Job Scheduled At</FieldLabel>
            <FieldValue>
              {formatDateTime(penalty.jobScheduledAt)}
            </FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Job Amount</FieldLabel>
            <FieldValue>{formatAmount(penalty.jobAmount)}</FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Job Address</FieldLabel>
            <FieldValue>{penalty.jobAddress}</FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Payment Flow</FieldLabel>
            <FieldValue>
              {getPaymentFlowLabel(penalty.jobPaymentFlow)}
            </FieldValue>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
