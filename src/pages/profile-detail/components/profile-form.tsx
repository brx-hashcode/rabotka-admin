import { useState, useEffect, useRef } from "react";
import { IconUser, IconCamera, IconLoader2 } from "@tabler/icons-react";

import type { AdminProfileDetailResponse } from "#/lib/api/profiles-controller";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Separator } from "#/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "#/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  description: string;
};

function FieldLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {children}
    </label>
  );
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

type ProfileFormProps = {
  profile: AdminProfileDetailResponse;
  onSave: (data: {
    firstName: string;
    lastName: string;
    address: string;
    description: string;
    email: string;
    phone: string;
  }) => Promise<void>;
  isSaving: boolean;
  onAvatarChange?: (file: File) => Promise<unknown>;
  isUploadingAvatar?: boolean;
  readOnly?: boolean;
};

export function ProfileForm({
  profile,
  onSave,
  isSaving,
  onAvatarChange,
  isUploadingAvatar = false,
  readOnly = false,
}: Readonly<ProfileFormProps>) {
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    description: "",
  });
  const [initialForm, setInitialForm] = useState<FormData>(form);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    if (!readOnly && onAvatarChange && !isUploadingAvatar) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAvatarChange) return;
    await onAvatarChange(file);
    // Reset so the same file can be re-selected if needed
    e.target.value = "";
  };

  useEffect(() => {
    const data: FormData = {
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      description: profile.description ?? "",
    };
    setForm(data);
    setInitialForm(data);
  }, [profile]);

  const isDirty = (Object.keys(form) as (keyof FormData)[]).some(
    (k) => form[k] !== initialForm[k],
  );

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await onSave({
      firstName: form.firstName,
      lastName: form.lastName,
      address: form.address,
      description: form.description,
      email: form.email,
      phone: form.phone,
    });
    setInitialForm(form);
  };

  const initials = getInitials(profile.firstName, profile.lastName);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase">
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar className="border-border size-20 border-4 shadow-md">
              {profile.avatarUrl ? (
                <AvatarImage
                  src={profile.avatarUrl}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="text-xl">
                {initials || <IconUser className="size-8" />}
              </AvatarFallback>
            </Avatar>

            {!readOnly && onAvatarChange && (
              <>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  aria-label="Change avatar"
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 disabled:cursor-not-allowed"
                >
                  {isUploadingAvatar ? (
                    <IconLoader2 className="size-6 animate-spin text-white" />
                  ) : (
                    <IconCamera className="size-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-muted-foreground truncate text-sm">
              {profile.email}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {profile.phone}
            </p>
          </div>
        </div>

        <Separator className="mb-6" />

        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div className="space-y-1.5">
            <FieldLabel>First Name</FieldLabel>
            <Input
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Last Name</FieldLabel>
            <Input
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Phone</FieldLabel>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <FieldLabel>Address</FieldLabel>
            <Input
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="min-h-[80px] resize-none"
              rows={6}
            />
          </div>
        </div>


        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="space-y-1.5">
            <FieldLabel>Profile Type</FieldLabel>
            <Select value={profile.profileType} disabled>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WORKER">Worker</SelectItem>
                <SelectItem value="EMPLOYER">Employer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Account Status</FieldLabel>
            <Select value={profile.status} disabled>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING_ACTIVATION">
                  En attente d'activation
                </SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="BANNED">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Reliability Score</FieldLabel>
            <Input
              value={
                profile.reliabilityScore == null
                  ? "—"
                  : String(profile.reliabilityScore)
              }
              disabled
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>WhatsApp Connected</FieldLabel>
            <Input value={profile.whatsappConnected ? "Yes" : "No"} disabled />
          </div>

          {profile.categoryNames && profile.categoryNames.length > 0 && (
            <div className="col-span-2 space-y-1.5">
              <FieldLabel>Domains</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {profile.categoryNames.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center rounded-full border border-gray-200 bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex min-w-0 justify-end gap-2">
          {!readOnly && (
            <Button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="shrink-0"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
