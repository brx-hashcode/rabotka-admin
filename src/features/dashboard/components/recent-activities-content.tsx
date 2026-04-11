import { IconArrowRight } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { parseAsStringEnum, useQueryState } from "nuqs";

import { Label } from "#/components/ui/label";
import { Tabs, TabsContent } from "#/components/ui/tabs";
import {
  ACTIVE_RECENT_ACTIVITIES_TABS,
  DEFAULT_RECENT_ACTIVITIES_TAB,
  RECENT_ACTIVITIES_TABS,
  RecentActivitiesTabs,
  type RecentActivitiesTab,
} from "./recent-activities-tabs";
import { RecentProfilesTable } from "./recent-profiles-table";
import { RecentJobsTable } from "./recent-jobs-table";
import { RecentApplicationsTable } from "./recent-applications-table";

const SEE_MORE_HREF_BY_TAB: Record<RecentActivitiesTab, string> = {
  "recent-profiles": "/profiles",
  "recent-jobs": "/jobs",
  "recent-applications": "/applications",
};

export const RecentActivitiesContent = () => {
  const [activeTab, setActiveTab] = useQueryState(
    "selected-recent-activity-tab",
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
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={SEE_MORE_HREF_BY_TAB[tabValue]}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium transition-colors"
          >
            See more
            <IconArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
      <TabsContent value={DEFAULT_RECENT_ACTIVITIES_TAB}>
        <RecentProfilesTable />
      </TabsContent>
      <TabsContent value={ACTIVE_RECENT_ACTIVITIES_TABS[1]}>
        <RecentJobsTable />
      </TabsContent>
      <TabsContent value={ACTIVE_RECENT_ACTIVITIES_TABS[2]}>
        <RecentApplicationsTable />
      </TabsContent>
    </Tabs>
  );
};
