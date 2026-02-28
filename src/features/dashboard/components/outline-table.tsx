import { IconDotsVertical } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useMemo } from "react";
import { z } from "zod";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  DataTable as ReusableDataTable,
  getCommonColumns,
} from "#/components/table";
import { Tabs, TabsContent } from "#/components/ui/tabs";
import {
  ACTIVE_RECENT_ACTIVITIES_TABS,
  DEFAULT_RECENT_ACTIVITIES_TAB,
  RECENT_ACTIVITIES_TABS,
  RecentActivitiesTabs,
  type RecentActivitiesTab,
} from "./recent-activities-tabs";

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
});

type OutlineRow = z.infer<typeof schema>;

const OutlineRowActions = ({ row }: Readonly<{ row: OutlineRow }>) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
          size="icon"
          aria-label={`Actions for ${row.header}`}
        >
          <IconDotsVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Make a copy</DropdownMenuItem>
        <DropdownMenuItem>Favorite</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const outlineColumns: ColumnDef<OutlineRow, unknown>[] = [
  {
    accessorKey: "header",
    header: "Header",
    cell: ({ row }) => row.original.header,
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Section Type",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.type}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <div> {row.original.status} </div>,
  },
  {
    accessorKey: "target",
    header: "Target",
    cell: ({ row }) => <div>{row.original.target}</div>,
  },
  {
    accessorKey: "limit",
    header: "Limit",
    cell: ({ row }) => <div>{row.original.limit}</div>,
  },
  {
    accessorKey: "reviewer",
    header: "Reviewer",
    cell: ({ row }) => {
      const isAssigned = row.original.reviewer !== "Assign reviewer";

      if (isAssigned) {
        return row.original.reviewer;
      }

      return (
        <>
          <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
            Reviewer
          </Label>
          <Select>
            <SelectTrigger
              className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              id={`${row.original.id}-reviewer`}
            >
              <SelectValue placeholder="Assign reviewer" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
              <SelectItem value="Jamik Tashpulatov">
                Jamik Tashpulatov
              </SelectItem>
            </SelectContent>
          </Select>
        </>
      );
    },
  },
];

const createOutlineColumns = (): ColumnDef<OutlineRow, unknown>[] => {
  return getCommonColumns<OutlineRow>({
    additionalColumns: outlineColumns,
    columnsActions: OutlineRowActions,
  });
};

export const DataTable = ({
  data,
}: Readonly<{
  data: z.infer<typeof schema>[];
}>) => {
  const [activeTab, setActiveTab] = useQueryState(
    "recentActivitiesTab",
    parseAsStringEnum<RecentActivitiesTab>(
      RECENT_ACTIVITIES_TABS.map((tab) => tab.value),
    ).withDefault(DEFAULT_RECENT_ACTIVITIES_TAB),
  );

  const tabValue = activeTab ?? DEFAULT_RECENT_ACTIVITIES_TAB;

  return (
    <Tabs
      value={tabValue}
      onValueChange={(value) => setActiveTab(value as RecentActivitiesTab)}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <RecentActivitiesTabs />
        <div className="flex items-center gap-2" />
      </div>
      <TabsContent
        value={DEFAULT_RECENT_ACTIVITIES_TAB}
        className="relative flex flex-col gap-4 overflow-auto"
      >
        <ReusableDataTable
          data={data}
          columns={useMemo(() => createOutlineColumns(), [])}
          isLoading={false}
          isPaginated={false}
          getRowId={(row) => row.id.toString()}
          enableRowSelection
        />
      </TabsContent>
      <TabsContent
        value={ACTIVE_RECENT_ACTIVITIES_TABS[1]}
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value={ACTIVE_RECENT_ACTIVITIES_TABS[2]}
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  );
};
