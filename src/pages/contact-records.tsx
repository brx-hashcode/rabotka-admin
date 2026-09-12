import type { Table as TableInstance } from "@tanstack/react-table";
import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import {
  contactRecordColumns,
  contactOriginOptions,
  type ContactRecord,
} from "#/features/contact-records";
import { useContactRecordsList } from "#/hooks/use-contact-records-list";

function ContactRecordsTableHeader({
  table,
}: Readonly<{ table: TableInstance<ContactRecord> }>) {
  return (
    <TableHeader>
      <TableHeaderToolbar
        searchParamKey="q"
        searchPlaceholder="Filter by employer, worker or job..."
        filters={[
          { id: "origin", label: "Route", options: contactOriginOptions },
        ]}
        table={table}
      />
    </TableHeader>
  );
}

function renderContactRecordsHeader(table: TableInstance<ContactRecord>) {
  return <ContactRecordsTableHeader table={table} />;
}

export default function ContactRecordsPage() {
  const { data, total, isLoading } = useContactRecordsList();

  return (
    <div className="pt-6">
      <PageListHeader
        title="Paid contacts"
        description="Every time an employer paid to reach a worker — through a job offer (Mission) or straight from a recommendation (Direct). One row per payment, so an employer who paid twice for the same worker appears twice."
      />
      <DataTable
        isPaginated
        data={data}
        columns={contactRecordColumns}
        header={renderContactRecordsHeader}
        totalCount={total}
        isLoading={isLoading}
        getRowId={(row) => row.id}
      />
    </div>
  );
}
