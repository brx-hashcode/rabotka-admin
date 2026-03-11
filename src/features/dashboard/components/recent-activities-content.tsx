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
        <div className="flex items-center gap-2" />
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
