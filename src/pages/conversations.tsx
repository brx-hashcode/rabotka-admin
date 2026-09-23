import type { Table as TableInstance } from "@tanstack/react-table";
import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import {
  conversationColumns,
  conversationFlagOptions,
  conversationStatusOptions,
  type Conversation,
} from "#/features/conversations";
import { useConversationsList } from "#/hooks/use-conversations-list";

function ConversationsTableHeader({
  table,
}: Readonly<{ table: TableInstance<Conversation> }>) {
  return (
    <TableHeader>
      <TableHeaderToolbar
        searchParamKey="q"
        searchPlaceholder="Filter by worker, employer or job..."
        filters={[
          {
            id: "status",
            label: "Status",
            options: conversationStatusOptions,
          },
          { id: "flags", label: "Flags", options: conversationFlagOptions },
        ]}
        table={table}
      />
    </TableHeader>
  );
}

function renderConversationsHeader(table: TableInstance<Conversation>) {
  return <ConversationsTableHeader table={table} />;
}

export default function ConversationsPage() {
  const { data, total, isLoading } = useConversationsList();

  return (
    <div>
      <PageListHeader
        title="Conversations"
        description="Every conversation between a worker and an employer, most recently active first. This list carries no message text: it shows who is talking to whom and how often something had to be withheld. Reading a thread is a separate step, and it is recorded in the activity log."
      />
      <DataTable
        isPaginated
        data={data}
        columns={conversationColumns}
        header={renderConversationsHeader}
        totalCount={total}
        isLoading={isLoading}
        getRowId={(row) => row.id}
      />
    </div>
  );
}
