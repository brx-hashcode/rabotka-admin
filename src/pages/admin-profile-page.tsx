import { useState, useEffect } from "react";
import {
  IconUser,
  IconShield,
  IconMoon,
  IconSun,
  IconBell,
} from "@tabler/icons-react";

import { toast } from "sonner";
import { useAdminProfile } from "#/hooks/use-admin-profile";
import { useTheme } from "#/components/theme-provider";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Switch } from "#/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";

function FieldLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {children}
    </label>
  );
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export default function AdminProfilePage() {
  const { admin, isLoading, updateAdmin, isUpdating } = useAdminProfile();
  const { resolvedTheme, setTheme } = useTheme();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [initialFirstName, setInitialFirstName] = useState("");
  const [initialLastName, setInitialLastName] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    // If the user has previously opted out, respect that; otherwise follow browser permission
    const stored = localStorage.getItem("browserNotificationsEnabled");
    if (stored !== null) return stored === "true";
    return (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    );
  });

  useEffect(() => {
    if (admin) {
      setFirstName(admin.firstName ?? "");
      setLastName(admin.lastName ?? "");
      setInitialFirstName(admin.firstName ?? "");
      setInitialLastName(admin.lastName ?? "");
    }
  }, [admin]);

  // Re-sync toggle if browser permission was revoked externally (e.g. from browser settings)
  useEffect(() => {
    function syncPermission() {
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "denied"
      ) {
        setNotificationsEnabled(false);
        localStorage.setItem("browserNotificationsEnabled", "false");
      }
    }
    document.addEventListener("visibilitychange", syncPermission);
    return () => document.removeEventListener("visibilitychange", syncPermission);
  }, []);

  async function handleNotificationToggle(enabled: boolean) {
    if (enabled) {
      if (typeof Notification === "undefined") {
        toast.error("Browser notifications are not supported.");
        return;
      }
      if (Notification.permission === "denied") {
        toast.error(
          "Notifications are blocked by your browser. Click the lock icon in the address bar and allow notifications, then try again.",
          { duration: 6000 },
        );
        return; // don't flip the toggle
      }
      // "default" → ask, "granted" → already allowed
      const permission =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();
      const granted = permission === "granted";
      setNotificationsEnabled(granted);
      localStorage.setItem("browserNotificationsEnabled", String(granted));
      if (!granted) {
        toast.error("Notification permission was not granted.");
      }
    } else {
      localStorage.setItem("browserNotificationsEnabled", "false");
      setNotificationsEnabled(false);
    }
  }

  const isDirty =
    firstName !== initialFirstName || lastName !== initialLastName;
  const isDarkMode = resolvedTheme === "dark";

  const handleSave = async () => {
    await updateAdmin({ firstName, lastName });
    setInitialFirstName(firstName);
    setInitialLastName(lastName);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!admin) return null;

  const initials = getInitials(admin.firstName || "A", admin.lastName || "");
  const fullName = [admin.firstName, admin.lastName].filter(Boolean).join(" ");

  return (
    <div className="grid grid-cols-1 gap-6 pt-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-8 text-center">
            <Avatar className="border-border size-24 border-4 shadow-md">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                {initials || <IconUser className="size-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{fullName}</p>
              <p className="text-muted-foreground text-sm">{admin.email}</p>
              <Badge variant="secondary" className="mt-1 gap-1">
                <IconShield className="size-3" />
                {admin.role}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase">
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabel>First Name</FieldLabel>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Last Name</FieldLabel>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Email</FieldLabel>
                <Input value={admin.email} disabled />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Role</FieldLabel>
                <Input value={admin.role} disabled />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={!isDirty || isUpdating}>
                {isUpdating ? "Saving…" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase">
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <IconMoon className="text-muted-foreground size-4" />
                ) : (
                  <IconSun className="text-muted-foreground size-4" />
                )}
                <div>
                  <p className="text-sm font-medium">Appearance</p>
                  <p className="text-muted-foreground text-xs">
                    {isDarkMode ? "Dark mode" : "Light mode"}
                  </p>
                </div>
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconBell className="text-muted-foreground size-4" />
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-muted-foreground text-xs">
                    Receive updates and alerts by email
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
