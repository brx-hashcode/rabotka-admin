import type { AdminPenaltyDetailResponse } from "#/lib/api/penalties-controller";
import {
  getApplicationStatusLabel,
  getJobOfferStatusLabel,
} from "#/lib/status-labels";

import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";

import { formatDateTime, formatAmount } from "../helpers";
import { getStatusBadgeClass as getJobStatusBadgeClass } from "#/features/jobs/components/job-columns";
import { getAppStatusBadgeClass } from "#/features/applications-admin/components/application-columns";

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
            <div className="mt-0.5">
              <Badge className={penalty.paidAt ? "bg-emerald-500 text-white border-transparent" : "bg-rose-600 text-white border-transparent"}>
                {penalty.paidAt ? "Paid" : "Unpaid"}
              </Badge>
            </div>
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
            <div className="mt-0.5">
              <Badge className={getJobStatusBadgeClass(penalty.jobStatus)}>
                {getJobOfferStatusLabel(penalty.jobStatus)}
              </Badge>
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Application Status</FieldLabel>
            <div className="mt-0.5">
              <Badge className={getAppStatusBadgeClass(penalty.applicationStatus)}>
                {getApplicationStatusLabel(penalty.applicationStatus)}
              </Badge>
            </div>
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
              {penalty.jobPaymentFlow}
            </FieldValue>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
