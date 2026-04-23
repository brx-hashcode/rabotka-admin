import { useEffect, useState } from "react";
import { DirectMessagesButton } from "#/features/direct-messages-button";
import { NetworkStatusIndicator } from "#/features/network-status-indicator";
import { NotificationBell } from "#/features/notification-bell";
import { Separator } from "#/components/ui/separator";
import { ThemeToggle } from "#/components/theme-toggle";
import { SidebarTrigger } from "#/components/ui/sidebar";

function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="flex flex-col items-center leading-tight">
      <span className="text-xs text-muted-foreground">{date}</span>
      <span className="text-sm font-semibold tabular-nums">{time}</span>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium uppercase">
          Because everyone deserves a job ⛑️
        </h1>
        <div className="absolute left-1/2 -translate-x-1/2">
          <LiveClock />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <NetworkStatusIndicator />
          <DirectMessagesButton />
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
