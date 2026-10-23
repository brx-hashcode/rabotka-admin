import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconBuilding, IconCamera, IconLoader2, IconZoomIn } from "@tabler/icons-react";

import {
  getBusinessCatalog,
  type AdminBusinessDetail,
  type AdminUpdateBusinessParams,
} from "#/lib/api/profiles-controller";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Separator } from "#/components/ui/separator";
import { Textarea } from "#/components/ui/textarea";
import { GeoCombobox } from "#/components/geo-combobox";
import { useCities, useCountries } from "#/hooks/use-geo";
import type { ViewerDocument } from "./document-viewer-drawer";

type FormData = {
  name: string;
  category: string;
  legalForm: string;
  size: string;
  registrationNumber: string;
  taxId: string;
  statisticalId: string;
  email: string;
  phone: string;
  countryCode: string;
  city: string;
  address: string;
  website: string;
  description: string;
};

/** Fields the API refuses empty: never sent as null. */
const REQUIRED: (keyof FormData)[] = ["name", "category", "address", "countryCode"];

function toForm(b: AdminBusinessDetail): FormData {
  return {
    name: b.name,
    category: b.category,
    legalForm: b.legalForm ?? "",
    size: b.size ?? "",
    registrationNumber: b.registrationNumber ?? "",
    taxId: b.taxId ?? "",
    statisticalId: b.statisticalId ?? "",
    email: b.email ?? "",
    phone: b.phone ?? "",
    countryCode: b.countryCode ?? "",
    city: b.city ?? "",
    address: b.address,
    website: b.website ?? "",
    description: b.description ?? "",
  };
}

/** As profile-form.tsx: the small uppercase label above each field. */
function FieldLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {children}
    </label>
  );
}

/**
 * The organisation's details, edited in place like the General tab's profile
 * form: Save sends only what changed, and an emptied optional field is sent
 * as null. An admin's correction reopens no review (the business's own edits
 * to its name, type or numbers do).
 */
