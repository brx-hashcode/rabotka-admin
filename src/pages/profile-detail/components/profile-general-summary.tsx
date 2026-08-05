import type { AdminProfileDetailResponse } from "#/lib/api/profiles-controller";
import {
  getAccountStatusLabel,
  getVerificationStatusLabel,
  PENALTY_PAYMENT_STATUS_LABELS,
} from "#/lib/status-labels";

import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

import { formatDate } from "../helpers";
import {
  getStatusBadgeClass,
  getVerificationStatusBadgeClass,
} from "#/features/applications/components/profile-columns";
import { Link } from "@tanstack/react-router";

type Props = {
  profile: AdminProfileDetailResponse;
};

export function ProfileGeneralSummary({ profile }: Readonly<Props>) {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Account Status
            </p>
            <Badge
              className={`mt-1 ${getStatusBadgeClass(profile.status)}`}
            >
              {getAccountStatusLabel(profile.status)}
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              KYC Status
            </p>
            <Badge
              className={`mt-1 ${getVerificationStatusBadgeClass(profile.verificationStatus)}`}
            >
              {getVerificationStatusLabel(profile.verificationStatus)}
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Member Since
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatDate(profile.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Reliability
            </p>
            <p className="mt-1 text-sm font-medium">
              {profile.reliabilityScore != null
                ? `${profile.reliabilityScore}/100`
                : "\u2014"}
            </p>
          </CardContent>
        </Card>

        {/* One card, not two: city and country are read together, and a profile
            predating the country backfill would otherwise show an empty card. */}
        <Card className="col-span-2 gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Location
            </p>
            <p className="mt-1 text-sm font-medium">
              {[profile.city, profile.countryName].filter(Boolean).join(", ") ||
                "—"}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {profile.address}
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-2 gap-2 py-4">
          <CardContent className="px-4 flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Indexed
            </p>
            <div className="flex items-center gap-2">
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
                <span className="text-muted-foreground text-xs">
                  {formatDate(profile.vectorIndexedAt)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-4">
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
