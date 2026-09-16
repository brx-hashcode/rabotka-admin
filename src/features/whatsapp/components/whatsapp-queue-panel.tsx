import { IconRefresh } from "@tabler/icons-react";

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
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import {
  useRetryDlqJob,
  useWhatsappQueue,
} from "#/hooks/use-whatsapp-analytics";
import { useRole } from "#/hooks/use-role";
import {
  QUEUE_STATE_LABEL,
  failedSendReason,
  messageKindLabel,
} from "../labels";

/**
 * The send queue and the messages that gave up trying.
 *
 * The dead-letter queue is the reason this panel exists. It has been
 * accumulating permanently-failed sends in Redis since it was added, with no
 * consumer and no interface — so a message that exhausted its three BullMQ
 * attempts vanished from everyone's view while sitting right there.
 */

/** The counts worth showing, in the order a job moves through them. */
const COUNT_ORDER = [
  "waiting",
  "active",
  "delayed",
  "failed",
  "completed",
] as const;

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function CountTiles({ counts }: Readonly<{ counts: Record<string, number> }>) {
  return (
    <div className="grid grid-cols-2 gap-3 @xl/main:grid-cols-5">
      {COUNT_ORDER.map((key) => (
        <div key={key} className="bg-card shadow-soft rounded-md p-3">
          <p className="text-muted-foreground text-xs uppercase">
            {QUEUE_STATE_LABEL[key] ?? key}
          </p>
          <p className="text-2xl font-bold tabular-nums">
            {(counts[key] ?? 0).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

export function WhatsappQueuePanel({
  enabled = true,
}: Readonly<{ enabled?: boolean }>) {
  const { data, isLoading } = useWhatsappQueue(enabled);
  const retry = useRetryDlqJob();
  const { canEditArea } = useRole();
  const canRetry = canEditArea("/whatsapp");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[240px] w-full" />
      </div>
    );
  }

  const dlqJobs = data?.dlqJobs ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Bot replies waiting to be sent</CardTitle>
          <CardDescription>
            Replies from the WhatsApp bot line up here before they go out.
            Other messages are sent straight away, so they don't appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CountTiles counts={data?.outbound ?? {}} />
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Messages that could not be sent</CardTitle>
          <CardDescription>
            We tried each of these three times without success. "Try again"
            sends the same message once more.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CountTiles counts={data?.dlq ?? {}} />

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Failed at</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dlqJobs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground py-8 text-center text-sm"
                    >
                      Nothing here — every message went out.
                    </TableCell>
                  </TableRow>
                ) : (
                  dlqJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="text-sm text-nowrap">
                        {formatDate(job.failedAt)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {job.phone ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {messageKindLabel(job.type)}
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground max-w-sm truncate text-xs"
                        title={job.error ?? undefined}
                      >
                        {failedSendReason(job.error)}
                      </TableCell>
                      <TableCell className="text-right">
                        {canRetry ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={retry.isPending}
                            onClick={() => retry.mutate(job.id)}
                          >
                            <IconRefresh className="size-4" aria-hidden />
                            Try again
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
