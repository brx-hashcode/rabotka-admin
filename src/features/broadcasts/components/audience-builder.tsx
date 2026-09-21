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
import { fold } from "#/lib/search";
import {
  getBroadcastAudienceFacets,
  type AudienceFilters,
} from "#/lib/api/broadcasts-controller";

const PROFILE_TYPES = [
  { value: "WORKER", label: "Workers" },
  { value: "EMPLOYER", label: "Employers" },
] as const;

const ACCOUNT_STATUSES = ["ACTIVE", "PENDING_ACTIVATION", "SUSPENDED"];
const VERIFICATION_STATUSES = ["VERIFIED", "PENDING", "REJECTED"];

/**
 * Does every word of the query start a word of the trade's name?
 *
 * Deliberately NOT the shared `matchesSearch`, which is a substring match: on a
 * list this short, "a" appears mid-word in almost every name — Barbier,
 * Blanchisserie, Restauration — so the first letter typed filtered nothing and
 * the search read as broken. Prefix-per-word is what someone typing "bar" or
 * "sec" actually means.
 *
 * Still accent- and case-insensitive through `fold`, because "maraichage" has
 * to find "Maraîchage", and splitting on non-letters keeps "&" and spaces from
 * hiding the second word of "Cuisine & Restauration".
 */
function matchesTrade(query: string, name: string): boolean {
  const words = fold(query).split(/[^a-z0-9]+/i).filter(Boolean);
  if (words.length === 0) return true;

  const target = fold(name).split(/[^a-z0-9]+/i).filter(Boolean);
  return words.every((word) => target.some((part) => part.startsWith(word)));
}

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

/** The same filters minus the trade one — see the facet query below. */
function withoutCategories(filters: AudienceFilters): AudienceFilters {
  const { category_ids: _ignored, ...rest } = filters;
  return rest;
}

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
  const [tradeSearch, setTradeSearch] = useState("");
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

  /**
   * How many people each trade actually reaches.
   *
   * Most profiles carry no category, so the bare taxonomy offers dozens of
   * trades that match nobody — tick one and the audience drops to zero, which
   * reads as a broken filter rather than an empty segment. The counts are
   * keyed on the OTHER filters, so they answer "who would this add" at the
   * moment of choosing.
   */
  const { data: facets } = useQuery({
    queryKey: ["admin", "broadcasts", "facets", withoutCategories(value)],
    queryFn: () => getBroadcastAudienceFacets(withoutCategories(value)),
  });

  const countFor = (categoryId: string) =>
    facets?.find((f) => f.categoryId === categoryId)?.count ?? 0;

  // Cities belong to a country, so dropping the country has to drop them too —
  // otherwise the filter keeps narrowing by a city the admin can no longer see.
  useEffect(() => {
    if (!country && value.cities?.length) {
      onChange({ ...value, cities: undefined });
    }
  }, [country, value, onChange]);

  const patch = (next: Partial<AudienceFilters>) =>
    onChange({ ...value, ...next });

  /**
   * The trades on screen.
   *
   * Filtered, but never hiding a SELECTED one: a trade scrolled out of view by
   * a search term is still part of the audience, and a checkbox that vanishes
   * while still counting is how someone sends to the wrong people.
   */
  const visibleCategories = (categories ?? [])
    .filter(
      (category) =>
        value.category_ids?.includes(category.id) ||
        matchesTrade(tradeSearch, category.name),
    )
    // Busiest first, so the trades worth sending to are the ones in view
    // without scrolling. Ties keep the alphabetical order the API returned.
    .sort((a, b) => countFor(b.id) - countFor(a.id));

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

      <fieldset className="space-y-2" disabled={disabled}>
        <Label>Location</Label>
        <div className="bg-muted/40 grid gap-3 rounded-lg p-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-1.5">
          <Label className="text-muted-foreground text-xs">Country</Label>
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

        <div className="min-w-0 space-y-1.5">
          <Label className="text-muted-foreground text-xs">City</Label>
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
      </fieldset>

      <fieldset className="space-y-2" disabled={disabled}>
        <Label htmlFor="trade-search">Trade</Label>
        <Input
          id="trade-search"
          value={tradeSearch}
          placeholder="Search a trade…"
          onChange={(e) => setTradeSearch(e.target.value)}
        />
        <div className="bg-muted/40 max-h-44 space-y-2 overflow-y-auto rounded-lg p-3">
          {visibleCategories.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              No trade matches “{tradeSearch}”.
            </p>
          ) : null}
          {visibleCategories.map((category) => (
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
              <span className="flex-1">{category.name}</span>
              {/* Dimmed at zero rather than hidden: a trade that reaches
                  nobody today is still a real trade, and hiding it would look
                  like the taxonomy had lost entries. */}
              <span
                className={`text-xs tabular-nums ${
                  countFor(category.id) === 0
                    ? "text-muted-foreground/50"
                    : "text-muted-foreground"
                }`}
              >
                {countFor(category.id)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2" disabled={disabled}>
        <Label>Activity</Label>
        <div className="bg-muted/40 grid gap-3 rounded-lg p-3 sm:grid-cols-2">
          {/* `min-w-0` on both: a grid column's default `min-width: auto` is
              its content, so a long option label would push its half wider
              than the other and the two would stop lining up. */}
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="activity" className="text-muted-foreground text-xs">
              Signed in
            </Label>
            <Select
              value={
                value.active_within_days
                  ? String(value.active_within_days)
                  : "any"
              }
              onValueChange={(next) =>
                patch({
                  active_within_days:
                    next === "any" ? undefined : Number.parseInt(next, 10),
                })
              }
            >
              {/* The trigger is `w-fit` by default, which left this control
                  sized to the word "Any time" beside a full-width date field. */}
              <SelectTrigger id="activity" className="w-full">
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

          <div className="min-w-0 space-y-1.5">
            <Label
              htmlFor="created-from"
              className="text-muted-foreground text-xs"
            >
              Signed up after
            </Label>
            <Input
              id="created-from"
              type="date"
              className="w-full"
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
      </fieldset>

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
