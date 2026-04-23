import {
  IconDots,
  IconEyeOff,
  IconFolder,
  IconRefresh,
  IconShare3,
} from "@tabler/icons-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "#/components/ui/sidebar";
import { useHiddenDocuments } from "#/hooks/use-hidden-documents";
import type { NavItem } from "./app-sidebar";

export const NavDocuments = ({
  items,
}: Readonly<{
  items: ReadonlyArray<NavItem>;
}>) => {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { isVisible, hide, reset, hasHidden } = useHiddenDocuments();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActiveLink = useCallback(
    (url: string) =>
      pathname === url || (url !== "/" && pathname.startsWith(url)),
    [pathname],
  );

  const visibleItems = items.filter((item) => isVisible(item.title));

  const handleShare = (url: string) => {
    const full = `${globalThis.location.origin}${url}`;

    navigator.clipboard.writeText(full).catch(() => null);
    toast.success("Link copied to clipboard");
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between pr-2">
        <SidebarGroupLabel>Data & Monitoring</SidebarGroupLabel>
        {hasHidden && (
          <button
            onClick={reset}
            className="cursor-pointer hover:text-foreground"
          >
            <IconRefresh className="size-4" />
          </button>
        )}
      </div>
      <SidebarMenu>
        {visibleItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActiveLink(item.url)}>
              <Link to={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="data-[state=open]:bg-accent rounded-sm"
                >
                  <IconDots />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-24 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem onSelect={() => navigate({ to: item.url })}>
                  <IconFolder />
                  <span>Open</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleShare(item.url)}>
                  <IconShare3 />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => hide(item.title)}
                >
                  <IconEyeOff />
                  <span>Hide</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};
