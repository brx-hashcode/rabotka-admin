import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";
import {
  getNotificationHref,
  NOTIFICATION_ENTITY_LABELS,
} from "#/features/notifications/utils";
import {
  useSocketStore,
  type AdminNotificationPayload,
} from "#/stores/use-socket-store";

const ENTITY_COLORS: Record<string, string> = {
  profile: "bg-blue-500",
  "job-offer": "bg-emerald-500",
  application: "bg-violet-500",
  claim: "bg-amber-500",
  event: "bg-pink-500",
  payment: "bg-green-500",
  penalty: "bg-red-500",
  conversation: "bg-orange-500",
  agent: "bg-violet-600",
  "agent-withdrawal": "bg-teal-500",
};

function timeAgo(timestamp: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(timestamp).getTime()) / 1000,
  );
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { notifications, unreadCount, markAllRead, clearNotifications } =
    useSocketStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleToggle = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) markAllRead();
  };

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 cursor-pointer"
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <Bell className="size-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          ref={panelRef}
          className="fixed inset-x-2 top-14 z-50 rounded-xl border bg-popover text-popover-foreground shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px]"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => clearNotifications()}
              >
                Tout effacer
              </Button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                <Bell className="size-8 opacity-40" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notif, i) => (
                  <NotificationItem
                    key={`${notif.timestamp}-${i}`}
                    notification={notif}
                    onClick={() => {
                      const href = getNotificationHref(notif.entityType, notif.entityId);
                      if (href) navigate({ to: href });
                      setIsOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onClick,
}: Readonly<{ notification: AdminNotificationPayload; onClick?: () => void }>) {
  const label =
    NOTIFICATION_ENTITY_LABELS[notification.entityType] ?? notification.entityType;
  const dotColor = ENTITY_COLORS[notification.entityType] ?? "bg-gray-500";

  return (
    <button
      type="button"
      className={cn(
        "flex w-full gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors",
        onClick ? "cursor-pointer" : "cursor-default",
      )}
      onClick={onClick}
    >
      <div className="mt-1 shrink-0">
        <span className={cn("block h-2.5 w-2.5 rounded-full", dotColor)} />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm font-medium leading-snug">{notification.title}</p>
        <p className="text-xs text-muted-foreground leading-snug truncate">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {timeAgo(notification.timestamp)}
          </span>
        </div>
      </div>
    </button>
  );
}
