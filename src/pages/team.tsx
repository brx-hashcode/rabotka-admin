import { useState } from "react";
import type { Table as TableInstance } from "@tanstack/react-table";
import { IconPlus } from "@tabler/icons-react";

import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import { Button } from "#/components/ui/button";
import { BulkDeleteButton } from "#/components/table/bulk-delete-button";
import { BulkPurgeButton } from "#/components/table/bulk-purge-button";
import { BulkRestoreButton } from "#/components/table/bulk-restore-button";
import {
  deletedFilterOptions,
  useIsDeletedView,
} from "#/components/table/deleted-filter";
import { useUsersList } from "#/hooks/use-users-list";
import { useRole } from "#/hooks/use-role";
import {
  bulkDeleteUsers,
  bulkPurgeUsers,
  bulkRestoreUsers,
} from "#/lib/api/users-controller";
import {
  userColumns,
  userRoleOptions,
  UserModal,
  KycReviewersCard,
  type AdminUser,
} from "#/features/team";

function UsersTableHeader({
  table,
  onCreateClick,
  canManageTeam,
  canDeleteTeam,
  canPurge,
}: Readonly<{
  table: TableInstance<AdminUser>;
  onCreateClick: () => void;
  canManageTeam: boolean;
  canDeleteTeam: boolean;
  canPurge: boolean;
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
        {deletedView ? (
          <>
            <BulkRestoreButton
              table={table}
              restoreFn={bulkRestoreUsers}
              queryKey={["admin", "users"]}
              entityLabel="user"
              disabled={!canDeleteTeam}
            />
            <BulkPurgeButton
              table={table}
              purgeFn={bulkPurgeUsers}
              queryKey={["admin", "users"]}
              entityLabel="user"
              disabled={!canPurge}
            />
          </>
        ) : (
          <BulkDeleteButton
            table={table}
            deleteFn={bulkDeleteUsers}
            queryKey={["admin", "users"]}
            entityLabel="user"
            disabled={!canDeleteTeam}
          />
        )}
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
  const { canManageTeam, canDeleteTeam, canPurge } = useRole();
  const [createOpen, setCreateOpen] = useState(false);

  function renderHeader(table: TableInstance<AdminUser>) {
    return (
      <UsersTableHeader
        table={table}
        onCreateClick={() => setCreateOpen(true)}
        canManageTeam={canManageTeam}
        canDeleteTeam={canDeleteTeam}
        canPurge={canPurge}
      />
    );
  }

  return (
    <div className="space-y-8 pt-6">
      <PageListHeader
        title="Team Members"
        description="Manage admin users, roles and access to the back office."
      />
      <KycReviewersCard canManage={canManageTeam} />
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
