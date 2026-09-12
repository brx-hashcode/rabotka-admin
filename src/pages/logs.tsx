import { useState, useCallback, useMemo } from "react";
import type { Table as TableInstance } from "@tanstack/react-table";
import {
  parseAsString,
  useQueryState,
} from "nuqs";

import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import { DateRangePicker } from "#/components/ui/date-range-picker";
import {
  makeLogColumns,
  entityTypeOptions,
  LogDetailSheet,
} from "#/features/logs";
import { useLogsList } from "#/hooks/use-logs-list";
import type { AdminLogItem } from "#/lib/api/logs-controller";

function LogsTableHeader({
  table,
}: Readonly<{ table: TableInstance<AdminLogItem> }>) {
  const [createdFrom, setCreatedFrom] = useQueryState(
    "created_from",
    parseAsString.withDefault(""),
  );
  const [createdTo, setCreatedTo] = useQueryState(
    "created_to",
    parseAsString.withDefault(""),
  );

  const extraFiltersActive = !!createdFrom || !!createdTo;

  const handleResetExtras = () => {
    void setCreatedFrom("");
    void setCreatedTo("");
  };

  return (
    <TableHeader>
      <div className="flex flex-wrap items-center gap-2">
        <TableHeaderToolbar
          searchParamKey="q"
          searchPlaceholder="Search logs..."
          filters={[{ id: "entity_type", label: "Entity type", options: entityTypeOptions }]}
          table={table}
          extraFiltersActive={extraFiltersActive}
          onResetExtras={handleResetExtras}
        />
        <DateRangePicker
          from={createdFrom}
          to={createdTo}
          onFromChange={setCreatedFrom}
          onToChange={setCreatedTo}
        />
      </div>
    </TableHeader>
  );
}

function renderLogsTableHeader(table: TableInstance<AdminLogItem>) {
  return <LogsTableHeader table={table} />;
}

export default function LogsPage() {
  const { data, total, isLoading } = useLogsList();
  const [selectedLog, setSelectedLog] = useState<AdminLogItem | null>(null);

  const handleView = useCallback((log: AdminLogItem) => {
    setSelectedLog(log);
  }, []);

  const columns = useMemo(() => makeLogColumns(handleView), [handleView]);

  return (
    <>
      <div>
        <PageListHeader
          title="Activity Logs"
          description="Audit trail of admin actions and system events across entities."
        />
        <DataTable
          isPaginated
          data={data}
          columns={columns}
          header={renderLogsTableHeader}
          totalCount={total}
          isLoading={isLoading}
          getRowId={(row) => row.id}
        />
      </div>
      <LogDetailSheet
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </>
  );
}
