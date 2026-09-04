import { useState, useEffect, useRef } from "react";
import { IconUser, IconCamera, IconLoader2 } from "@tabler/icons-react";

import type {
  AdminProfileDetailResponse,
  AdminUpdateProfileParams,
} from "#/lib/api/profiles-controller";

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
import { GeoCombobox } from "#/components/geo-combobox";
import { useCities, useCountries } from "#/hooks/use-geo";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  directPhone: string;
  address: string;
  countryCode: string;
  countryName: string;
  city: string;
  description: string;
  profileType: string;
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
  /**
   * Receives ONLY the fields that actually changed, not the whole form.
   *
   * The activity timeline renders one chip per key in the update payload, so
   * sending everything made every save read as "City, Email, Phone, Address,
   * Lastname, Firstname, …" no matter what was touched. It also rewrote every
   * column and re-ran the geocode and Qdrant re-index on each save.
   */
  onSave: (data: AdminUpdateProfileParams) => Promise<void>;
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
    directPhone: "",
    address: "",
    countryCode: "",
    countryName: "",
    city: "",
    description: "",
    profileType: "",
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
      directPhone: profile.directPhone ?? "",
      address: profile.address ?? "",
      countryCode: profile.countryCode ?? "",
      countryName: profile.countryName ?? "",
      city: profile.city ?? "",
      description: profile.description ?? "",
      profileType: profile.profileType ?? "",
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

  const countries = useCountries();
  const cities = useCities(form.countryCode || null);

  const countryOptions = (countries.data ?? []).map((c) => ({
    value: c.code,
    label: c.name,
  }));
  const cityOptions = (cities.data ?? []).map((name) => ({
    value: name,
    label: name,
  }));

  /**
   * Changing the country ALWAYS clears the city. A city held over from the
   * previous country is stored against a country it does not belong to —
   * invisible here, and wrong in every filter that later groups by city.
   */
  const handleCountryChange = (code: string | null) => {
    const country = countries.data?.find((c) => c.code === code);
    setForm((prev) => ({
      ...prev,
      countryCode: country?.code ?? "",
      countryName: country?.name ?? "",
      city: "",
    }));
  };

  const handleSave = async () => {
    // Same comparison `isDirty` uses, so what gets sent and what enables the
    // button can never disagree.
    const changed = (Object.keys(form) as (keyof FormData)[]).reduce<
      AdminUpdateProfileParams
    >((acc, key) => {
      if (form[key] !== initialForm[key]) acc[key] = form[key];
      return acc;
    }, {});

    if (Object.keys(changed).length === 0) return;

    await onSave(changed);
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

        {/* Six columns so each logical row divides evenly: the two names at 3
            apiece, the three ways to reach someone at 2, then country and city
            back at 3. A 2-column grid could not do that — it pushed Direct
            phone onto the same line as Country, splitting one idea across two
            rows and stranding the other. */}
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-6">
          <div className="space-y-1.5 sm:col-span-3">
            <FieldLabel>First Name</FieldLabel>
            <Input
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <FieldLabel>Last Name</FieldLabel>
            <Input
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <FieldLabel>WhatsApp phone</FieldLabel>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <FieldLabel>Direct phone</FieldLabel>
            <Input
              type="tel"
              value={form.directPhone}
              onChange={(e) => updateField("directPhone", e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <FieldLabel>Country</FieldLabel>
            <GeoCombobox
              options={countryOptions}
              value={form.countryCode || null}
              onChange={handleCountryChange}
              placeholder="Select a country"
              searchPlaceholder="Search countries…"
              disabled={readOnly || countries.isPending}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <FieldLabel>City</FieldLabel>
            <GeoCombobox
              options={cityOptions}
              value={form.city || null}
              onChange={(city) => updateField("city", city ?? "")}
              placeholder={
                form.countryCode ? "Select a city" : "Select a country first"
              }
              searchPlaceholder="Search cities…"
              disabled={readOnly || !form.countryCode || cities.isPending}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-6">
            <FieldLabel>Address</FieldLabel>
            <Input
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-6">
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
            <Select
              value={form.profileType}
              onValueChange={(v) => updateField("profileType", v)}
              disabled={readOnly}
            >
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
