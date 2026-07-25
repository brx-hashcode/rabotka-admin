import * as React from "react";
import {
  IconAlertTriangle,
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
  IconCalendar,
  IconTag,
  IconPackage,
  IconSpeakerphone,
  IconGridDots,
  IconMessage,
} from "@tabler/icons-react";
import rabotkaLogo from "#/assets/rabotka-logo.png";
import { NavDocuments } from "#/layouts/nav-documents";
import { NavMain } from "#/layouts/nav-main";
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

const navMain: NavItem[] = [
  { title: "Dashboard", url: "/", icon: IconGridDots },
  { title: "Profiles", url: "/profiles", icon: IconUser },
  { title: "Job Offers", url: "/jobs", icon: IconBriefcase },
  {
    title: "Domains",
    url: "/job-categories",
    icon: IconTag,
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
  { title: "Applications", url: "/applications", icon: IconFileText },
  { title: "Chat", url: "/chat", icon: IconMessage },
  { title: "Penalties", url: "/penalties", icon: IconAlertTriangle },
  {
    title: "Team",
    url: "/team",
    icon: IconUsers,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
];

const navSecondary: NavItem[] = [
  {
    title: "Settings",
    url: "/settings",
    icon: IconSettings,
    roles: ["SUPER_ADMIN"],
  },
  { title: "Support", url: "/help", icon: IconHelp },
];

const documents: NavItem[] = [
  {
    title: "Wallet",
    url: "/wallet",
    icon: IconWallet,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  { title: "Claims", url: "/claim", icon: IconReport },
  {
    title: "Events",
    url: "/events",
    icon: IconCalendar,
    roles: ["SUPER_ADMIN", "MANAGER", "MODERATOR"],
  },
  {
    title: "Logs",
    url: "/logs",
    icon: IconFileWord,
    roles: ["SUPER_ADMIN", "MANAGER", "MODERATOR"],
  },
  {
    title: "Documents",
    url: "/documents",
    icon: IconFile,
    roles: ["SUPER_ADMIN", "MANAGER", "MODERATOR"],
  },
  {
    title: "Ad Bundles",
    url: "/ads-bundles",
    icon: IconPackage,
    roles: ["SUPER_ADMIN", "MANAGER", "MODERATOR"],
  },
  {
    title: "Advertisements",
    url: "/advertisements",
    icon: IconSpeakerphone,
    roles: ["SUPER_ADMIN", "MANAGER", "MODERATOR"],
  },
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

  const filteredNavMain = navMain
    .filter((item) => !item.roles || (role && item.roles.includes(role)))
    .map((item) =>
      item.url === "/chat" ? { ...item, badge: chatUnread } : item,
    );

  const filteredDocuments = documents.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );

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
        <NavMain items={filteredNavMain} />
        <NavDocuments items={filteredDocuments} />
        <NavSecondary items={filteredNavSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
