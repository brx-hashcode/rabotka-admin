import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  IconMail,
  IconPhone,
  IconExternalLink,
  IconUser,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";

import type { AdminJobOfferDetailResponse } from "#/lib/api/jobs-controller";
import {
  getJobOfferStatusLabel,
  PAYMENT_FLOW_LABELS,
} from "#/lib/status-labels";
import { EMPLOYMENT_TYPE_LABELS } from "#/lib/employment-type";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";

import { formatDate } from "../helpers";
import { getStatusBadgeClass } from "#/features/jobs/components/job-columns";

function getInitials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/);
  return (
    ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase().slice(0, 2) ||
    "?"
  );
}

type Props = {
  job: AdminJobOfferDetailResponse;
};

/** Label on the left, value on the right — the shape a spec sheet is read in. */
function Field({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-muted-foreground shrink-0 text-xs">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium">{children}</span>
    </div>
  );
}

const EM_DASH = "\u2014";

export function JobSummary({ job }: Readonly<Props>) {
  const [copied, setCopied] = useState(false);

  function copyReference() {
    navigator.clipboard
      .writeText(job.reference)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => toast.error("Could not copy reference"));
  }

  const closingDate = job.scheduledAt ? new Date(job.scheduledAt) : null;
  const closingValid = closingDate && !Number.isNaN(closingDate.getTime());
  const created = new Date(job.createdAt);
  const createdValid = !Number.isNaN(created.getTime());

  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardContent className="space-y-1 px-4">
          {/* One button, not a card of its own. The reference exists to be
              quoted into a support thread, so copying it is the only thing
              anyone does with it — and it was previously unselectable text
              occupying a whole panel. */}
          <button
            type="button"
            onClick={copyReference}
            className="hover:bg-muted flex w-full items-center justify-between gap-2 rounded px-1 py-1 text-left transition-colors"
            title="Copy reference"
          >
            <span className="text-muted-foreground text-xs">Reference</span>
            <span className="flex items-center gap-1.5 font-mono text-sm font-semibold">
              {job.reference}
              {copied ? (
                <IconCheck className="size-3.5 text-emerald-500" />
              ) : (
                <IconCopy className="text-muted-foreground size-3.5" />
              )}
            </span>
          </button>

          <Separator />

          <div className="divide-y">
            <Field label="Status">
              <Badge className={getStatusBadgeClass(job.status)}>
                {getJobOfferStatusLabel(job.status)}
              </Badge>
            </Field>

            {/* The fact that explains an Expired badge, and it was missing
                entirely — "why is this expired" had no answer on the page. */}
            {closingValid && (
              <Field label="Closes">
                <span title={format(closingDate, "PPpp")}>
                  {formatDate(job.scheduledAt)}
                  <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                    {formatDistanceToNow(closingDate, { addSuffix: true })}
                  </span>
                </span>
              </Field>
            )}

            <Field label="Type">
              {EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}
            </Field>

            {job.category && <Field label="Domain">{job.category.name}</Field>}

            <Field label="Pay">
              {job.amount == null && !job.paymentFlow ? (
                <span className="text-muted-foreground">{EM_DASH}</span>
              ) : (
                <>
                  {job.amount != null && (
                    <span className="tabular-nums">
                      {job.amount.toLocaleString("fr-FR")} FCFA
                    </span>
                  )}
                  {job.paymentFlow && (
                    <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                      {PAYMENT_FLOW_LABELS[job.paymentFlow] ?? job.paymentFlow}
                    </span>
                  )}
                </>
              )}
            </Field>

            {/* Applications against positions: "0" alone does not say whether
                that is a problem, and "0 of 3" does. */}
            <Field label="Applications">
              <span className="tabular-nums">
                {job.applicationsCount}
                {job.quantity > 1 && (
                  <span className="text-muted-foreground text-xs font-normal">
                    {" "}
                    / {job.quantity} positions
                  </span>
                )}
              </span>
            </Field>

            <Field label="Created">
              {createdValid ? (
                <span title={format(created, "PPpp")}>
                  {formatDate(job.createdAt)}
                  <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                    {formatDistanceToNow(created, { addSuffix: true })}
                  </span>
                </span>
              ) : (
                EM_DASH
              )}
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Employer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {job.employerAvatarUrl ? (
                <AvatarImage
                  src={job.employerAvatarUrl}
                  alt={job.employerName ?? ""}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {getInitials(job.employerName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {job.employerName || "—"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                ID: {job.employerId?.slice(0, 8) ?? "—"}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <IconMail className="text-muted-foreground size-4 shrink-0" />
              <span className="truncate text-sm">
                {job.employerEmail || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <IconPhone className="text-muted-foreground size-4 shrink-0" />
              <span className="text-sm">{job.employerPhone || "—"}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <IconUser className="text-muted-foreground size-4 shrink-0" />
              <span className="text-muted-foreground text-xs">
                Employer account
              </span>
            </div>
          </div>

          {job.employerId ? (
            <Link
              to="/profiles/$profileId"
              params={{ profileId: job.employerId }}
              className={buttonVariants({
                variant: "outline",
                className: "w-full",
              })}
            >
              <IconExternalLink className="size-3.5" />
              View Profile
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
