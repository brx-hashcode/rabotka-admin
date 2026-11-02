import type { Table as TableInstance } from "@tanstack/react-table";
import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import { BulkDeleteButton } from "#/components/table/bulk-delete-button";
import { BulkPurgeButton } from "#/components/table/bulk-purge-button";
import { BulkRestoreButton } from "#/components/table/bulk-restore-button";
import {
  deletedFilterOptions,
  useIsDeletedView,
} from "#/components/table/deleted-filter";
import {
  applicationColumns,
  applicationStatusOptions,
  penaltyAppliedOptions,
  ApplicationExportMenu,
  type Application,
} from "#/features/applications-admin";
import { useApplicationsList } from "#/hooks/use-applications-list";
import {
  bulkDeleteApplications,
  bulkPurgeApplications,
  bulkRestoreApplications,
} from "#/lib/api/applications-controller";
import { useRole } from "#/hooks/use-role";
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { CareersApplicationsTable } from "#/features/careers-applications/careers-applications-table";

function ApplicationsTableHeader({
  table,
}: Readonly<{ table: TableInstance<Application> }>) {
  const { canManageContent, canPurge } = useRole();
  const deletedView = useIsDeletedView();
  return (
    <TableHeader>
      <TableHeaderToolbar
        searchParamKey="q"
        searchPlaceholder="Filter applications..."
        filters={[
          {
            id: "status",
            label: "Status",
            options: applicationStatusOptions,
          },
          {
            id: "penalty_applied",
            label: "Penalty",
            options: penaltyAppliedOptions,
          },
          { id: "deleted", label: "Deleted", options: deletedFilterOptions },
        ]}
        table={table}
      >
        {deletedView ? (
          <>
            <BulkRestoreButton
              table={table}
              restoreFn={bulkRestoreApplications}
              queryKey={["admin", "applications"]}
              entityLabel="application"
              disabled={!canManageContent}
            />
            <BulkPurgeButton
              table={table}
              purgeFn={bulkPurgeApplications}
              queryKey={["admin", "applications"]}
              entityLabel="application"
              disabled={!canPurge}
            />
          </>
        ) : (
          <BulkDeleteButton
            table={table}
            deleteFn={bulkDeleteApplications}
            queryKey={["admin", "applications"]}
            entityLabel="application"
            disabled={!canManageContent}
          />
        )}
        <ApplicationExportMenu />
      </TableHeaderToolbar>
    </TableHeader>
  );
}

function renderApplicationsHeader(table: TableInstance<Application>) {
  return <ApplicationsTableHeader table={table} />;
}

export default function ApplicationsPage() {
  const [source, setSource] = useQueryState("source", parseAsStringLiteral(["rabotka", "careers"] as const).withDefault("rabotka"));
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  return (
    <div>
      <PageListHeader
        title="Applications"
        description="Track job applications, penalties and application status — from the Rabotka app and from businesses' careers pages."
      />
      {/* Two kinds: Rabotka workers, and people who applied on a careers page without a profile. */}
      <div className="mb-4 border-b">
        <Tabs
          value={source}
          onValueChange={(v) => {
            void setSource(v as "rabotka" | "careers");
            void setPage(null);
          }}
        >
          <TabsList variant="line" className="h-auto gap-4 p-0">
            <TabsTrigger value="rabotka" className="flex-none px-1 pb-2.5">
              Rabotka app
            </TabsTrigger>
            <TabsTrigger value="careers" className="flex-none px-1 pb-2.5">
              Careers page
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {source === "rabotka" ? <RabotkaApplications /> : <CareersApplicationsTable />}
    </div>
  );
}

function RabotkaApplications() {
  const { data, total, isLoading } = useApplicationsList();
  return (
    <div>
      <DataTable
        isPaginated
        enableRowSelection
        data={data}
        columns={applicationColumns}
        header={renderApplicationsHeader}
        totalCount={total}
        isLoading={isLoading}
        getRowId={(row) => row.id}
      />
    </div>
  );
}
