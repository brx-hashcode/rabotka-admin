import { format } from "date-fns";
import type { AdminLogItem } from "#/lib/api/logs-controller";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "#/components/ui/sheet";
import { Badge } from "#/components/ui/badge";
import { TechnicalDetails } from "#/components/technical-details";
import { actionLabel, recordTypeLabel } from "#/lib/log-labels";

type LogDetailSheetProps = {
  log: AdminLogItem | null;
  onClose: () => void;
};

function Field({
  label,
  value,
}: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm break-all">{value ?? "—"}</p>
    </div>
  );
}

export function LogDetailSheet({
  log,
  onClose,
}: Readonly<LogDetailSheetProps>) {
  const rawData = log
    ? JSON.stringify(
        {
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          userId: log.userId,
          userName: log.userName,
          profileId: log.profileId,
          profileName: log.profileName,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          metadata: log.metadata,
          createdAt: log.createdAt,
        },
        null,
        2,
      )
    : "";

  return (
    <Sheet
      open={Boolean(log)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <div className="shrink-0 pb-4 border-b">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{actionLabel(log?.action ?? null)}</Badge>
              <span className="text-muted-foreground text-xs font-normal">
                {log?.createdAt
                  ? format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")
                  : ""}
              </span>
            </SheetTitle>
            <SheetDescription>
              What happened, who did it and when
            </SheetDescription>
          </SheetHeader>
        </div>

        {log && (
          <div className="flex flex-col gap-5 px-6 py-5 flex-1 overflow-y-auto min-h-0">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="About" value={recordTypeLabel(log.entityType)} />
              <Field
                label="When"
                value={format(new Date(log.createdAt), "PPpp")}
              />
              <Field label="Done by (team)" value={log.userName ?? "—"} />
              <Field label="Done by (user)" value={log.profileName ?? "—"} />
            </div>

            <TechnicalDetails
              rows={[
                { label: "Action code", value: log.action },
                { label: "Record type", value: log.entityType },
                { label: "Record reference", value: log.entityId },
                { label: "Internet address (IP)", value: log.ipAddress },
                { label: "Device and browser", value: log.userAgent },
              ]}
            >
              <pre className="bg-background max-h-80 overflow-y-auto rounded-md p-3 text-xs leading-relaxed whitespace-pre-wrap break-all">
                {rawData}
              </pre>
            </TechnicalDetails>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
