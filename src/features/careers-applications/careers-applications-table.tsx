import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IconFileText } from "@tabler/icons-react";
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryState, useQueryStates } from "nuqs";

import { DataTable, ProfileCell, TableHeader, TableHeaderToolbar, type ColumnDef } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import { appConfig } from "#/config";
import {
  EXTERNAL_STATUS_LABEL,
  externalApplicationCvUrl,
  listExternalApplications,
  type AdminExternalApplication,
  type ExternalApplicationStatus,
} from "#/lib/api/external-applications-controller";
import { cn } from "#/lib/utils";

const STATUS_CLASS: Record<ExternalApplicationStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  RETAINED: "bg-green-500/15 text-green-700 dark:text-green-400",
  REFUSED: "bg-muted text-muted-foreground",
};

const STATUS_OPTIONS = (Object.keys(EXTERNAL_STATUS_LABEL) as ExternalApplicationStatus[]).map((value) => ({
  value,
  label: EXTERNAL_STATUS_LABEL[value],
}));

const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** The columns; offer and business only where the page is not already about them. */
function careersColumns({ offer, business }: Readonly<{ offer: boolean; business: boolean }>): ColumnDef<AdminExternalApplication>[] {
  return [
    {
      id: "candidate",
      header: "Candidate",
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="space-y-0.5">
            <ProfileCell name={`${a.firstName} ${a.lastName}`} email={a.email} avatarUrl={null} />
            <p className="pl-11 text-muted-foreground text-xs">{a.phone}</p>
          </div>
        );
      },
    },
    ...(offer
      ? [
          {
            id: "offer",
            header: "Offer",
            cell: ({ row }) => (
              <Link to="/jobs/$jobId" params={{ jobId: row.original.offer.id }} className="font-medium text-sm hover:underline">
                {row.original.offer.title}
              </Link>
            ),
          } satisfies ColumnDef<AdminExternalApplication>,
        ]
      : []),
    ...(business
      ? [
          {
            id: "business",
            header: "Business",
            cell: ({ row }) =>
              row.original.business.name ? (
                <Link to="/profiles/$profileId" params={{ profileId: row.original.business.profileId }} className="text-sm hover:underline">
                  {row.original.business.name}
                </Link>
              ) : (
                "—"
              ),
          } satisfies ColumnDef<AdminExternalApplication>,
        ]
      : []),
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Badge className={STATUS_CLASS[row.original.status]}>{EXTERNAL_STATUS_LABEL[row.original.status]}</Badge>
          {row.original.knockedOut && <Badge variant="outline">Screened out</Badge>}
        </div>
      ),
    },
    {
      id: "score",
      header: "Score",
      cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.score ?? "—"}</span>,
    },
    {
      id: "answers",
      header: "Answers",
      cell: ({ row }) => {
        const answers = row.original.answers;
        return answers.length === 0 ? (
          <span className="text-muted-foreground text-sm">—</span>
        ) : (
          <span className="text-sm underline decoration-dotted" title={answers.map((x) => `${x.label}: ${x.value}`).join("\n")}>
            {answers.length}
          </span>
        );
      },
    },
    {
      id: "source",
      header: "Source",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.source ?? "—"}</span>,
    },
    {
      id: "applied",
      header: "Applied",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{date(row.original.createdAt)}</span>,
    },
    {
      id: "cv",
      header: () => <div className="hidden">CV</div>,
      cell: ({ row }) =>
        row.original.hasCv ? (
          <a
            href={externalApplicationCvUrl(row.original.id)}
            target="_blank"
            rel="noreferrer"
            title="Open the CV (recorded in the admin log)"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}
          >
            <IconFileText className="size-4" />
            CV
          </a>
        ) : (
          <span className="text-muted-foreground text-xs">No CV</span>
        ),
    },
  ];
}

const ALL_COLUMNS = careersColumns({ offer: true, business: true });
const FOR_OFFER = careersColumns({ offer: false, business: false });
const FOR_BUSINESS = careersColumns({ offer: true, business: false });

/** The URL state of the Applications page's « Careers page » tab. */
const parsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(appConfig.defaultPaginationLimit),
  q: parseAsString.withDefault(""),
  careers_status: parseAsArrayOf(parseAsString).withDefault([] as string[]),
};

/**
 * Every careers-page application (people who applied on a business's public
 * page, without a Rabotka profile): search, status and pages in the URL, like
 * the other admin lists.
 */
export function CareersApplicationsTable() {
  const [state] = useQueryStates(parsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    void setPage(1);
  }, [state.q, state.careers_status, setPage]);

  const query = useQuery({
    queryKey: ["admin", "external-applications", state],
    queryFn: () =>
      listExternalApplications({
        page: state.page,
        limit: state.limit,
        q: state.q,
        status: state.careers_status as ExternalApplicationStatus[],
      }),
    placeholderData: (prev) => prev,
  });

  return (
    <DataTable
      isPaginated
      data={query.data?.data ?? []}
      columns={ALL_COLUMNS}
      totalCount={query.data?.total ?? 0}
      isLoading={query.isLoading}
      getRowId={(row) => row.id}
      emptyMessage="No application from a careers page."
      header={
        <TableHeader>
          <TableHeaderToolbar
            searchParamKey="q"
            searchPlaceholder="Name, e-mail, phone, offer…"
            filters={[{ id: "careers_status", label: "Status", options: STATUS_OPTIONS }]}
          />
        </TableHeader>
      }
    />
  );
}

/**
 * One offer's or one business's careers-page applications, in a table under
 * its own subtitle (up to 100, newest first).
 */
export function CareersApplicationsSection({
  jobOfferId,
  employerId,
  title,
  description,
}: Readonly<{ jobOfferId?: string; employerId?: string; title: string; description?: string }>) {
  const query = useQuery({
    queryKey: ["admin", "external-applications", { jobOfferId, employerId }],
    queryFn: () => listExternalApplications({ page: 1, limit: 100, jobOfferId, employerId }),
  });
  const total = query.data?.total ?? 0;
  return (
    <DataTable
      data={query.data?.data ?? []}
      columns={jobOfferId ? FOR_OFFER : FOR_BUSINESS}
      isLoading={query.isLoading}
      getRowId={(row) => row.id}
      emptyMessage="No direct application yet."
      header={
        <div className="space-y-0.5">
          <h3 className="font-semibold text-base">
            {title} ({total})
          </h3>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
          {total > 100 && <p className="text-muted-foreground text-xs">The 100 most recent; see Applications › Careers page for all.</p>}
        </div>
      }
    />
  );
}
