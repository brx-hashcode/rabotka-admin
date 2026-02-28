import { type Icon } from "@tabler/icons-react";

import { Link, useRouterState } from "@tanstack/react-router";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "#/components/ui/sidebar";
import { useCallback } from "react";

export const NavMain = ({
  items,
}: Readonly<{
  items: ReadonlyArray<{
    title: string;
    url: string;
    icon?: Icon;
  }>;
}>) => {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const isActiveLink = useCallback(
    (url: string) => {
      return pathname === url || (url !== "/" && pathname.startsWith(url));
    },
    [pathname],
  );

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = isActiveLink(item.url);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className="text-white data-[active=true]:text-white"
                >
                  <Link to={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
