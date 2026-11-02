import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { DataTable, type ColumnDef } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { Textarea } from "#/components/ui/textarea";
import { useAdminMe } from "#/hooks/use-admin-me";
import {
  addAdminNote,
  adminBusinessKey,
  deleteAdminNote,
  editAdminNote,
  getAdminNotes,
  getBusinessCvScreenings,
  getBusinessHealth,
  getBusinessInterviews,
  type AdminNote,
  type BusinessAlert,
  type BusinessCvScreening,
  type BusinessInterview,
} from "#/lib/api/admin-business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { activityLabel } from "../business-activity-labels";
import { formatDate, formatDateTime } from "../helpers";

// ── Overview ────────────────────────────────────────────────────────────

/** How each alert reads, and where to look next. */
const ALERT: Record<string, { text: (n: number) => string; section?: string }> = {
  VERIFICATION_PENDING: { text: () => "Verification pending: its papers are waiting for review", section: "organisation" },
  VERIFICATION_REJECTED: { text: () => "Verification refused: waiting for corrected papers", section: "organisation" },
  NO_PLAN: { text: () => "No plan: contacts are paid one by one, offers cannot be published", section: "organisation" },
  PLAN_ENDING: { text: () => "Its plan ends within a week", section: "organisation" },
  TRIAL_ENDING: { text: () => "Its trial ends within a week", section: "organisation" },
  CANDIDATES_WAITING: { text: (n) => `${n} candidate${n > 1 ? "s" : ""} waiting for an answer for more than 48 h`, section: "hiring" },
  OFFERS_ENDING_UNFILLED: { text: (n) => `${n} offer${n > 1 ? "s" : ""} ending within a week with nobody retained`, section: "hiring" },
  INVITES_PENDING: { text: (n) => `${n} team invitation${n > 1 ? "s" : ""} not accepted after a week`, section: "team" },
  MAILBOX_EXPIRED: { text: (n) => `${n} mailbox${n > 1 ? "es" : ""} to reconnect`, section: "careers" },
  PAPERS_TO_REVIEW: { text: (n) => `${n} document${n > 1 ? "s" : ""} to review`, section: "organisation" },
};

