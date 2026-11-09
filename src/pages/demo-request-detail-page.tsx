import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import { Textarea } from "#/components/ui/textarea";
import {
  DEMO_INTEREST_LABELS,
  DEMO_STATUS_LABELS,
  demoStatusOptions,
  formatDateTime,
  getDemoStatusBadgeClass,
} from "#/features/demo-requests";
import {
  getDemoRequestById,
  updateDemoRequest,
  type AdminDemoRequestDetail,
  type DemoRequestStatus,
} from "#/lib/api/demo-requests-controller";

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

/** Digits only, for wa.me. */
function waNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

function FollowUp({ demo }: Readonly<{ demo: AdminDemoRequestDetail }>) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<DemoRequestStatus>(demo.status);
  const [notes, setNotes] = useState(demo.notes ?? "");

  useEffect(() => {
    setStatus(demo.status);
    setNotes(demo.notes ?? "");
  }, [demo.status, demo.notes]);

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
      toast.success("Follow-up saved");
    },
    onError: () => toast.error("Could not save the follow-up"),
  });

  const dirty = status !== demo.status || notes !== (demo.notes ?? "");

  return (
    <Card>
      <CardContent className="space-y-4">
        <h2 className="font-semibold">Follow-up</h2>
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Status
          </p>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as DemoRequestStatus)}
          >
            <SelectTrigger className="w-full sm:w-64" aria-label="Status">
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
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Notes
          </p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={5000}
            rows={5}
            placeholder="Called on…, demo booked for…, needs…"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs">
            {demo.handledBy
              ? `Last updated by ${demo.handledBy.name} · ${formatDateTime(demo.updatedAt)}`
              : "Nobody has followed it up yet."}
          </p>
          <Button
            onClick={() => save.mutate()}
            disabled={!dirty || save.isPending}
          >
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }
  if (!demo) {
    return (
      <p className="text-muted-foreground text-sm">
        This demo request could not be loaded.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{demo.company}</h2>
              <p className="text-muted-foreground text-sm">
                {demo.countryName} · {demo.companySize} people · requested{" "}
                {formatDateTime(demo.createdAt)}
              </p>
            </div>
            <Badge className={getDemoStatusBadgeClass(demo.status)}>
              {DEMO_STATUS_LABELS[demo.status]}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Contact"
              value={`${demo.firstName} ${demo.lastName}`}
            />
            <Field label="Job title" value={demo.jobTitle} />
            <Field
              label="E-mail"
              value={
                <a
                  className="text-primary hover:underline"
                  href={`mailto:${demo.email}`}
                >
                  {demo.email}
                </a>
              }
            />
            <Field
              label="Phone"
              value={
                <span className="flex flex-wrap gap-x-3">
                  <a
                    className="text-primary hover:underline"
                    href={`tel:${demo.phone}`}
                  >
                    {demo.phone}
                  </a>
                  <a
                    className="text-primary hover:underline"
                    href={`https://wa.me/${waNumber(demo.phone)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                </span>
              }
            />
            <Field
              label="Interested in"
              value={
                demo.interests.length ? (
                  <span className="flex flex-wrap gap-1.5">
                    {demo.interests.map((i) => (
                      <Badge key={i} variant="secondary">
                        {DEMO_INTEREST_LABELS[i] ?? i}
                      </Badge>
                    ))}
                  </span>
                ) : (
                  "—"
                )
              }
            />
          </div>

          {demo.message ? (
            <Field
              label="Message"
              value={
                <p className="font-normal whitespace-pre-line">
                  {demo.message}
                </p>
              }
            />
          ) : null}
        </CardContent>
      </Card>

      <FollowUp demo={demo} />
    </div>
  );
}
