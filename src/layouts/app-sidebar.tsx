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

type NavItem = { title: string; url: string; icon: Icon };
type NavSecondaryItem = NavItem & { roles?: AdminRole[] };

const navMain: NavItem[] = [
  { title: "Overview", url: "/", icon: IconLayoutGrid },
  { title: "Candidate profiles", url: "/profiles", icon: IconUser },
  { title: "Job listings", url: "/jobs", icon: IconBriefcase },
  { title: "Applications tracker", url: "/applications", icon: IconFileText },
  {
    title: "Violations & penalties",
    url: "/penalties",
    icon: IconAlertTriangle,
  },
  { title: "Team members", url: "/team", icon: IconUsers },
];

const navSecondary: NavSecondaryItem[] = [
  {
    title: "Settings",
    url: "/settings",
    icon: IconSettings,
    roles: ["SUPER_ADMIN"],
  },
  { title: "Support center", url: "/help", icon: IconHelp },
];

const documents = [
  { name: "Data library", url: "#", icon: IconDatabase },
  { name: "Analytics reports", url: "#", icon: IconReport },
  { name: "AI writing assistant", url: "#", icon: IconFileWord },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: admin } = useAdminMe();

  const user = {
    name: admin?.name ?? "Admin",
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
