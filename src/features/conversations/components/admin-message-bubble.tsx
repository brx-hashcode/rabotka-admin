import { IconAlertTriangle, IconFlag } from "@tabler/icons-react";

import { Badge } from "#/components/ui/badge";
import { cn } from "#/lib/utils";
import type { AdminMessage } from "#/lib/api/conversations-controller";
import { redactionSegments } from "../redaction-segments";

const CATEGORY_LABELS: Record<string, string> = {
  PHONE: "Phone",
  EMAIL: "Email",
  MESSAGING_HANDLE: "Messaging handle",
  URL: "Link",
  OBFUSCATED_DIGITS: "Spelled-out digits",
};

function formatTime(value: string): string {
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

/**
 * One message, in the shape the profile Messages tab uses: name above, bubble,
 * timestamp below, sides picked by who wrote it.
 *
 * Two things it adds, because this thread is read for a different reason than
 * that one — it is read when something has gone wrong:
 *
 * - withheld fragments are HIGHLIGHTED inside the bubble;
 * - a message that never arrived says so, rather than sitting in the flow as if
 *   the other party had read it.
 */
export function AdminMessageBubble({
  message,
}: Readonly<{ message: AdminMessage }>) {
  const isWorker = message.senderSide === "WORKER";
  const held = message.status === "HELD";
  const segments = redactionSegments(message.body, message.redactions);
  const pendingReports = message.reports.filter((r) => r.reviewedAt === null);

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1",
        // Worker left, employer right — FIXED, not relative to the reader. The
        // admin wrote none of this, so there is no "mine" to key a side on.
        isWorker ? "items-start" : "items-end",
      )}
    >
      <span className="text-muted-foreground px-1 text-xs">
        {message.senderName}
        <span className="ml-1.5 opacity-70">
          {isWorker ? "worker" : "employer"}
        </span>
      </span>

      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          isWorker
            ? "bg-muted text-foreground rounded-tl-sm"
            : "bg-primary text-primary-foreground rounded-tr-sm",
          // Never delivered, so it must not sit in the flow looking like part of
          // the conversation the two of them actually had.
          held &&
            "border-destructive/50 bg-destructive/10 text-foreground border border-dashed",
        )}
      >
        {segments.map((segment, i) =>
          segment.withheld ? (
            // HIGHLIGHTED, never struck through. This is text the recipient
            // never saw — the only text on screen that matters. A strike would
            // read as "void", which is exactly backwards.
            //
            // Fixed amber with near-black text rather than a themed token: it
            // has to stay legible on the muted bubble AND on the solid primary
            // one, which a translucent highlight does not.
            <mark
              key={i}
              title={`${CATEGORY_LABELS[segment.category ?? ""] ?? segment.category} · matched by ${segment.matchedBy}`}
              className="rounded-sm bg-amber-300 px-0.5 font-medium text-amber-950"
            >
              {segment.text}
            </mark>
          ) : (
            <span key={i}>{segment.text}</span>
          ),
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 px-1">
        <span className="text-muted-foreground text-[11px]">
          {formatTime(message.createdAt)}
        </span>

        {held && (
          <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
            Never delivered
          </Badge>
        )}
        {message.status === "REDACTED" && (
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            Withheld ×{message.redactions.length}
          </Badge>
        )}
        {/* The semantic pass carries no offsets — it says a message looked like
            a contact exchange, not where. So it is a chip, never a highlight. */}
        {message.semanticFlagged && (
          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
            Flagged by meaning
          </Badge>
        )}
        {message.deletedAt && (
          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
            Deleted
          </Badge>
        )}
      </div>

      {held && (
        <p className="text-muted-foreground flex items-center gap-1 px-1 text-[11px]">
          <IconAlertTriangle className="size-3 shrink-0" aria-hidden />
          Held back whole — this text exists nowhere else.
        </p>
      )}

      {pendingReports.map((report) => (
        <p
          key={report.id}
          className="flex max-w-[70%] items-start gap-1.5 px-1 text-[11px] text-amber-600 dark:text-amber-500"
        >
          <IconFlag className="mt-px size-3 shrink-0" aria-hidden />
          <span>
            The sender says this was not a contact detail.
            {report.note ? ` « ${report.note} »` : ""}
          </span>
        </p>
      ))}
    </div>
  );
}
