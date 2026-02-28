import * as React from "react";
import {
  IconBriefcase,
  IconDashboard,
  IconDatabase,
  IconFileText,
  IconFileWord,
  IconHelp,
  IconReport,
  IconSettings,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";

import rabotkaLogo from "#/assets/rabotka-logo.png";

import { NavDocuments } from "#/features/dashboard/components/nav-documents";
import { NavMain } from "#/features/dashboard/components/nav-main";
import { NavSecondary } from "#/features/dashboard/components/nav-secondary";
import { NavUser } from "#/features/dashboard/components/nav-user";
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

const data = {
  user: {
    name: "Rabotka",
    email: "admin@rabotka",
    avatar: rabotkaLogo,
  },
  navMain: [
    { title: "Dashboard", url: "/", icon: IconDashboard },
    { title: "Profiles", url: "/profiles", icon: IconUser },
    { title: "Jobs", url: "/jobs", icon: IconBriefcase },
    { title: "Applications", url: "/applications", icon: IconFileText },
    { title: "Team", url: "/team", icon: IconUsers },
  ],
  navSecondary: [
    { title: "Settings", url: "#", icon: IconSettings },
    { title: "Get Help", url: "#", icon: IconHelp },
  ],
  documents: [
    { name: "Data Library", url: "#", icon: IconDatabase },
    { name: "Reports", url: "#", icon: IconReport },
    { name: "Word Assistant", url: "#", icon: IconFileWord },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
