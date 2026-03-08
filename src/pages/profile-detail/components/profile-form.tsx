import { useState, useEffect } from "react";

import type { AdminProfileDetailResponse } from "#/lib/api/profiles-controller";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Separator } from "#/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
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

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {children}
    </label>
  );
}

type Props = {
  profile: AdminProfileDetailResponse;
  onSave: (data: {
    firstName: string;
    lastName: string;
    address: string;
    description: string;
  }) => Promise<void>;
  isSaving: boolean;
};

export function ProfileForm({ profile, onSave, isSaving }: Props) {
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    description: "",
  });
  const [initialForm, setInitialForm] = useState<FormData>(form);

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
    });
    setInitialForm(form);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
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
              className="min-h-[80px] resize-y"
            />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Read-only fields */}
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
                <SelectItem value="PENDING_PAYMENT">Pending Payment</SelectItem>
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
                profile.reliabilityScore != null
                  ? String(profile.reliabilityScore)
                  : "—"
              }
              disabled
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>WhatsApp Connected</FieldLabel>
            <Input
              value={profile.whatsappConnected ? "Yes" : "No"}
              disabled
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={!isDirty || isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
