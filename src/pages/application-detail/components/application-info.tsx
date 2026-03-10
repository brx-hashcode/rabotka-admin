import type { AdminApplicationDetailResponse } from "#/lib/api/applications-controller";
import { getApplicationStatusLabel, getPaymentFlowLabel } from "#/lib/status-labels";

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
  application: AdminApplicationDetailResponse;
};

export function ApplicationInfo({ application }: Readonly<Props>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div className="col-span-2 space-y-1.5">
            <FieldLabel>Job Title</FieldLabel>
            <FieldValue>{application.jobTitle}</FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Status</FieldLabel>
            <FieldValue>
              {getApplicationStatusLabel(application.status)}
            </FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Applied At</FieldLabel>
            <FieldValue>{formatDateTime(application.createdAt)}</FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Job Scheduled At</FieldLabel>
            <FieldValue>
              {formatDateTime(application.jobScheduledAt)}
            </FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Job Amount</FieldLabel>
            <FieldValue>{formatAmount(application.jobAmount)}</FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Job Address</FieldLabel>
            <FieldValue>{application.jobAddress}</FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Payment Flow</FieldLabel>
            <FieldValue>
              {getPaymentFlowLabel(application.jobPaymentFlow)}
            </FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Positions</FieldLabel>
            <FieldValue>{application.jobQuantity}</FieldValue>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Last Updated</FieldLabel>
            <FieldValue>{formatDateTime(application.updatedAt)}</FieldValue>
          </div>
        </div>

        {(application.cancelledAt || application.cancellationReason) && (
          <>
            <Separator className="my-6" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              {application.cancelledAt && (
                <div className="space-y-1.5">
                  <FieldLabel>Cancelled At</FieldLabel>
                  <FieldValue>
                    {formatDateTime(application.cancelledAt)}
                  </FieldValue>
                </div>
              )}
              {application.cancellationReason && (
                <div className="col-span-2 space-y-1.5">
                  <FieldLabel>Cancellation Reason</FieldLabel>
                  <FieldValue>{application.cancellationReason}</FieldValue>
                </div>
              )}
            </div>
          </>
        )}

        {application.penaltyApplied && (
          <>
            <Separator className="my-6" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              <div className="space-y-1.5">
                <FieldLabel>Penalty Applied</FieldLabel>
                <FieldValue>Yes</FieldValue>
              </div>
              {application.penaltyAmount != null && (
                <div className="space-y-1.5">
                  <FieldLabel>Penalty Amount</FieldLabel>
                  <FieldValue>
                    {formatAmount(application.penaltyAmount)}
                  </FieldValue>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
