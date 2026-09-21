import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { GeoCombobox } from "#/components/geo-combobox";
import { useCities, useCountries } from "#/hooks/use-geo";
import {
  listJobCategories,
  type AdminJobCategory,
} from "#/lib/api/job-categories-controller";
import {
  ACCOUNT_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
} from "#/lib/status-labels";
import type { AudienceFilters } from "#/lib/api/broadcasts-controller";

const PROFILE_TYPES = [
  { value: "WORKER", label: "Workers" },
  { value: "EMPLOYER", label: "Employers" },
] as const;

const ACCOUNT_STATUSES = ["ACTIVE", "PENDING_ACTIVATION", "SUSPENDED"];
const VERIFICATION_STATUSES = ["VERIFIED", "PENDING", "REJECTED"];

/**
 * "Still around" presets.
 *
 * Deliberately a short list rather than a number input: the useful question is
 * "recent, lapsed, or everyone", and an admin typing 37 is choosing noise.
 */
const ACTIVITY_PRESETS = [
  { value: "any", label: "Any time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

type Props = {
  value: AudienceFilters;
  onChange: (next: AudienceFilters) => void;
  disabled?: boolean;
};

/**
 * Picks who a broadcast reaches.
 *
 * Every control narrows the audience, and leaving one alone means "no opinion"
 * rather than "none" — so an untouched builder is every active profile that has
 * not opted out. That default is stated in the summary beside it rather than
 * implied, because it is also the most expensive audience in the product.
 */
export function AudienceBuilder({ value, onChange, disabled }: Props) {
  const { data: countries } = useCountries();
  const [country, setCountry] = useState<string | null>(
    value.country_codes?.[0] ?? null,
  );
  const { data: cities } = useCities(country);

  const { data: categories } = useQuery<AdminJobCategory[]>({
    queryKey: ["admin", "job-categories"],
    queryFn: listJobCategories,
    staleTime: Number.POSITIVE_INFINITY,
  });

  // Cities belong to a country, so dropping the country has to drop them too —
  // otherwise the filter keeps narrowing by a city the admin can no longer see.
  useEffect(() => {
    if (!country && value.cities?.length) {
      onChange({ ...value, cities: undefined });
    }
  }, [country, value, onChange]);

  const patch = (next: Partial<AudienceFilters>) =>
    onChange({ ...value, ...next });

  const toggleInArray = (
    key: "profile_types" | "statuses" | "verification_statuses" | "category_ids",
    entry: string,
  ) => {
    const current = (value[key] as string[] | undefined) ?? [];
    const next = current.includes(entry)
      ? current.filter((v) => v !== entry)
      : [...current, entry];
    patch({ [key]: next.length ? next : undefined } as Partial<AudienceFilters>);
  };

  return (
    <div className="space-y-5">
      <fieldset className="space-y-2" disabled={disabled}>
        <Label>Audience</Label>
        <div className="bg-muted/40 space-y-2 rounded-lg p-3">
          {PROFILE_TYPES.map((type) => (
            <label
              key={type.value}
              className="flex items-center gap-2 text-sm"
              htmlFor={`type-${type.value}`}
            >
              <Checkbox
                id={`type-${type.value}`}
                checked={
                  value.profile_types?.includes(type.value) ?? false
                }
                onCheckedChange={() =>
                  toggleInArray("profile_types", type.value)
                }
              />
              {type.label}
            </label>
          ))}
          <p className="text-muted-foreground text-xs">
            Neither ticked means both.
          </p>
        </div>
      </fieldset>

      <fieldset className="space-y-2" disabled={disabled}>
        <Label>Account status</Label>
        <div className="bg-muted/40 space-y-2 rounded-lg p-3">
          {ACCOUNT_STATUSES.map((status) => (
            <label
              key={status}
              className="flex items-center gap-2 text-sm"
              htmlFor={`status-${status}`}
            >
              <Checkbox
                id={`status-${status}`}
                checked={value.statuses?.includes(status) ?? false}
                onCheckedChange={() => toggleInArray("statuses", status)}
              />
              {ACCOUNT_STATUS_LABELS[status] ?? status}
            </label>
          ))}
          <p className="text-muted-foreground text-xs">
            None ticked means active accounts only.
          </p>
        </div>
      </fieldset>

      <fieldset className="space-y-2" disabled={disabled}>
        <Label>Identity check</Label>
        <div className="bg-muted/40 space-y-2 rounded-lg p-3">
          {VERIFICATION_STATUSES.map((status) => (
            <label
              key={status}
              className="flex items-center gap-2 text-sm"
              htmlFor={`kyc-${status}`}
            >
              <Checkbox
                id={`kyc-${status}`}
                checked={
                  value.verification_statuses?.includes(status) ?? false
                }
                onCheckedChange={() =>
                  toggleInArray("verification_statuses", status)
                }
              />
              {VERIFICATION_STATUS_LABELS[status] ?? status}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Country</Label>
          <GeoCombobox
            options={(countries ?? []).map((c) => ({
              value: c.code,
              label: c.name,
            }))}
            value={country ?? ""}
            onChange={(code) => {
              setCountry(code || null);
              patch({ country_codes: code ? [code] : undefined });
            }}
            placeholder="Any country"
            searchPlaceholder="Search a country…"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label>City</Label>
          <GeoCombobox
            options={(cities ?? []).map((c) => ({ value: c, label: c }))}
            value={value.cities?.[0] ?? ""}
            onChange={(city) =>
              patch({ cities: city ? [city] : undefined })
            }
            placeholder={country ? "Any city" : "Pick a country first"}
            searchPlaceholder="Search a city…"
            disabled={disabled || !country}
          />
        </div>
      </div>

      <fieldset className="space-y-2" disabled={disabled}>
        <Label>Trade</Label>
        <div className="bg-muted/40 max-h-44 space-y-2 overflow-y-auto rounded-lg p-3">
          {(categories ?? []).map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-2 text-sm"
              htmlFor={`cat-${category.id}`}
            >
              <Checkbox
                id={`cat-${category.id}`}
                checked={value.category_ids?.includes(category.id) ?? false}
                onCheckedChange={() =>
                  toggleInArray("category_ids", category.id)
                }
              />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="activity">Signed in</Label>
          <Select
            disabled={disabled}
            value={
              value.active_within_days ? String(value.active_within_days) : "any"
            }
            onValueChange={(next) =>
              patch({
                active_within_days:
                  next === "any" ? undefined : Number.parseInt(next, 10),
              })
            }
          >
            <SelectTrigger id="activity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="created-from">Signed up after</Label>
          <Input
            id="created-from"
            type="date"
            disabled={disabled}
            value={value.created_from?.slice(0, 10) ?? ""}
            onChange={(e) =>
              patch({
                created_from: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              })
            }
          />
        </div>
      </div>

      <fieldset className="space-y-2" disabled={disabled}>
        <Label>Reachability</Label>
        <div className="bg-muted/40 space-y-2 rounded-lg p-3">
          <label
            className="flex items-center gap-2 text-sm"
            htmlFor="wa-connected"
          >
            <Checkbox
              id="wa-connected"
              checked={value.whatsapp_connected ?? false}
              onCheckedChange={(checked) =>
                patch({ whatsapp_connected: checked ? true : undefined })
              }
            />
            WhatsApp connected only
          </label>
          <label className="flex items-center gap-2 text-sm" htmlFor="has-email">
            <Checkbox
              id="has-email"
              checked={value.has_email ?? false}
              onCheckedChange={(checked) =>
                patch({ has_email: checked ? true : undefined })
              }
            />
            Has an email address
          </label>
          <p className="text-muted-foreground text-xs">
            These narrow the audience itself. A channel someone cannot receive
            is simply skipped, so you rarely need them.
          </p>
        </div>
      </fieldset>
    </div>
  );
}
