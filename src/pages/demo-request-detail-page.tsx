import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconBrandWhatsapp,
  IconBuilding,
  IconMail,
  IconPhone,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button, buttonVariants } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { Textarea } from "#/components/ui/textarea";
import {
  DEMO_INTEREST_LABELS,
  DEMO_STATUS_LABELS,
  demoStatusOptions,
  displayPhone,
  formatDateTime,
  getDemoStatusBadgeClass,
} from "#/features/demo-requests";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  getDemoRequestById,
  updateDemoRequest,
  type AdminDemoRequestDetail,
  type DemoRequestStatus,
} from "#/lib/api/demo-requests-controller";

const LABEL_CLASS =
  "text-muted-foreground text-xs font-medium uppercase tracking-wide";

function Field({
  label,
  children,
  className,
}: Readonly<{
  label: string;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <p className={LABEL_CLASS}>{label}</p>
      <div className="text-sm break-words">{children}</div>
    </div>
  );
}

/** A label on the left, its value on the right: the summary cards' rows. */
function Row({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-muted-foreground shrink-0">{label}</div>
      <div className="text-right font-medium">{children}</div>
    </div>
  );
}

/** Digits only, for tel: and wa.me. */
const digits = (phone: string) => phone.replace(/\D/g, "");

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();

/** Call, WhatsApp, e-mail: the three ways to answer, top right as Actions. */
function ContactActions({ demo }: Readonly<{ demo: AdminDemoRequestDetail }>) {
  const phone = digits(demo.phone);
  const link = buttonVariants({ variant: "secondary" });
  return (
    <div className="flex flex-wrap gap-2">
      <a className={link} href={`tel:+${phone}`}>
        <IconPhone className="size-4" />
        Call
      </a>
      <a
        className={link}
        href={`https://wa.me/${phone}`}
        target="_blank"
        rel="noreferrer"
      >
        <IconBrandWhatsapp className="size-4" />
        WhatsApp
      </a>
      <a className={link} href={`mailto:${demo.email}`}>
        <IconMail className="size-4" />
        E-mail
      </a>
    </div>
  );
}

function RequestInformation({
  demo,
}: Readonly<{ demo: AdminDemoRequestDetail }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase">
          Request Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="border-border size-16 border-4 shadow-md">
            <AvatarFallback className="text-lg">
              {initials(demo.company) || <IconBuilding className="size-6" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{demo.company}</p>
            <p className="text-muted-foreground text-sm">
              {demo.countryName} · {demo.companySize} employees
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          <Field label="Contact">
            {demo.lastName} {demo.firstName}
          </Field>
          <Field label="Job title">{demo.jobTitle}</Field>
          <Field label="E-mail">
            <a className="hover:underline" href={`mailto:${demo.email}`}>
              {demo.email}
            </a>
          </Field>
          <Field label="Phone">
            <a
              className="hover:underline"
              href={`tel:+${digits(demo.phone)}`}
            >
              {displayPhone(demo.phone)}
            </a>
          </Field>
          <Field label="Country">{demo.countryName}</Field>
          <Field label="Company size">{demo.companySize} employees</Field>
        </div>

        <Separator />

        <Field label="Interested in">
          {demo.interests.length ? (
            <span className="flex flex-wrap gap-1.5">
              {demo.interests.map((i) => (
                <Badge key={i} variant="secondary">
                  {DEMO_INTEREST_LABELS[i] ?? i}
                </Badge>
              ))}
            </span>
          ) : (
            <span className="text-muted-foreground">Nothing ticked</span>
          )}
        </Field>

        <Field label="Message">
          {demo.message ? (
            <p className="bg-muted/50 rounded-lg px-3 py-2 whitespace-pre-line">
              {demo.message}
            </p>
          ) : (
            <span className="text-muted-foreground">No message</span>
          )}
        </Field>
      </CardContent>
    </Card>
  );
}

/**
 * Status and notes, saved together. Remounted (key) when the request changes
 * on the server, so the fields always start from what is saved.
 */
function FollowUp({ demo }: Readonly<{ demo: AdminDemoRequestDetail }>) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<DemoRequestStatus>(demo.status);
  const [notes, setNotes] = useState(demo.notes ?? "");

  const save = useMutation({
    mutationFn: () => updateDemoRequest(demo.id, { status, notes }),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ["admin", "demo-requests", "detail", demo.id],
        updated,
      );
      void queryClient.invalidateQueries({
        queryKey: ["admin", "demo-requests"],
      });
      toast.success("Follow-up saved.");
    },
    onError: (err) =>
      toast.error(friendlyError(err, "Couldn't save the follow-up.")),
  });

  const dirty = status !== demo.status || notes !== (demo.notes ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase">
          Follow-up
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className={LABEL_CLASS}>Status</p>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as DemoRequestStatus)}
          >
            <SelectTrigger className="w-full" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {demoStatusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <p className={LABEL_CLASS}>Notes</p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={5000}
            rows={6}
            placeholder="Called on…, demo booked for…, needs…"
          />
        </div>
        <Button
          className="w-full"
          onClick={() => save.mutate()}
          disabled={!dirty || save.isPending}
        >
          {save.isPending ? "Saving…" : "Save follow-up"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Summary({ demo }: Readonly<{ demo: AdminDemoRequestDetail }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm">
          <Row label="Request">
            <Badge className={getDemoStatusBadgeClass(demo.status)}>
              {DEMO_STATUS_LABELS[demo.status]}
            </Badge>
          </Row>
          <Row label="Requested">{formatDateTime(demo.createdAt)}</Row>
          <Row label="Followed up by">
            {demo.handledBy ? (
              <>
                {demo.handledBy.name}
                <span className="text-muted-foreground block text-xs font-normal">
                  {formatDateTime(demo.updatedAt)}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground font-normal">
                Nobody yet
              </span>
            )}
          </Row>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * One demo request, laid out like the agent and profile pages: the request on
 * the left, its status and follow-up on the right, the ways to answer top
 * right.
 */
export default function DemoRequestDetailPage({
  demoRequestId,
}: Readonly<{ demoRequestId: string }>) {
  const query = useQuery({
    queryKey: ["admin", "demo-requests", "detail", demoRequestId],
    queryFn: () => getDemoRequestById(demoRequestId),
    enabled: Boolean(demoRequestId),
  });
  const demo = query.data;

  if (query.isLoading) {
    return (
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-72" />
        </div>
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-5 lg:col-span-3">
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
          <div className="col-span-5 space-y-6 lg:col-span-2">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (query.isError || !demo) {
    return (
      <div className="flex h-64 items-center justify-center pt-4">
        <p className="text-muted-foreground">
          Failed to load this demo request. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{demo.company}</h2>
          <Badge className={getDemoStatusBadgeClass(demo.status)}>
            {DEMO_STATUS_LABELS[demo.status]}
          </Badge>
        </div>
        <ContactActions demo={demo} />
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-5 min-w-0 lg:col-span-3">
          <RequestInformation demo={demo} />
        </div>
        <div className="col-span-5 min-w-0 space-y-6 lg:col-span-2">
          <Summary demo={demo} />
          <FollowUp key={demo.updatedAt} demo={demo} />
        </div>
      </div>
    </div>
  );
}
