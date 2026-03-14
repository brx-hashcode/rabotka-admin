import { TabsList, TabsTrigger } from "#/components/ui/tabs";

export type RecentActivitiesTab =
  | "recent-profiles"
  | "recent-jobs"
  | "recent-applications";

export const RECENT_ACTIVITIES_TABS: {
  label: string;
  value: RecentActivitiesTab;
}[] = [
  {
    label: "Recent profiles",
    value: "recent-profiles",
  },
  {
    label: "Recent jobs",
    value: "recent-jobs",
  },
  {
    label: "Recent applications",
    value: "recent-applications",
  },
];

export const DEFAULT_RECENT_ACTIVITIES_TAB: RecentActivitiesTab =
  "recent-profiles";

export const ACTIVE_RECENT_ACTIVITIES_TABS: RecentActivitiesTab[] =
  RECENT_ACTIVITIES_TABS.map((tab) => tab.value);

export function RecentActivitiesTabs() {
  return (
    <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
      {RECENT_ACTIVITIES_TABS.map((tab) => (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          className="cursor-pointer"
        >
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
