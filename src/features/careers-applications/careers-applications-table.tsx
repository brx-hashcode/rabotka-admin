import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IconFileText, IconSearch } from "@tabler/icons-react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import {
  EXTERNAL_STATUS_LABEL,
  externalApplicationCvUrl,
  listExternalApplications,
  type ExternalApplicationStatus,
} from "#/lib/api/external-applications-controller";
import { friendlyError } from "#/lib/api/friendly-error";

const STATUS_CLASS: Record<ExternalApplicationStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  RETAINED: "bg-green-500/15 text-green-700 dark:text-green-400",
  REFUSED: "bg-muted text-muted-foreground",
};
const LIMIT = 20;

const date = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * Applications from businesses' public careers pages. They have no Rabotka
 * profile, so they live beside Applications: on their own, for one offer
 * (`jobOfferId`) or one business (`employerId`).
 */
export function CareersApplicationsTable({
  jobOfferId,
  employerId,
  title = "Careers page applications",
}: Readonly<{ jobOfferId?: string; employerId?: string; title?: string }>) {
  const scoped = !!jobOfferId || !!employerId;
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ExternalApplicationStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin", "external-applications", { q, status, page, jobOfferId, employerId }],
    queryFn: () =>
      listExternalApplications({
        page,
        limit: LIMIT,
        q,
        status: status === "ALL" ? undefined : [status],
        jobOfferId,
        employerId,
      }),
    placeholderData: (prev) => prev,
  });
  const rows = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-sm">
          {title} <span className="font-normal text-muted-foreground">({total})</span>
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <IconSearch className="-translate-y-1/2 absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Name, e-mail, phone, offer…"
              className="h-8 w-56 pl-8"
            />
          </div>
          {(["ALL", "PENDING", "RETAINED", "REFUSED"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={status === s ? "default" : "outline"}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
            >
              {s === "ALL" ? "All" : EXTERNAL_STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {query.isLoading ? (
          <div className="space-y-2 p-6">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <p className="p-6 text-destructive text-sm">{friendlyError(query.error, "Could not load the careers page applications.")}</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-muted-foreground text-sm">
            {q || status !== "ALL" ? "No application matches." : "No application from a careers page yet."}
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3 text-sm">
                <div className="min-w-48 flex-1">
                  <p className="font-medium">
                    {a.firstName} {a.lastName}
                    {a.score !== null && <span className="ml-2 text-muted-foreground text-xs">score {a.score}</span>}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {a.email} · {a.phone}
                    {a.source && ` · via ${a.source}`}
                  </p>
                </div>
                {!jobOfferId && (
                  <div className="min-w-40 flex-1 text-xs">
                    <Link to="/jobs/$jobId" params={{ jobId: a.offer.id }} className="font-medium hover:underline">
                      {a.offer.title}
                    </Link>
                    {!scoped && a.business.name && (
                      <p className="text-muted-foreground">
                        <Link to="/profiles/$profileId" params={{ profileId: a.business.profileId }} className="hover:underline">
                          {a.business.name}
                        </Link>
                      </p>
                    )}
                  </div>
                )}
                <span className="text-muted-foreground text-xs">{date(a.createdAt)}</span>
                {a.knockedOut && <Badge variant="outline">Screened out</Badge>}
                {a.answers.length > 0 && (
                  <span className="text-muted-foreground text-xs" title={a.answers.map((x) => `${x.label}: ${x.value}`).join("\n")}>
                    {a.answers.length} answer{a.answers.length > 1 ? "s" : ""}
                  </span>
                )}
                <Badge className={STATUS_CLASS[a.status]}>{EXTERNAL_STATUS_LABEL[a.status]}</Badge>
                {a.hasCv ? (
                  <a
                    href={externalApplicationCvUrl(a.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-xs hover:underline"
                    title="Opening the CV is recorded in the admin log"
                  >
                    <IconFileText className="size-4" />
                    CV
                  </a>
                ) : (
                  <span className="text-muted-foreground text-xs">No CV</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-end gap-2 border-t px-6 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {page} of {pages}
            </span>
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
