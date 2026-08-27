import type { Table as TableInstance } from "@tanstack/react-table";
import { parseAsString, useQueryState } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import {
  IconUsers,
  IconGift,
  IconClock,
  IconBan,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import { DateRangePicker } from "#/components/ui/date-range-picker";
import { referralColumns } from "#/features/referral/components/referral-columns";
import { useReferrals } from "#/hooks/use-referrals";
import { getReferralStats } from "#/lib/api/referral-controller";
import type { AdminReferralItem } from "#/lib/api/referral-controller";
import { REFERRAL_STATUS_LABELS } from "#/lib/status-labels";

const STATUS_OPTIONS = Object.entries(REFERRAL_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

function StatCard({
  title,
  icon: Icon,
  isLoading,
  children,
}: Readonly<{
  title: string;
  icon: React.ElementType;
  isLoading: boolean;
  children: React.ReactNode;
}>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-8 w-24" /> : children}
      </CardContent>
    </Card>
  );
}

function ReferralStats() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "referrals", "stats"],
    queryFn: getReferralStats,
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total referrals" icon={IconUsers} isLoading={isLoading}>
        <p className="text-2xl font-bold">{data?.total ?? 0}</p>
        <p className="text-muted-foreground text-xs">
          {data?.pending ?? 0} pending
        </p>
      </StatCard>

      <StatCard title="Rewarded" icon={IconGift} isLoading={isLoading}>
        <p className="text-2xl font-bold">{data?.rewarded ?? 0}</p>
        <p className="text-muted-foreground text-xs">
          {(data?.totalPaidOutFcfa ?? 0).toLocaleString("fr-FR")} FCFA paid out
        </p>
      </StatCard>

      {/* On hold is the number worth watching: every one of these is a parrain
          stuck in the KYC queue, and they settle the moment that clears. */}
      <StatCard title="On hold" icon={IconClock} isLoading={isLoading}>
        <p className="text-2xl font-bold">{data?.onHold ?? 0}</p>
        <p className="text-muted-foreground text-xs">awaiting referrer KYC</p>
      </StatCard>

      <StatCard title="Not paid" icon={IconBan} isLoading={isLoading}>
        <p className="text-2xl font-bold">
          {(data?.capped ?? 0) + (data?.forfeited ?? 0)}
        </p>
        <p className="text-muted-foreground text-xs">
          {data?.capped ?? 0} capped · {data?.forfeited ?? 0} forfeited
        </p>
      </StatCard>
    </div>
  );
}

function ReferralsTableHeader({
  table,
}: Readonly<{ table: TableInstance<AdminReferralItem> }>) {
  const [createdFrom, setCreatedFrom] = useQueryState(
    "created_from",
    parseAsString.withDefault(""),
  );
  const [createdTo, setCreatedTo] = useQueryState(
    "created_to",
    parseAsString.withDefault(""),
  );

  return (
    <TableHeader>
      <TableHeaderToolbar
        searchPlaceholder="Search by name, phone or code..."
        filters={[
          { id: "ref_status", label: "Status", options: STATUS_OPTIONS },
        ]}
        table={table}
      >
        <DateRangePicker
          from={createdFrom}
          to={createdTo}
          onFromChange={setCreatedFrom}
          onToChange={setCreatedTo}
        />
      </TableHeaderToolbar>
    </TableHeader>
  );
}

const renderReferralsTableHeader = (
  table: TableInstance<AdminReferralItem>,
) => <ReferralsTableHeader table={table} />;

export default function ReferralsPage() {
  const { data, total, isLoading } = useReferrals();

  return (
    // pt-6 to clear the breadcrumb, matching wallet.tsx and penalties.tsx —
    // the Layout does not pad its own content, so a page without it sits flush
    // against the header.
    <div className="flex flex-col gap-6 pt-6">
      <PageListHeader
        title="Parrainage"
        description="Referrals, their payout state and the reason when nothing was paid."
      />
      <ReferralStats />
      <DataTable
        isPaginated
        data={data}
        columns={referralColumns}
        header={renderReferralsTableHeader}
        totalCount={total}
        isLoading={isLoading}
        getRowId={(row) => row.id}
      />
    </div>
  );
}
