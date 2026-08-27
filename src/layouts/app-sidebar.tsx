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
  IconSpeakerphone,
  IconGridDots,
  IconMessage,
  IconTopologyStar3,
  IconKey,
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


const LADDER: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "MODERATOR"];

/**
 * The ladder without MODERATOR, for areas a moderator has no business in:
 * money, the WhatsApp delivery log, the audit trail and the document library.
 */
const MANAGER_UP: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

const navMain: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: IconGridDots,
    roles: [...LADDER, "FINANCE", "SUPPORT"],
  },
  {
    title: "Profiles",
    url: "/profiles",
    icon: IconUser,
    roles: [...LADDER, "FINANCE", "SUPPORT"],
  },
  {
    title: "Job Offers",
    url: "/jobs",
    icon: IconBriefcase,
    roles: [...LADDER, "FINANCE", "SUPPORT"],
  },
  {
    title: "Domains",
    url: "/job-categories",
    icon: IconTag,
    // admin/job-categories resolves to MANAGER+, and editing a domain
    // re-buckets the whole marketplace.
    roles: [...MANAGER_UP, "FINANCE"],
  },
  {
    title: "Applications",
    url: "/applications",
    icon: IconFileText,
    roles: [...LADDER, "FINANCE", "SUPPORT"],
  },
  {
    title: "Chat",
    url: "/chat",
    icon: IconMessage,
    roles: [...LADDER, "FINANCE", "SUPPORT"],
  },
  {
    title: "Penalties",
    url: "/penalties",
    icon: IconAlertTriangle,
    roles: [...LADDER, "FINANCE", "SUPPORT"],
  },
  {
    title: "Network",
    url: "/network",
    icon: IconTopologyStar3,
    // The collaboration graph is neither a finance nor a support surface.
    roles: [...LADDER, "FINANCE"],
  },
  {
    title: "Team",
    url: "/team",
    icon: IconUsers,
    // Team management is served by the `user` controller, which no lateral
    // role may reach at all — the list itself 403s, not just the mutations.
    roles: [...LADDER],
  },
];

const navSecondary: NavItem[] = [
  {
    // "Partner apps", NOT "Applications": that label is already taken by
    // `/applications`, the job applications board, and two identical entries in
    // one sidebar is a support ticket waiting to happen.
    //
    // SUPER_ADMIN-only, matching the endpoint's @Roles — registering an app
    // decides who Rabotka vouches for its users' identities to, which is the
    // same class of decision as team management, not an operational one.
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

const documents: NavItem[] = [
  {
    title: "Finance",
    url: "/wallet",
    icon: IconWallet,
    roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"],
  },
  {
    // MANAGER+, matching the endpoint's @Roles. This is support-desk data —
    // "why was my parrainage not paid?" — rather than revenue.
    title: "Parrainage",
    url: "/referrals",
    icon: IconGift,
    roles: [...MANAGER_UP, "FINANCE", "SUPPORT"],
  },
  {
    title: "Claims",
    url: "/claim",
    icon: IconReport,
    roles: [...LADDER, "FINANCE", "SUPPORT"],
  },
  {
    title: "Feedback",
    url: "/feedback",
    icon: IconStar,
    roles: [...LADDER, "FINANCE", "SUPPORT"],
  },
  {
    title: "Events",
    url: "/events",
    icon: IconCalendar,
    roles: [...LADDER, "FINANCE"],
  },
  {
    title: "WhatsApp",
    url: "/whatsapp",
    icon: IconBrandWhatsapp,
    roles: [...MANAGER_UP, "FINANCE", "SUPPORT"],
  },
  {
    title: "Logs",
    url: "/logs",
    icon: IconFileWord,
    // The audit log is every admin action on every record; MANAGER+.
    roles: [...MANAGER_UP, "FINANCE"],
  },
  {
    title: "Documents",
    url: "/documents",
    icon: IconFile,
    roles: [...MANAGER_UP, "FINANCE"],
  },
  {
    title: "Ad Bundles",
    url: "/ads-bundles",
    icon: IconPackage,
    roles: [...LADDER, "FINANCE"],
  },
  {
    title: "Advertisements",
    url: "/advertisements",
    icon: IconSpeakerphone,
    roles: [...LADDER, "FINANCE"],
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