export function BusinessInfoForm({
  business,
  onSave,
  isSaving,
  readOnly = false,
  logoUrl,
  onLogoChange,
  isUploadingLogo,
  onPreviewDoc,
}: Readonly<{
  business: AdminBusinessDetail;
  onSave: (data: AdminUpdateBusinessParams) => Promise<unknown>;
  isSaving: boolean;
  readOnly?: boolean;
  logoUrl: string | null;
  onLogoChange: (file: File) => Promise<unknown>;
  isUploadingLogo: boolean;
  onPreviewDoc: (doc: ViewerDocument) => void;
}>) {
  const logoInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormData>(() => toForm(business));
  const [initial, setInitial] = useState<FormData>(form);

  useEffect(() => {
    const next = toForm(business);
    setForm(next);
    setInitial(next);
  }, [business]);

  const catalog = useQuery({
    queryKey: ["business-catalog"],
    queryFn: getBusinessCatalog,
    staleTime: Infinity,
  });
  const countries = useCountries();
  const cities = useCities(form.countryCode || null);

  const category = catalog.data?.categories.find((c) => c.value === form.category);
  const legalForms = (catalog.data?.legalForms ?? []).filter((f) =>
    category ? category.legalForms.includes(f.value) : true,
  );

  const isDirty = (Object.keys(form) as (keyof FormData)[]).some((k) => form[k] !== initial[k]);
  const missingRequired = REQUIRED.some((k) => !form[k].trim());

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // A type that no longer takes the chosen legal form clears it, as the API would.
  const changeCategory = (value: string) => {
    const next = catalog.data?.categories.find((c) => c.value === value);
    setForm((prev) => ({
      ...prev,
      category: value,
      legalForm: next && prev.legalForm && !next.legalForms.includes(prev.legalForm) ? "" : prev.legalForm,
    }));
  };

  // Changing the country always clears the city (see profile-form.tsx).
  const changeCountry = (code: string | null) =>
    setForm((prev) => ({ ...prev, countryCode: code ?? "", city: "" }));

  async function save() {
    const changed: Record<string, string | null> = {};
    for (const key of Object.keys(form) as (keyof FormData)[]) {
      if (form[key] === initial[key]) continue;
      const value = form[key].trim();
      changed[key] = value || (REQUIRED.includes(key) ? value : null);
    }
    if (Object.keys(changed).length === 0) return;
    await onSave(changed as AdminUpdateBusinessParams);
  }

  const text = (field: keyof FormData, label: string, span: string, props?: React.ComponentProps<typeof Input>) => (
    <div className={`space-y-1.5 ${span}`}>
      <FieldLabel>{label}</FieldLabel>
      <Input
        value={form[field]}
        onChange={(e) => update(field, e.target.value)}
        disabled={readOnly}
        placeholder={readOnly ? "—" : undefined}
        {...props}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase">Business Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="mb-6 flex items-center gap-4">
          {/* As the General tab's avatar: click to enlarge, the badge to change. */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() =>
                logoUrl &&
                onPreviewDoc({ url: logoUrl, title: business.name, description: "Logo", fileType: "image" })
              }
              disabled={!logoUrl}
              aria-label={logoUrl ? `View the logo of ${business.name}` : undefined}
              className="group relative block rounded-full enabled:cursor-zoom-in"
            >
              <Avatar className="border-border size-20 border-4 shadow-md">
                {logoUrl ? <AvatarImage src={logoUrl} alt={business.name} className="object-cover" /> : null}
                <AvatarFallback>
                  <IconBuilding className="text-muted-foreground size-8" />
                </AvatarFallback>
              </Avatar>
              {logoUrl && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <IconZoomIn className="size-6 text-white" />
                </span>
              )}
            </button>
            {!readOnly && (
              <>
                <button
                  type="button"
                  onClick={() => logoInput.current?.click()}
                  disabled={isUploadingLogo}
                  aria-label="Change logo"
                  className="bg-background border-border absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border shadow-md transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploadingLogo ? <IconLoader2 className="size-4 animate-spin" /> : <IconCamera className="size-4" />}
                </button>
                <input
                  ref={logoInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void onLogoChange(file);
                  }}
                />
              </>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{business.name}</p>
            <p className="text-muted-foreground truncate text-sm">
              {business.categoryLabel}
              {business.legalFormLabel ? ` · ${business.legalFormLabel}` : ""}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {[business.email, business.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <Separator className="mb-6" />

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-6">
          {text("name", "Raison sociale", "sm:col-span-6")}

          <div className="space-y-1.5 sm:col-span-3">
            <FieldLabel>Type</FieldLabel>
            <GeoCombobox
              options={(catalog.data?.categories ?? []).map((c) => ({ value: c.value, label: c.label }))}
              value={form.category || null}
              onChange={(v) => v && changeCategory(v)}
              placeholder={business.categoryLabel}
              searchPlaceholder="Search types…"
              disabled={readOnly || !catalog.data}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <FieldLabel>Legal form</FieldLabel>
            <GeoCombobox
              options={legalForms}
              value={form.legalForm || null}
              onChange={(v) => update("legalForm", v ?? "")}
              placeholder="—"
              searchPlaceholder="Search legal forms…"
              disabled={readOnly || !catalog.data}
            />
          </div>

          {text("registrationNumber", "RCCM", "sm:col-span-2")}
          {text("taxId", "NIU", "sm:col-span-2")}
          {text("statisticalId", "SCIEN / SCIET", "sm:col-span-2")}
          {text("email", "Contact email", "sm:col-span-3", { type: "email" })}
          {text("phone", "Contact phone", "sm:col-span-3", { type: "tel" })}

          <div className="space-y-1.5 sm:col-span-2">
            <FieldLabel>Country</FieldLabel>
            <GeoCombobox
              options={(countries.data ?? []).map((c) => ({ value: c.code, label: c.name }))}
              value={form.countryCode || null}
              onChange={changeCountry}
              placeholder={business.countryName ?? "Select a country"}
              searchPlaceholder="Search countries…"
              disabled={readOnly || countries.isPending}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <FieldLabel>City</FieldLabel>
            <GeoCombobox
              options={(cities.data ?? []).map((name) => ({ value: name, label: name }))}
              value={form.city || null}
              onChange={(city) => update("city", city ?? "")}
              placeholder={form.countryCode ? "Select a city" : "Select a country first"}
              searchPlaceholder="Search cities…"
              disabled={readOnly || !form.countryCode || cities.isPending}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <FieldLabel>Headcount</FieldLabel>
            <GeoCombobox
              options={(catalog.data?.sizes ?? []).map((size) => ({ value: size, label: `${size} employees` }))}
              value={form.size || null}
              onChange={(v) => update("size", v ?? "")}
              placeholder="—"
              searchPlaceholder="Search…"
              disabled={readOnly || !catalog.data}
            />
          </div>

          {text("address", "Address", "sm:col-span-6")}
          {text("website", "Website", "sm:col-span-6", { type: "url", placeholder: "https://" })}
          <div className="space-y-1.5 sm:col-span-6">
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              disabled={readOnly}
              className="min-h-[80px] resize-none"
              rows={5}
            />
          </div>
        </div>

        {!readOnly && (
          <div className="flex justify-end gap-2">
            {isDirty && (
              <Button variant="outline" onClick={() => setForm(initial)} disabled={isSaving}>
                Cancel
              </Button>
            )}
            <Button onClick={() => void save()} disabled={!isDirty || missingRequired || isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
