import { IconMessage, type Icon } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "#/components/ui/sidebar";

export const NavMain = ({
  items,
}: Readonly<{
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}>) => {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-9 w-full justify-start gap-2 px-3 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMessage className="size-4" />
              <span>Direct messages</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
