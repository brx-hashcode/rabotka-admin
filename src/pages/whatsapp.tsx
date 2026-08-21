import { useCallback, useMemo, useState } from "react";
import type { Table as TableInstance } from "@tanstack/react-table";
import { parseAsString, useQueryState } from "nuqs";

import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import { DateRangePicker } from "#/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
  makeWhatsappMessageColumns,
  WhatsappMessageDetailSheet,
  WhatsappStatCards,
  WhatsappDeliveryChart,
  WhatsappTemplateTable,
  WhatsappErrorTable,
  WhatsappBillingPanel,
  WhatsappQueuePanel,
  WhatsappExportMenu,
  WhatsappRangeToggle,
  describeRange,
  whatsappStatusOptions,
} from "#/features/whatsapp";
import { useWhatsappMessagesList } from "#/hooks/use-whatsapp-messages-list";
import {
  useWhatsappRange,
  useWhatsappStats,
} from "#/hooks/use-whatsapp-analytics";
import type { WhatsappMessageItem } from "#/lib/api/whatsapp-controller";

const kindOptions = [
  { value: "template", label: "Template" },
  { value: "text", label: "Text" },
  { value: "media", label: "Media" },
  { value: "flow", label: "Flow" },
] as const;

const providerOptions = [
  { value: "cloud", label: "Meta Cloud" },
  { value: "twilio", label: "Twilio" },
] as const;

/**
 * The date range lives in the URL and is read by BOTH the message table and
 * the analytics hooks, so switching tabs keeps the window the reader chose.
 */
function WhatsappDateRange() {
  const [createdFrom, setCreatedFrom] = useQueryState(
    "created_from",
    parseAsString.withDefault(""),
  );
  const [createdTo, setCreatedTo] = useQueryState(
    "created_to",
    parseAsString.withDefault(""),
  );

  return (
    <DateRangePicker
      from={createdFrom}
      to={createdTo}
      onFromChange={setCreatedFrom}
      onToChange={setCreatedTo}
    />
  );
}

function MessagesTableHeader({
  table,
  templateOptions,
}: Readonly<{
  table: TableInstance<WhatsappMessageItem>;
  templateOptions: readonly { value: string; label: string }[];
}>) {
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
      {/*
        The date range goes through `extraFilters` rather than sitting beside
        the toolbar: the page already passed `extraFiltersActive` and
        `onResetExtras`, so Reset was clearing a control the toolbar did not
        render. Passing it here also keeps Export at the far right, next to
        View, where every other table puts it.
      */}
      <TableHeaderToolbar
        searchParamKey="q"
        searchPlaceholder="Search phone, content, template, message id..."
        filters={[
          { id: "status", label: "Status", options: whatsappStatusOptions },
          { id: "kind", label: "Type", options: kindOptions },
          ...(templateOptions.length > 0
            ? [
                {
                  id: "template_key",
                  label: "Template",
                  options: templateOptions,
                },
              ]
            : []),
          { id: "provider", label: "Provider", options: providerOptions },
        ]}
        table={table}
        extraFilters={<WhatsappDateRange />}
        extraFiltersActive={extraFiltersActive}
        onResetExtras={handleResetExtras}
      >
        <WhatsappExportMenu />
      </TableHeaderToolbar>
    </TableHeader>
  );
}

export default function WhatsappPage() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("messages"),
  );
  const { data, total, isLoading } = useWhatsappMessagesList();
  const { data: stats, isLoading: statsLoading } = useWhatsappStats();
  const [selected, setSelected] = useState<WhatsappMessageItem | null>(null);

  const range = useWhatsappRange();
  const windowLabel = describeRange(
    range.created_from ?? "",
    range.created_to ?? "",
  );

  const handleView = useCallback((message: WhatsappMessageItem) => {
    setSelected(message);
  }, []);

  const columns = useMemo(
    () => makeWhatsappMessageColumns(handleView),
    [handleView],
  );

  // Built from what has actually been sent rather than from a hardcoded list:
  // the template registry moves, and a filter offering templates nobody uses
  // (or missing a new one) is worse than no filter.
  const templateOptions = useMemo(
    () =>
      (stats?.byTemplate ?? []).map((row) => ({
        value: row.templateKey,
        label: row.templateKey,
      })),
    [stats],
  );

  const renderHeader = useCallback(
    (table: TableInstance<WhatsappMessageItem>) => (
      <MessagesTableHeader table={table} templateOptions={templateOptions} />
    ),
    [templateOptions],
  );

  return (
    <>
      <div className="flex flex-col gap-4 pt-6">
        {/*
          The preset toggle writes the SAME `created_from`/`created_to` params
          `useWhatsappStats` already reads, so it moves the cards below and the
          Analytics and Consumption tabs together — one window for the whole
          page rather than a second control that can disagree with the first.

          The label beside it is not redundant with the buttons: after picking
          custom dates in a tab's date picker no preset is highlighted, and
          without it the cards would state no window at all.
        */}
        <PageListHeader
          title="WhatsApp"
          description="Every message sent, who it went to, what it said, and whether it arrived."
          actions={
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground hidden text-xs sm:inline">
                {windowLabel}
              </span>
              <WhatsappRangeToggle />
            </div>
          }
        />

        <WhatsappStatCards stats={stats} isLoading={statsLoading} />

        <Tabs value={tab} onValueChange={(value) => void setTab(value)}>
          <TabsList>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="billing">Consumption</TabsTrigger>
            <TabsTrigger value="queue">Queue</TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <DataTable
              isPaginated
              data={data}
              columns={columns}
              header={renderHeader}
              totalCount={total}
              isLoading={isLoading}
              getRowId={(row) => row.id}
              emptyMessage="No messages match these filters."
            />
          </TabsContent>

          <TabsContent value="analytics" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <WhatsappDateRange />
            </div>
            <WhatsappDeliveryChart stats={stats} />
            <div className="grid grid-cols-1 gap-4 @5xl/main:grid-cols-2">
              <WhatsappTemplateTable stats={stats} />
              <WhatsappErrorTable stats={stats} />
            </div>
          </TabsContent>

          <TabsContent value="billing" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <WhatsappDateRange />
            </div>
            {/* Mounted lazily: the Graph call is rate-limited upstream, so it
                should not fire for readers who never open this tab. */}
            <WhatsappBillingPanel enabled={tab === "billing"} />
          </TabsContent>

          <TabsContent value="queue">
            {/* Same reasoning, plus this one polls every 10s while visible. */}
            <WhatsappQueuePanel enabled={tab === "queue"} />
          </TabsContent>
        </Tabs>
      </div>

      <WhatsappMessageDetailSheet
        message={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
