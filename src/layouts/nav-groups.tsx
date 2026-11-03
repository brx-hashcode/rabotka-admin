import { useCallback, useState } from "react";
import {
  IconChevronDown,
  IconDots,
  IconEyeOff,
  IconFolder,
  IconRefresh,
  IconShare3,
} from "@tabler/icons-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
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
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "#/components/ui/sidebar";
import { useHiddenDocuments } from "#/hooks/use-hidden-documents";
import { cn } from "#/lib/utils";
import type { NavItem } from "./app-sidebar";

export type NavGroup = {
  /** No label: the group sits on top, always open (Dashboard, chat). */
  label?: string;
  items: NavItem[];
};

const COLLAPSED_KEY = "sidebar:collapsed-groups";

function readCollapsed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/**
 * The sidebar as labelled groups. Each group folds (remembered per browser),
 * except that the group holding the current page always shows. Any item can
 * be opened, shared or hidden from its « … » menu; hidden ones come back with
 * the reset button at the top.
 */
export function NavGroups({ groups }: Readonly<{ groups: NavGroup[] }>) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isVisible, hide, reset, hasHidden } = useHiddenDocuments();
  const [collapsed, setCollapsed] = useState<string[]>(readCollapsed);

  const isActive = useCallback(
    (url: string) =>
      pathname === url || (url !== "/" && pathname.startsWith(url)),
    [pathname],
  );

  const toggle = (label: string) =>
    setCollapsed((prev) => {
      const next = prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label];
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
      } catch {
        // Private mode: the fold lasts this visit only.
      }
      return next;
    });

  return (
    <>
      {hasHidden ? (
        <div className="px-4 pt-1">
          <button
            type="button"
            onClick={reset}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground inline-flex items-center gap-1.5 text-xs"
          >
            <IconRefresh className="size-3.5" />
            Show hidden pages
          </button>
        </div>
      ) : null}
      {groups.map((group) => {
        const items = group.items.filter((i) => isVisible(i.title));
        if (items.length === 0) return null;
        const holdsActive = items.some((i) => isActive(i.url));
        const open =
          !group.label || holdsActive || !collapsed.includes(group.label);
        return (
          <SidebarGroup key={group.label ?? "top"} className="py-1">
            {group.label ? (
              <SidebarGroupLabel asChild>
                <button
                  type="button"
                  onClick={() => group.label && toggle(group.label)}
                  aria-expanded={open}
                  disabled={holdsActive}
                  className="hover:text-sidebar-foreground w-full justify-between uppercase tracking-wider disabled:cursor-default"
                >
                  {group.label}
                  {holdsActive ? null : (
                    <IconChevronDown
                      className={cn(
                        "transition-transform duration-200",
                        !open && "-rotate-90",
                      )}
                    />
                  )}
                </button>
              </SidebarGroupLabel>
            ) : null}
            {open ? (
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <NavLink
                      key={item.url}
                      item={item}
                      active={isActive(item.url)}
                      onHide={() => hide(item.title)}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            ) : null}
          </SidebarGroup>
        );
      })}
    </>
  );
}

function NavLink({
  item,
  active,
  onHide,
}: Readonly<{ item: NavItem; active: boolean; onHide: () => void }>) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();

  const share = () => {
    navigator.clipboard
      .writeText(`${globalThis.location.origin}${item.url}`)
      .catch(() => null);
    toast.success("Link copied to clipboard");
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.title}
        isActive={active}
        className="text-white data-[active=true]:text-white"
      >
        <Link to={item.url}>
          <item.icon />
          <span>{item.title}</span>
          {item.badge != null && item.badge > 0 ? (
            <span className="bg-primary text-primary-foreground ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          ) : null}
        </Link>
      </SidebarMenuButton>
      {item.url === "/" ? null : (
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
            <DropdownMenuItem onSelect={share}>
              <IconShare3 />
              <span>Share</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onHide}>
              <IconEyeOff />
              <span>Hide</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SidebarMenuItem>
  );
}
