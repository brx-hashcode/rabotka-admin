import type { AdminProfileDetailResponse } from "#/lib/api/profiles-controller";
import {
  getAccountStatusLabel,
  getVerificationStatusLabel,
  getReferralStatusBadgeClass,
  PENALTY_PAYMENT_STATUS_LABELS,
  REFERRAL_STATUS_LABELS,
} from "#/lib/status-labels";

import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

import { formatDate, formatDateTime } from "../helpers";
import {
  getStatusBadgeClass,
  getVerificationStatusBadgeClass,
} from "#/features/applications/components/profile-columns";
import { Link } from "@tanstack/react-router";

type Props = {
  profile: AdminProfileDetailResponse;
};

/**
 * One label/value line.
 *
 * The pane used to give every single fact a card of its own — seven boxes of
 * identical weight for seven one-line values, which left a hole whenever the
 * count was odd and made a status badge look no more important than an
 * indexing timestamp. Grouping by meaning and laying the facts out as rows
 * says the same thing in a third of the chrome, and a conditional row now
 * grows one card instead of reflowing a grid.
 */
function Row({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-muted-foreground shrink-0">{label}</div>
      <div className="text-right font-medium">{children}</div>
    </div>
  );
}

export function ProfileGeneralSummary({ profile }: Readonly<Props>) {
  const location =
    [profile.city, profile.countryName].filter(Boolean).join(", ") || "—";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <Row label="Account">
              <Badge className={getStatusBadgeClass(profile.status)}>
                {getAccountStatusLabel(profile.status)}
              </Badge>
            </Row>
            <Row label="KYC">
              <Badge
                className={getVerificationStatusBadgeClass(
                  profile.verificationStatus,
                )}
              >
                {getVerificationStatusLabel(profile.verificationStatus)}
              </Badge>
            </Row>

            {/* Only while the account is actually suspended — the backend
                clears the reason on reactivation, so a lingering block would
                mean a stale motive sitting next to an active account. Full
                width rather than a right-aligned row: an admin types free text
                here and it does not fit in a value column. */}
            {profile.suspensionReason && (
              <div className="bg-muted/50 rounded-lg px-3 py-2">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Suspension Reason
                </p>
                <p className="mt-1 font-medium">{profile.suspensionReason}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Suspended {formatDateTime(profile.suspendedAt)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <Row label="Member since">{formatDate(profile.createdAt)}</Row>

            {/* Who brought this person in, and whether that parrainage ever
                paid. The status matters as much as the name: "referred by X"
                with nothing paid is the shape of both an honest pending
                referral and a farm, and the badge is what separates them. */}
            <Row label="Referred by">
              {profile.referredBy ? (
                <span className="flex flex-col items-end gap-1">
                  <Link
                    to="/profiles/$profileId"
                    params={{ profileId: profile.referredBy.profileId }}
                    className="hover:underline"
                  >
                    {profile.referredBy.firstName} {profile.referredBy.lastName}
                  </Link>
                  <span className="flex items-center gap-2">
                    <Badge
                      className={getReferralStatusBadgeClass(
                        profile.referredBy.status,
                      )}
                    >
                      {REFERRAL_STATUS_LABELS[profile.referredBy.status]}
                    </Badge>
                    <span className="text-muted-foreground font-mono text-xs font-normal">
                      {profile.referredBy.code}
                    </span>
                  </span>
                  {profile.referredBy.settlementNote && (
                    <span className="text-muted-foreground max-w-[16rem] text-xs font-normal">
                      {profile.referredBy.settlementNote}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground font-normal">—</span>
              )}
            </Row>

            {profile.referralsMadeCount > 0 && (
              <Row label="Referrals made">{profile.referralsMadeCount}</Row>
            )}

            {/* With the time, and never both a dash and an explanation: "an
                hour ago" and "at 3am" are different answers to whether the
                account is still in use, and a profile that has never signed in
                should say so rather than show an em dash. */}
            {/* "Never signed in" on its own reads as a dead account, which for
                someone who activated and then used the bot is simply wrong — so
                when there is no login the activation date answers the real
                question, which is whether anyone was ever here. */}
            <Row label="Last login">
              {profile.lastLoginAt ? (
                formatDateTime(profile.lastLoginAt)
              ) : (
                <span className="text-muted-foreground font-normal">
                  {profile.activatedAt
                    ? `Activated ${formatDate(profile.activatedAt)}`
                    : "Never signed in"}
                </span>
              )}
            </Row>

            {/* City and country read together, and the street address is the
                detail under them rather than a fact of its own. */}
            <Row label="Location">
              {location}
              {profile.address && (
                <span className="text-muted-foreground block text-xs font-normal">
                  {profile.address}
                </span>
              )}
            </Row>

            <Row label="Indexed">
              <span className="flex items-center justify-end gap-2">
                <Badge
                  className={
                    profile.vectorIndexedAt
                      ? "bg-green-600 text-white border-transparent hover:bg-green-700"
                      : "bg-amber-500 text-white border-transparent hover:bg-amber-600"
                  }
                >
                  {profile.vectorIndexedAt ? "Indexed" : "Not Indexed"}
                </Badge>
                {profile.vectorIndexedAt && (
                  <span className="text-muted-foreground text-xs font-normal">
                    {formatDate(profile.vectorIndexedAt)}
                  </span>
                )}
              </span>
            </Row>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-4">
            {/* Reliability is a metric, not a date — it belongs with the counts
                rather than between "member since" and "indexed". */}
            <Row label="Reliability">
              {profile.reliabilityScore != null
                ? `${profile.reliabilityScore}/100`
                : "—"}
            </Row>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                <Link to="/jobs" className="hover:underline">
                  Job Offers
                </Link>
              </p>
              <p className="text-right font-medium">{profile.jobOffersCount}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                <Link to="/applications" className="hover:underline">
                  Applications
                </Link>
              </p>
              <p className="text-right font-medium">
                {profile.applicationsCount}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                <Link
                  to="/penalties"
                  search={{
                    payment_status: [],
                  }}
                  className="hover:underline"
                >
                  Penalties
                </Link>
              </p>
              <p className="text-right font-medium">{profile.penaltiesCount}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                <Link
                  to="/penalties"
                  search={{
                    payment_status: [PENALTY_PAYMENT_STATUS_LABELS.unpaid],
                  }}
                  className="hover:underline"
                >
                  Unpaid Penalties
                </Link>
              </p>
              <p className="text-right font-medium text-red-600">
                {profile.unpaidPenaltiesCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