/** Does this business need us? Plan, what is stuck, last activity, figures. */
export function BusinessOverviewSection({
  profileId,
  onOpenSection,
}: Readonly<{ profileId: string; onOpenSection: (section: string) => void }>) {
  const health = useQuery({ queryKey: adminBusinessKey(profileId, "health"), queryFn: () => getBusinessHealth(profileId) });
  if (health.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
        <Skeleton className="h-48 sm:col-span-4" />
      </div>
    );
  }
  if (!health.data) return <p className="text-destructive text-sm">{friendlyError(health.error, "Could not load the overview.")}</p>;
  const h = health.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Plan" value={h.plan.name ?? "No plan"} hint={h.plan.endsAt ? `${h.plan.status?.toLowerCase() ?? ""} · until ${formatDate(h.plan.endsAt)}` : undefined} />
        <Tile label="Open offers" value={String(h.openOffers)} />
        <Tile label="Last 30 days" value={`${h.last30Days.candidates} candidates`} hint={`${h.last30Days.hires} hired`} />
        <Tile
          label="Last activity"
          value={h.lastActivity ? formatDateTime(h.lastActivity.at) : "Never"}
          hint={h.lastActivity ? `${h.lastActivity.by ?? "Someone"} ${activityLabel(h.lastActivity.action)}` : `${h.teamSize} in the team`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Needs attention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {h.alerts.length === 0 ? (
            <p className="flex items-center gap-2 text-green-700 text-sm dark:text-green-400">
              <IconCircleCheck className="size-4" />
              Nothing stuck: candidates answered, offers on track, team and mailboxes fine.
            </p>
          ) : (
            h.alerts.map((a) => <AlertRow key={a.kind} alert={a} onOpen={onOpenSection} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Tile({ label, value, hint }: Readonly<{ label: string; value: string; hint?: string }>) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="truncate font-semibold text-lg">{value}</p>
        {hint && <p className="truncate text-muted-foreground text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function AlertRow({ alert, onOpen }: Readonly<{ alert: BusinessAlert; onOpen: (section: string) => void }>) {
  const meta = ALERT[alert.kind] ?? { text: () => alert.kind };
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
      <div className="flex items-start gap-2">
        <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <p className="flex-1">{meta.text(alert.count)}</p>
        {meta.section && (
          <Button size="sm" variant="ghost" className="h-7" onClick={() => onOpen(meta.section!)}>
            Open
          </Button>
        )}
      </div>
      {alert.items && alert.items.length > 0 && (
        <ul className="mt-2 space-y-1 pl-6 text-muted-foreground text-xs">
          {alert.items.map((it) => (
            <li key={it.id}>
              {alert.kind === "OFFERS_ENDING_UNFILLED" ? (
                <Link to="/jobs/$jobId" params={{ jobId: it.id }} className="hover:underline">
                  {it.label}
                </Link>
              ) : (
                it.label
              )}
              {it.at && ` · ${formatDate(it.at)}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Interviews ──────────────────────────────────────────────────────────

const INTERVIEW_STATUS: Record<BusinessInterview["status"], { label: string; className: string }> = {
  PENDING: { label: "Awaiting answer", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  CONFIRMED: { label: "Confirmed", className: "bg-green-500/15 text-green-700 dark:text-green-400" },
  DECLINED: { label: "Declined", className: "bg-destructive/10 text-destructive" },
  RESCHEDULE_REQUESTED: { label: "Asked another time", className: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  CANCELLED: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

const interviewColumns: ColumnDef<BusinessInterview>[] = [
  {
    id: "when",
    header: "When",
    cell: ({ row }) => (
      <div className="text-sm">
        <p className="font-medium">{formatDateTime(row.original.startsAt)}</p>
        <p className="text-muted-foreground text-xs">
          {row.original.durationMinutes} min · {row.original.mode.toLowerCase().replaceAll("_", " ")}
          {row.original.location && ` · ${row.original.location}`}
        </p>
      </div>
    ),
  },
  {
    id: "candidate",
    header: "Candidate",
    cell: ({ row }) => (
      <div className="text-sm">
        <p className="font-medium">{row.original.candidateName}</p>
        <p className="text-muted-foreground text-xs">
          {row.original.candidateEmail ?? "—"} · {row.original.fromCv ? "CV / careers page" : "Rabotka profile"}
        </p>
      </div>
    ),
  },
  {
    id: "offer",
    header: "For",
    cell: ({ row }) =>
      row.original.offerId ? (
        <Link to="/jobs/$jobId" params={{ jobId: row.original.offerId }} className="text-sm hover:underline">
          {row.original.jobTitle}
        </Link>
      ) : (
        <span className="text-sm">{row.original.jobTitle}</span>
      ),
  },
  {
    id: "status",
    header: "Answer",
    cell: ({ row }) => {
      const s = INTERVIEW_STATUS[row.original.status];
      return (
        <div className="space-y-1">
          <Badge className={s.className}>{s.label}</Badge>
          {row.original.respondedAt && <p className="text-muted-foreground text-xs">{formatDateTime(row.original.respondedAt)}</p>}
          {row.original.responseNote && (
            <p className="max-w-56 truncate text-muted-foreground text-xs" title={row.original.responseNote}>
              « {row.original.responseNote} »
            </p>
          )}
        </div>
      );
    },
  },
];

/** Its interviews, newest first, with each candidate's answer. */
export function BusinessInterviewsSection({ profileId }: Readonly<{ profileId: string }>) {
  const query = useQuery({ queryKey: adminBusinessKey(profileId, "interviews"), queryFn: () => getBusinessInterviews(profileId) });
  const rows = query.data ?? [];
  const upcoming = rows.filter((i) => new Date(i.startsAt) > new Date() && i.status !== "CANCELLED").length;
  return (
    <DataTable
      data={rows}
      columns={interviewColumns}
      isLoading={query.isLoading}
      getRowId={(r) => r.id}
      emptyMessage="No interview yet."
      header={
        <div className="space-y-0.5">
          <h3 className="font-semibold text-base">Interviews ({rows.length})</h3>
          <p className="text-muted-foreground text-sm">
            {upcoming} upcoming · the candidate answers from the link in their e-mail.
          </p>
        </div>
      }
    />
  );
}

// ── CV analyses ─────────────────────────────────────────────────────────

const cvColumns: ColumnDef<BusinessCvScreening>[] = [
  {
    id: "date",
    header: "Run",
    cell: ({ row }) => <span className="text-sm">{formatDateTime(row.original.createdAt)}</span>,
  },
  {
    id: "job",
    header: "For",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.offerId ? (
          <Link to="/jobs/$jobId" params={{ jobId: row.original.offerId }} className="font-medium hover:underline">
            {row.original.jobTitle}
          </Link>
        ) : (
          <span className="font-medium">{row.original.jobTitle}</span>
        )}
        <p className="text-muted-foreground text-xs">{row.original.fromCareersPage ? "Careers-page CV, read on arrival" : "CVs uploaded by the business"}</p>
      </div>
    ),
  },
  {
    id: "cvs",
    header: "CVs",
    cell: ({ row }) => {
      const r = row.original;
      return (
        <div className="text-sm">
          <p className="font-medium tabular-nums">{r.cvs}</p>
          <p className="text-muted-foreground text-xs">
            {r.scored} scored
            {r.unreadable > 0 && ` · ${r.unreadable} unreadable`}
            {r.failed > 0 && ` · ${r.failed} failed`}
            {r.queued > 0 && ` · ${r.queued} in progress`}
          </p>
        </div>
      );
    },
  },
  {
    id: "files",
    header: "Files",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {row.original.purgedAt ? `Purged ${formatDate(row.original.purgedAt)}` : `Kept until ${formatDate(row.original.expiresAt)}`}
      </span>
    ),
  },
];

/** Its CV analyses: what was read (only scored CVs use the plan), and when files go. */
export function BusinessCvScreeningsSection({ profileId }: Readonly<{ profileId: string }>) {
  const query = useQuery({ queryKey: adminBusinessKey(profileId, "cv-screenings"), queryFn: () => getBusinessCvScreenings(profileId) });
  const rows = query.data ?? [];
  const scored = rows.reduce((n, r) => n + r.scored, 0);
  return (
    <DataTable
      data={rows}
      columns={cvColumns}
      isLoading={query.isLoading}
      getRowId={(r) => r.id}
      emptyMessage="No CV analysis yet."
      header={
        <div className="space-y-0.5">
          <h3 className="font-semibold text-base">CV analyses ({rows.length})</h3>
          <p className="text-muted-foreground text-sm">{scored} CVs scored in all; unreadable ones are not counted against the plan.</p>
        </div>
      }
    />
  );
}

// ── Notes ───────────────────────────────────────────────────────────────

/** Rabotka's own follow-up on this business — never shown to it. */
export function BusinessNotesSection({ profileId }: Readonly<{ profileId: string }>) {
  const queryClient = useQueryClient();
  const key = adminBusinessKey(profileId, "notes");
  const { data: me } = useAdminMe();
  const notes = useQuery({ queryKey: key, queryFn: () => getAdminNotes(profileId) });
  const [draft, setDraft] = useState("");
  const set = (next: AdminNote[]) => queryClient.setQueryData(key, next);
  const add = useMutation({
    mutationFn: () => addAdminNote(profileId, draft.trim()),
    onSuccess: (next) => {
      set(next);
      setDraft("");
    },
    onError: (err) => toast.error(friendlyError(err, "The note could not be saved.")),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">New note</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="Called on 3 Nov: interested in Pro, call back Friday…"
          />
          <p className="text-muted-foreground text-xs">Visible to Rabotka's team only, never to the business.</p>
          <Button onClick={() => add.mutate()} disabled={!draft.trim() || add.isPending}>
            Add note
          </Button>
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-sm">Follow-up ({notes.data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notes.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (notes.data ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">No note yet.</p>
          ) : (
            notes.data!.map((n) => <NoteRow key={n.id} note={n} mine={n.author.id === me?.id} profileId={profileId} onChange={set} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NoteRow({
  note,
  mine,
  profileId,
  onChange,
}: Readonly<{ note: AdminNote; mine: boolean; profileId: string; onChange: (next: AdminNote[]) => void }>) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.body);
  const save = useMutation({
    mutationFn: () => editAdminNote(profileId, note.id, text.trim()),
    onSuccess: (next) => {
      onChange(next);
      setEditing(false);
    },
    onError: (err) => toast.error(friendlyError(err, "The note could not be saved.")),
  });
  const remove = useMutation({
    mutationFn: () => deleteAdminNote(profileId, note.id),
    onSuccess: onChange,
    onError: (err) => toast.error(friendlyError(err, "The note could not be deleted.")),
  });
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium text-sm">{note.author.name}</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <IconClock className="size-3.5" />
          {formatDateTime(note.createdAt)}
          {note.edited && " · edited"}
        </span>
        {mine && !editing && (
          <span className="ml-auto flex gap-1">
            <Button size="icon" variant="ghost" className="size-7" aria-label="Edit note" onClick={() => setEditing(true)}>
              <IconPencil className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-destructive"
              aria-label="Delete note"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              <IconTrash className="size-4" />
            </Button>
          </span>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={4000} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => (setEditing(false), setText(note.body))}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => save.mutate()} disabled={!text.trim() || save.isPending}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-line text-sm">{note.body}</p>
      )}
    </div>
  );
}
