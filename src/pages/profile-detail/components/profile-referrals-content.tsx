import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { IconGift, IconUsers } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Skeleton } from "#/components/ui/skeleton";
import { getReferrals } from "#/lib/api/referral-controller";
import type { AdminReferralItem } from "#/lib/api/referral-controller";
import {
  getReferralStatusBadgeClass,
  REFERRAL_STATUS_LABELS,
} from "#/lib/status-labels";

type Props = {
  profileId: string;
};

function formatAmount(v: number | null) {
  return v === null ? "—" : `${v.toLocaleString("fr-FR")} FCFA`;
}

function formatDate(v: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return v;
  }
}

function ReferralRow({
  referral,
  /** Which side of the relationship the *other* profile is on. */
  counterpart,
}: Readonly<{ referral: AdminReferralItem; counterpart: "referrer" | "referee" }>) {
  const party = referral[counterpart];
  const amount =
    counterpart === "referee" ? referral.referrerAmount : referral.refereeAmount;

  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <Link
          to="/profiles/$profileId"
          params={{ profileId: party.profileId }}
          className="text-sm font-medium hover:underline"
        >
          {party.firstName} {party.lastName}
        </Link>
        <p className="text-muted-foreground text-xs">
          {formatDate(referral.createdAt)} · code {referral.codeUsed}
        </p>
        {referral.settlementNote && (
          <p className="text-muted-foreground mt-1 max-w-md text-xs">
            {referral.settlementNote}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <Badge
          className={`text-xs ${getReferralStatusBadgeClass(referral.status)}`}
        >
          {REFERRAL_STATUS_LABELS[referral.status] ?? referral.status}
        </Badge>
        <p className="text-muted-foreground mt-1 text-xs">
          {formatAmount(amount)}
        </p>
      </div>
    </li>
  );
}

/**
 * Both directions of this profile's parrainages: who brought them in, and
 * everyone they brought in.
 *
 * Both, in one place, because that pairing is the actual question an admin
 * opens this tab with — a profile that was referred by someone and has since
 * referred ten people who all paid the minimum is a pattern neither list shows
 * on its own.
 */
export function ProfileReferralsContent({ profileId }: Readonly<Props>) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "profiles", profileId, "referrals"],
    // Limit rather than paginate: this is a detail pane, and a profile with
    // more than 100 parrainages is a case for the dedicated page and its
    // filters, not for an endless list inside a tab.
    queryFn: () => getReferrals({ profileId, limit: 100 }),
  });

  const all = data?.data ?? [];
  const receivedFrom = all.filter((r) => r.referee.profileId === profileId);
  const made = all.filter((r) => r.referrer.profileId === profileId);

  const totalEarned = made
    .filter((r) => r.status === "REWARDED")
    .reduce((sum, r) => sum + (r.referrerAmount ?? 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    // "Referrals made" leads: it is the list that grows and the one an admin
    // actually scans. "Referred by" is a single fact and reads as a caption to
    // it, so it sits second.
    //
    // items-start, not the default stretch: "Referred by" holds at most one row
    // — a profile is referred once — so matching it to the height of a list
    // that grows without bound leaves a tall empty box.
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">
            Referrals made
            {made.length > 0 && (
              <span className="text-muted-foreground ml-2 font-normal">
                {made.length} · {totalEarned.toLocaleString("fr-FR")} FCFA earned
              </span>
            )}
          </CardTitle>
          <IconUsers className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          {made.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              This profile has not referred anyone yet.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {made.map((r) => (
                <ReferralRow key={r.id} referral={r} counterpart="referee" />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Referred by</CardTitle>
          <IconGift className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          {receivedFrom.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              This profile signed up without a parrainage code.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {receivedFrom.map((r) => (
                <ReferralRow key={r.id} referral={r} counterpart="referrer" />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
