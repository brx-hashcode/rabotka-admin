import * as React from "react";
import {
  IconAlertTriangle,
  IconBrandWhatsapp,
  IconBriefcase,
  IconFileText,
  IconFileWord,
  IconHelp,
  IconReport,
  IconSettings,
  IconUser,
  IconUsers,
  type Icon,
  IconFile,
  IconWallet,
  IconGift,
  IconCalendar,
  IconStar,
  IconTag,
  IconPackage,
  IconBroadcast,
  IconSpeakerphone,
  IconGridDots,
  IconMessage,
  IconMessages,
  IconTopologyStar3,
  IconAddressBook,
  IconKey,
  IconUsersGroup,
  IconCashBanknote,
  IconUserX,
  IconStack2,
} from "@tabler/icons-react";
import rabotkaLogo from "#/assets/rabotka-logo.png";
import { NavGroups, type NavGroup } from "#/layouts/nav-groups";
import { NavSecondary } from "#/layouts/nav-secondary";
import { NavUser } from "#/layouts/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "#/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { useAdminMe } from "#/hooks/use-admin-me";
import { useConversations } from "#/hooks/use-chat";
import type { AdminRole } from "#/lib/api/auth-controller";
import { appConfig } from "#/config";

export type NavItem = {
  title: string;
  url: string;
  icon: Icon;
  roles?: AdminRole[];
  badge?: number;
};


const LADDER: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "MODERATOR"];


const MANAGER_UP: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

const ALL_STAFF: AdminRole[] = [...LADDER, "FINANCE", "SUPPORT"];

/**
 * The sidebar, by what an admin comes to do: hire, talk to people, grow,
 * keep things fair, follow the money, run ads, run the back office.
 */
const navGroups: NavGroup[] = [
  {
    items: [
      { title: "Dashboard", url: "/", icon: IconGridDots, roles: ALL_STAFF },
      // The admins' own chat, with its unread badge.
      { title: "Team chat", url: "/chat", icon: IconMessage, roles: ALL_STAFF },
    ],
  },
  {
    label: "Hiring",
    items: [
      { title: "Profiles", url: "/profiles", icon: IconUser, roles: ALL_STAFF },
      { title: "Job offers", url: "/jobs", icon: IconBriefcase, roles: ALL_STAFF },
      { title: "Applications", url: "/applications", icon: IconFileText, roles: ALL_STAFF },
      { title: "Paid contacts", url: "/contact-records", icon: IconAddressBook, roles: ALL_STAFF },
      { title: "Agents", url: "/agents", icon: IconUsersGroup, roles: ALL_STAFF },
      { title: "Job categories", url: "/job-categories", icon: IconTag, roles: [...MANAGER_UP, "FINANCE"] },
    ],
  },
  {
    label: "Messaging",
    items: [
      { title: "Broadcasts", url: "/broadcasts", icon: IconBroadcast, roles: [...MANAGER_UP] },
      { title: "WhatsApp", url: "/whatsapp", icon: IconBrandWhatsapp, roles: [...MANAGER_UP, "FINANCE", "SUPPORT"] },
      // Worker ↔ employer threads, for moderation.
      { title: "User conversations", url: "/conversations", icon: IconMessages, roles: [...LADDER] },
    ],
  },
  {
    label: "Growth",
    items: [
      // Sign-ups that stopped halfway, to call. Support's work as much as ours.
      { title: "Sign-up drop-offs", url: "/onboarding-dropoffs", icon: IconUserX, roles: [...LADDER, "SUPPORT"] },
      { title: "Referrals", url: "/referrals", icon: IconGift, roles: [...MANAGER_UP, "FINANCE", "SUPPORT"] },
      { title: "HR events", url: "/events", icon: IconCalendar, roles: [...LADDER, "FINANCE"] },
      { title: "Collaboration network", url: "/network", icon: IconTopologyStar3, roles: [...LADDER, "FINANCE"] },
    ],
  },
  {
    label: "Trust & support",
    items: [
      { title: "Claims", url: "/claim", icon: IconReport, roles: ALL_STAFF },
      { title: "Penalties", url: "/penalties", icon: IconAlertTriangle, roles: ALL_STAFF },
      { title: "User reviews", url: "/feedback", icon: IconStar, roles: ALL_STAFF },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Revenue & wallet", url: "/wallet", icon: IconWallet, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"] },
      { title: "Business plans", url: "/business-plans", icon: IconStack2, roles: [...MANAGER_UP, "FINANCE"] },
      { title: "Agent payouts", url: "/agent-payouts", icon: IconCashBanknote, roles: [...MANAGER_UP, "FINANCE"] },
    ],
  },
  {
    label: "Advertising",
    items: [
      { title: "Advertisements", url: "/advertisements", icon: IconSpeakerphone, roles: [...LADDER, "FINANCE"] },
      { title: "Ad bundles", url: "/ads-bundles", icon: IconPackage, roles: [...LADDER, "FINANCE"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Admin team", url: "/team", icon: IconUsers, roles: [...LADDER] },
      { title: "Activity logs", url: "/logs", icon: IconFileWord, roles: [...MANAGER_UP, "FINANCE"] },
      { title: "Legal documents", url: "/documents", icon: IconFile, roles: [...MANAGER_UP, "FINANCE"] },
    ],
  },
];

const navSecondary: NavItem[] = [
  {
    title: "Partner apps",
    url: "/oauth-apps",
    icon: IconKey,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: IconSettings,
    roles: ["SUPER_ADMIN"],
  },
  { title: "Support", url: "/help", icon: IconHelp },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: admin } = useAdminMe();

  const user = {
    name: admin
      ? `${admin.firstName} ${admin.lastName}`.trim() || "Rabotka Admin"
      : "Rabotka Admin",
    email: admin?.email ?? "",
  };

  const role = admin?.role;

  const { data: conversations } = useConversations();
  const chatUnread = (conversations ?? []).reduce(
    (sum, c) => sum + (c.unreadCount ?? 0),
    0,
  );

  const allowed = (item: NavItem) =>
    !item.roles || (role !== undefined && item.roles.includes(role));
  const visibleGroups = navGroups.map((group) => ({
    ...group,
    items: group.items
      .filter(allowed)
      .map((item) =>
        item.url === "/chat" ? { ...item, badge: chatUnread } : item,
      ),
  }));

  const filteredNavSecondary = navSecondary.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/" aria-label="Rabotka dashboard">
                <img
                  src={rabotkaLogo}
                  alt="Rabotka"
                  className="size-5 rounded-sm"
                />
                <span className="text-base font-semibold">
                  {appConfig.appName}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavGroups groups={visibleGroups} />
        <NavSecondary items={filteredNavSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
