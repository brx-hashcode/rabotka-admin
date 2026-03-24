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

export function LogDetailSheet({ log, onClose }: Readonly<LogDetailSheetProps>) {
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
    <Sheet open={Boolean(log)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{log?.action}</Badge>
            <span className="text-muted-foreground text-xs font-normal">
              {log?.createdAt
                ? format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")
                : ""}
            </span>
          </SheetTitle>
          <SheetDescription>Log entry details and raw payload</SheetDescription>
        </SheetHeader>

        {log && (
          <div className="mt-6 flex flex-col gap-6 px-1">
            {/* Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Entity Type" value={log.entityType} />
              <Field label="Entity ID" value={log.entityId} />
              <Field
                label="Actor (Admin)"
                value={log.userName ?? "—"}
              />
              <Field
                label="Actor (Profile)"
                value={log.profileName ?? "—"}
              />
              <Field label="IP Address" value={log.ipAddress} />
              <Field label="Created At" value={format(new Date(log.createdAt), "PPpp")} />
            </div>

            {/* User Agent */}
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

            {/* Raw JSON */}
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Raw Data
              </p>
              <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                {rawData}
              </pre>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
