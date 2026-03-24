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
              <Badge variant="outline">{log?.action}</Badge>
              <span className="text-muted-foreground text-xs font-normal">
                {log?.createdAt
                  ? format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")
                  : ""}
              </span>
            </SheetTitle>
            <SheetDescription>
              Log entry details and raw payload
            </SheetDescription>
          </SheetHeader>
        </div>

        {log && (
          <div className="flex flex-col gap-5 px-6 py-5 flex-1 overflow-y-auto min-h-0">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Entity Type" value={log.entityType} />
              <Field label="Entity ID" value={log.entityId} />
              <Field label="Actor (Admin)" value={log.userName ?? "—"} />
              <Field label="Actor (Profile)" value={log.profileName ?? "—"} />
              <Field label="IP Address" value={log.ipAddress} />
              <Field
                label="Created At"
                value={format(new Date(log.createdAt), "PPpp")}
              />
            </div>

            {log.userAgent && (
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  User Agent
                </p>
                <p className="text-xs text-muted-foreground break-all leading-relaxed">
                  {log.userAgent}
                </p>
              </div>
            )}

            <div className="flex flex-col flex-1 min-h-0 space-y-1.5">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide shrink-0">
                Raw Data
              </p>
              <pre className="bg-muted rounded-md p-3 text-xs leading-relaxed whitespace-pre-wrap break-all flex-1 overflow-y-auto min-h-0">
                {rawData}
              </pre>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
