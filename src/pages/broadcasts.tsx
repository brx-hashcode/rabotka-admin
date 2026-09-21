import type { Table as TableInstance } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import { Button } from "#/components/ui/button";
import {
  broadcastColumns,
  broadcastStatusOptions,
} from "#/features/broadcasts/components/broadcast-columns";
import { useBroadcastsList } from "#/hooks/use-broadcasts-list";
import { useRole } from "#/hooks/use-role";
import type { Broadcast } from "#/lib/api/broadcasts-controller";

function BroadcastsTableHeader({
  table,
}: Readonly<{ table: TableInstance<Broadcast> }>) {
  return (
    <TableHeader>
      <TableHeaderToolbar
        filters={[
          { id: "status", label: "Status", options: broadcastStatusOptions },
        ]}
        table={table}
      />
    </TableHeader>
  );
}

function renderBroadcastsHeader(table: TableInstance<Broadcast>) {
  return <BroadcastsTableHeader table={table} />;
}

export default function BroadcastsPage() {
  const { data, total, isLoading } = useBroadcastsList();
  const { canManageContent } = useRole();

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <PageListHeader
          title="Broadcasts"
          description="One message to a segment of workers or employers."
        />
        {canManageContent ? (
          <Button render={<Link to="/broadcasts/new" />}>
            <Plus className="size-4" />
            New broadcast
          </Button>
        ) : null}
      </div>

      <DataTable
        isPaginated
        data={data}
        columns={broadcastColumns}
        header={renderBroadcastsHeader}
        totalCount={total}
        isLoading={isLoading}
        getRowId={(row) => row.id}
      />
    </div>
  );
}
