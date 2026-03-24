import * as React from "react";
import {
  IconAlertTriangle,
  IconBriefcase,
  IconDatabase,
  IconFileText,
  IconFileWord,
  IconHelp,
  IconReport,
  IconSettings,
  IconUser,
  IconUsers,
  IconLayoutGrid,
  type Icon,
  IconFile,
  IconWallet,
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
import type { AdminRole } from "#/lib/api/auth-controller";

type NavItem = { title: string; url: string; icon: Icon; roles?: AdminRole[] };

const navMain: NavItem[] = [
  { title: "Dashboard", url: "/", icon: IconLayoutGrid },
  { title: "Candidates", url: "/profiles", icon: IconUser },
  { title: "Jobs", url: "/jobs", icon: IconBriefcase },
  { title: "Applications", url: "/applications", icon: IconFileText },
  { title: "Compliance", url: "/penalties", icon: IconAlertTriangle },
  {
    title: "Team",
    url: "/team",
    icon: IconUsers,
    roles: ["SUPER_ADMIN"],
  },
];

const navSecondary: NavItem[] = [
  {
    title: "Settings",
    url: "/settings",
    icon: IconSettings,
    roles: ["SUPER_ADMIN"],
  },
  { title: "Help", url: "/help", icon: IconHelp },
];

const documents = [
  { name: "Events", url: "/events", icon: IconDatabase },
  { name: "Claim", url: "/claim", icon: IconReport },
  { name: "Logs", url: "/logs", icon: IconFileWord },
  { name: "Documents", url: "/documents", icon: IconFile },
  { name: "Wallets", url: "/wallet", icon: IconWallet },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: admin } = useAdminMe();

  const user = {
    name: admin
      ? `${admin.firstName} ${admin.lastName}`.trim() || "Admin"
      : "Admin",
    email: admin?.email ?? "",
  };

  const role = admin?.role;

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
                <span className="text-base font-semibold">Rabotka</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={documents} />
        <NavSecondary items={filteredNavSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
