import { useState } from "react";
import type { Table as TableInstance } from "@tanstack/react-table";
import { IconPlus } from "@tabler/icons-react";

import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import { Button } from "#/components/ui/button";
import { useUsersList } from "#/hooks/use-users-list";
import {
  userColumns,
  userRoleOptions,
  UserModal,
  type AdminUser,
} from "#/features/team";

function UsersTableHeader({
  table,
  onCreateClick,
}: Readonly<{ table: TableInstance<AdminUser>; onCreateClick: () => void }>) {
  return (
    <TableHeader>
      <TableHeaderToolbar
        searchParamKey="q"
        searchPlaceholder="Search by name or email..."
        filters={[{ id: "role", label: "Role", options: userRoleOptions }]}
        table={table}
      >
        <Button size="sm" onClick={onCreateClick}>
          <IconPlus className="mr-1.5 size-4" />
          New User
        </Button>
      </TableHeaderToolbar>
    </TableHeader>
  );
}

export default function TeamPage() {
  const { data, total, isLoading } = useUsersList();
  const [createOpen, setCreateOpen] = useState(false);

  function renderHeader(table: TableInstance<AdminUser>) {
    return (
      <UsersTableHeader
        table={table}
        onCreateClick={() => setCreateOpen(true)}
      />
    );
  }

  return (
    <div className="space-y-8 pt-6">
      <DataTable
        isPaginated
        enableRowSelection
        data={data}
        columns={userColumns}
        header={renderHeader}
        totalCount={total}
        isLoading={isLoading}
        getRowId={(row) => row.id}
      />

      <UserModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
