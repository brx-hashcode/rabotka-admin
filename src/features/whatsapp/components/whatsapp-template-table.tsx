import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import type { WhatsappStats } from "#/lib/api/whatsapp-controller";
import { WhatsappCategoryBadge } from "./whatsapp-status-badge";
import { sendErrorLabel, templateLabel } from "../labels";

/**
 * Which templates are working, and which are quietly failing.
 *
 * Sorted by volume rather than by failure rate on purpose: a template sent
 * twice that failed once is 50% failed and almost never the thing to fix,
 * while the same rate on the OTP template is an outage. Volume first puts the
 * expensive problems at the top.
 */

function rate(part: number, whole: number): string {
  if (whole <= 0) return "—";
  return `${Math.round((part / whole) * 1000) / 10}%`;
}

export function WhatsappTemplateTable({
  stats,
}: Readonly<{ stats: WhatsappStats | undefined }>) {
  const rows = stats?.byTemplate ?? [];

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>By approved message</CardTitle>
        <CardDescription>
          Most-sent first — a high failure rate matters more when many people
          get that message.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Message</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead className="text-right">Failed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-8 text-center text-sm"
                  >
                    No approved messages were sent in this period.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.templateKey}>
                    <TableCell className="text-sm" title={row.templateKey}>
                      {templateLabel(row.templateKey)}
                    </TableCell>
                    <TableCell>
                      <WhatsappCategoryBadge category={row.category} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.delivered.toLocaleString()}
                      <span className="text-muted-foreground ml-2 text-xs">
                        {rate(row.delivered, row.total)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={row.failed > 0 ? "text-rose-600" : ""}>
                        {row.failed.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {rate(row.failed, row.total)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function WhatsappErrorTable({
  stats,
}: Readonly<{ stats: WhatsappStats | undefined }>) {
  const rows = stats?.byError ?? [];

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Failure reasons</CardTitle>
        <CardDescription>
          Why messages weren't delivered, grouped by cause.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead>What WhatsApp said (example)</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-muted-foreground py-8 text-center text-sm"
                  >
                    No failed messages in this period.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.errorCode}>
                    <TableCell
                      className="text-sm text-rose-600"
                      title={row.errorCode}
                    >
                      {sendErrorLabel(row.errorCode)}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-md truncate text-sm">
                      {row.sample ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.count.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
