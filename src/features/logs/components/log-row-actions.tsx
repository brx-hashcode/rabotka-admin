import { ArrowRight } from "lucide-react";
import { Button } from "#/components/ui/button";
import type { AdminLogItem } from "#/lib/api/logs-controller";

type LogRowActionsProps = {
  log: AdminLogItem;
  onView: (log: AdminLogItem) => void;
};

export function LogRowActions({ log, onView }: Readonly<LogRowActionsProps>) {
  return (
    <Button variant="ghost" size="icon" onClick={() => onView(log)}>
      <ArrowRight className="size-4" aria-hidden />
    </Button>
  );
}
