import { useState, useEffect } from "react";
import { IconUser, IconShield } from "@tabler/icons-react";

import { useAdminProfile } from "#/hooks/use-admin-profile";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Separator } from "#/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";

function FieldLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {children}
    </label>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminProfilePage() {
  const { admin, isLoading, updateAdmin, isUpdating } = useAdminProfile();

  const [name, setName] = useState("");
  const [initialName, setInitialName] = useState("");

  useEffect(() => {
    if (admin) {
      setName(admin.name ?? "");
      setInitialName(admin.name ?? "");
    }
  }, [admin]);

  const isDirty = name !== initialName;

  const handleSave = async () => {
    await updateAdmin(name);
    setInitialName(name);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (!admin) return null;

  const initials = getInitials(admin.name || "A");

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase">
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <Avatar className="border-border size-20 border-4 shadow-md">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                {initials || <IconUser className="size-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{admin.name}</p>
              <p className="text-muted-foreground truncate text-sm">
                {admin.email}
              </p>
              <Badge variant="secondary" className="mt-1 gap-1">
                <IconShield className="size-3" />
                {admin.role}
              </Badge>
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="grid grid-cols-1 gap-y-5">
            <div className="space-y-1.5">
              <FieldLabel>Display Name</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
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

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!isDirty || isUpdating}
            >
              {isUpdating ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
