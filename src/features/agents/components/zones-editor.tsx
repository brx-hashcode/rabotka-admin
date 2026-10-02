import { useMemo } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { IconPlus, IconTrash } from "@tabler/icons-react";

import { GeoCombobox } from "#/components/geo-combobox";
import { Button } from "#/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "#/components/ui/form";
import { useCities, useCountries } from "#/hooks/use-geo";
import type { AgentZone } from "#/lib/api/agents-controller";
import { emptyZone } from "../agent-rules";

type ZonesFormValues = { zones: AgentZone[] };

type Props = {
  readonly disabled?: boolean;
  readonly portalContainer?: HTMLElement | null;
};


export function ZonesEditor({ disabled, portalContainer }: Props) {
  const { control, formState } = useFormContext<ZonesFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "zones" });

  const listError =
    formState.errors.zones?.root?.message ?? formState.errors.zones?.message;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Zones</h3>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append(emptyZone())}
          disabled={disabled}
        >
          <IconPlus className="size-4" />
          Add a city
        </Button>
      </div>

      {fields.map((field, index) => (
        <ZoneRow
          key={field.id}
          index={index}
          onRemove={() => remove(index)}
          canRemove={fields.length > 1}
          disabled={disabled}
          portalContainer={portalContainer}
        />
      ))}

      {listError && <p className="text-destructive text-sm">{listError}</p>}

    </div>
  );
}

function ZoneRow({
  index,
  onRemove,
  canRemove,
  disabled,
  portalContainer,
}: Readonly<{
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
  portalContainer?: HTMLElement | null;
}>) {
  const { control, setValue } = useFormContext<ZonesFormValues>();
  const country = useWatch({ control, name: `zones.${index}.countryCode` });
  const countries = useCountries();
  const cities = useCities(country || null);

  const countryOptions = useMemo(
    () => (countries.data ?? []).map((c) => ({ value: c.code, label: c.name })),
    [countries.data],
  );
  const cityOptions = useMemo(
    () => (cities.data ?? []).map((c) => ({ value: c, label: c })),
    [cities.data],
  );

  return (
    <div className="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
      <FormField
        control={control}
        name={`zones.${index}.countryCode`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormControl>
              <GeoCombobox
                options={countryOptions}
                value={field.value || null}
                onChange={(value) => {
                  field.onChange(value ?? "");
                  // A city belongs to its country; keep none rather than a
                  // city that is not in the new one.
                  setValue(`zones.${index}.city`, "", { shouldDirty: true });
                }}
                placeholder="Country"
                searchPlaceholder="Search a country…"
                disabled={disabled}
                container={portalContainer}
                invalid={fieldState.invalid}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`zones.${index}.city`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormControl>
              <GeoCombobox
                options={cityOptions}
                value={field.value || null}
                onChange={(value) => field.onChange(value ?? "")}
                placeholder={country ? "City" : "Choose a country first"}
                searchPlaceholder="Search a city…"
                disabled={disabled || !country}
                container={portalContainer}
                invalid={fieldState.invalid}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive h-9"
        onClick={onRemove}
        disabled={disabled || !canRemove}
        aria-label="Remove this city"
      >
        <IconTrash className="size-4" />
      </Button>
    </div>
  );
}
