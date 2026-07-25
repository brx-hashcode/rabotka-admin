import { useState } from "react";
import type { Table as TableInstance } from "@tanstack/react-table";
import { IconPlus } from "@tabler/icons-react";

import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import { Button } from "#/components/ui/button";
import { BulkDeleteButton } from "#/components/table/bulk-delete-button";
import {
  deletedFilterOptions,
  useIsDeletedView,
} from "#/components/table/deleted-filter";
import { useUsersList } from "#/hooks/use-users-list";
import { useRole } from "#/hooks/use-role";
import { bulkDeleteUsers } from "#/lib/api/users-controller";
import {
  userColumns,
  userRoleOptions,
  UserModal,
  type AdminUser,
} from "#/features/team";

function UsersTableHeader({
  table,
  onCreateClick,
  canManageTeam,
  canDeleteTeam,
}: Readonly<{
  table: TableInstance<AdminUser>;
  onCreateClick: () => void;
  canManageTeam: boolean;
  canDeleteTeam: boolean;
}>) {
  const deletedView = useIsDeletedView();
  return (
    <TableHeader>
      <TableHeaderToolbar
        searchParamKey="q"
        searchPlaceholder="Search by name or email..."
        filters={[
          { id: "role", label: "Role", options: userRoleOptions },
          { id: "deleted", label: "Deleted", options: deletedFilterOptions },
        ]}
        table={table}
      >
        <BulkDeleteButton
          table={table}
          deleteFn={bulkDeleteUsers}
          queryKey={["admin", "users"]}
          entityLabel="user"
          disabled={!canDeleteTeam || deletedView}
        />
        {canManageTeam && (
          <Button size="sm" onClick={onCreateClick}>
            <IconPlus className="mr-1.5 size-4" />
            New User
          </Button>
        )}
      </TableHeaderToolbar>
    </TableHeader>
  );
}

export default function TeamPage() {
  const { data, total, isLoading } = useUsersList();
  const { canManageTeam, canDeleteTeam } = useRole();
  const [createOpen, setCreateOpen] = useState(false);

  function renderHeader(table: TableInstance<AdminUser>) {
    return (
      <UsersTableHeader
        table={table}
        onCreateClick={() => setCreateOpen(true)}
        canManageTeam={canManageTeam}
        canDeleteTeam={canDeleteTeam}
      />
    );
  }

  return (
    <div className="space-y-8 pt-6">
      <PageListHeader
        title="Team Members"
        description="Manage admin users, roles and access to the back office."
      />
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
