import { Link } from "@tanstack/react-router";

import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { getOriginBadgeClass, getOriginLabel } from "#/features/contact-records";
import { useContactRecordDetail } from "#/hooks/use-contact-record-detail";
import type { AdminContactRecordDetail } from "#/lib/api/contact-records-controller";

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

function Field({
  label,
  value,
}: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <div className="text-sm font-medium break-words">{value}</div>
    </div>
  );
}

/**
 * A raw id, for the payment-trail row.
 *
 * Monospaced and small on purpose: these are uuids nobody reads, they are
 * copied. At the same weight as the labelled values above they wrapped over two
 * lines and dominated the card while carrying the least meaning on it.
 */
function IdField({
  label,
  value,
}: Readonly<{ label: string; value: string | null }>) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      {value ? (
        <code className="text-muted-foreground block font-mono text-xs break-all">
          {value}
        </code>
      ) : (
        <span className="text-sm font-medium">—</span>
      )}
    </div>
  );
}

function PartyCard({
  title,
  party,
}: Readonly<{
  title: string;
  party: AdminContactRecordDetail["employer"];
}>) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {title}
        </p>
        {/* `block` matters: a Link renders an inline <a>, which `space-y-*`
            does not put a gap after — the name ended up sitting on top of the
            PHONE label below it. */}
        <Link
          to="/profiles/$profileId"
          params={{ profileId: party.id }}
          className="block text-base font-semibold hover:underline"
        >
          {party.name}
        </Link>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" value={party.phone} />
          {/* Most profiles have no email — phone is the identity that always
              exists, so a dash here is the normal case, not missing data. */}
          <Field label="Email" value={party.email ?? "—"} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContactRecordDetailPage({
  contactRecordId,
}: Readonly<{ contactRecordId: string }>) {
  const { record, isLoading, isError } =
    useContactRecordDetail(contactRecordId);

  if (isLoading) {
    return (
      <div className="space-y-6 pt-6">
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className="flex h-64 items-center justify-center pt-4">
        <p className="text-muted-foreground">
          Failed to load this contact. Please try again.
        </p>
      </div>
    );
  }

  const attempt = record.unlockAttempt;

  return (
    <div className="space-y-6 pt-6">
      <Card>
        <CardContent className="grid grid-cols-2 gap-6 pt-6 md:grid-cols-4">
          <Field
            label="Route"
            value={
              <Badge className={getOriginBadgeClass(record.origin)}>
                {getOriginLabel(record.origin)}
              </Badge>
            }
          />
          <Field
            label="Employer paid"
            value={`${record.amount.toLocaleString()} FCFA`}
          />
          <Field
            label="Contacted at"
            value={formatDateTime(record.unlockedAt)}
          />
          <Field
            label="Job"
            value={
              record.jobOffer ? (
                <Link
                  to="/jobs/$jobId"
                  params={{ jobId: record.jobOffer.id }}
                  className="hover:underline"
                >
                  {record.jobOffer.title}
                </Link>
              ) : (
                // Expected for a DIRECT contact, which has no job by
                // definition — not a gap in the record.
                <span className="text-muted-foreground">
                  No job — direct contact
                </span>
              )
            }
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PartyCard title="Employer" party={record.employer} />
        <PartyCard title="Worker" party={record.worker} />
      </div>

      {/* Only a MISSION unlock has two-sided payment state. A DIRECT one is
          single-sided — the employer paid and that was the whole transaction —
          so an empty panel here would invent a process that never ran. */}
      {attempt ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Unlock attempt
            </p>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <Field label="Status" value={attempt.status} />
              <Field
                label="Employer"
                value={
                  attempt.employerPaid
                    ? `Paid ${attempt.employerAmount.toLocaleString()} FCFA`
                    : "Not paid"
                }
              />
              <Field
                label="Worker"
                value={
                  attempt.workerPaid
                    ? `Paid ${attempt.workerAmount.toLocaleString()} FCFA`
                    : "Not paid"
                }
              />
              <Field
                label="Unlocked at"
                value={formatDateTime(attempt.unlockedAt)}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-5 pt-6 md:grid-cols-4">
          <IdField label="Payment" value={record.paymentId} />
          <IdField label="Payment request" value={record.paymentRequestId} />
          <IdField label="Application" value={record.applicationId} />
          <Field label="Recorded at" value={formatDateTime(record.createdAt)} />
        </CardContent>
      </Card>
    </div>
  );
}
