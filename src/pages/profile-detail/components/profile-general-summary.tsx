import type { AdminProfileDetailResponse } from "#/lib/api/profiles-controller";
import {
  getAccountStatusLabel,
  getVerificationStatusLabel,
} from "#/lib/status-labels";

import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

import { statusBadgeVariant, formatDate } from "../helpers";

type Props = {
  profile: AdminProfileDetailResponse;
};

export function ProfileGeneralSummary({ profile }: Props) {
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
              variant={statusBadgeVariant(profile.status)}
              className="mt-1"
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
              variant={statusBadgeVariant(profile.verificationStatus)}
              className="mt-1"
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
      </div>

      {/* Activity stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <p className="text-muted-foreground">Job Offers</p>
            <p className="text-right font-medium">{profile.jobOffersCount}</p>
            <p className="text-muted-foreground">Applications</p>
            <p className="text-right font-medium">
              {profile.applicationsCount}
            </p>
            <p className="text-muted-foreground">Penalties</p>
            <p className="text-right font-medium">{profile.penaltiesCount}</p>
            <p className="text-muted-foreground">Unpaid Penalties</p>
            <p className="text-right font-medium text-red-600">
              {profile.unpaidPenaltiesCount}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
