import { useState, useEffect } from "react";
import { Checkbox } from "#/components/ui/checkbox";
import { GeoCombobox } from "#/components/geo-combobox";
import { useCities, useCountries } from "#/hooks/use-geo";

import type {
  AdminJobOfferDetailResponse,
  AdminUpdateJobOfferParams,
} from "#/lib/api/jobs-controller";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Card, CardContent } from "#/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";

type FormData = {
  title: string;
  description: string;
  scheduledAt: string;
  amount: string;
  paymentFlow: string;
  address: string;
  /** "1" or "" — this form keeps every field a string so `isDirty` can compare. */
  isRemote: string;
  countryCode: string;
  countryName: string;
  city: string;
  note: string;
  quantity: string;
};

function FieldLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {children}
    </label>
  );
}

function toLocalDateTimeValue(isoStr: string): string {
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function applyAmountChanges(
  params: AdminUpdateJobOfferParams,
  form: { amount: string; paymentFlow: string },
  initialForm: { amount: string; paymentFlow: string },
  hasAmount: boolean,
) {
  if (form.amount !== initialForm.amount) {
    params.amount = hasAmount ? Number(form.amount) : null;
    params.paymentFlow = hasAmount ? form.paymentFlow || null : null;
    return;
  }

  if (hasAmount && form.paymentFlow !== initialForm.paymentFlow) {
    params.paymentFlow = form.paymentFlow || null;
  }
}

type Props = {
  job: AdminJobOfferDetailResponse;
  onSave: (data: AdminUpdateJobOfferParams) => Promise<void>;
  isSaving: boolean;
  disabled?: boolean;
};

export function JobForm({ job, onSave, isSaving, disabled }: Readonly<Props>) {
  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    scheduledAt: "",
    amount: "",
    paymentFlow: "",
    address: "",
    isRemote: "",
    countryCode: "",
    countryName: "",
    city: "",
    note: "",
    quantity: "",
  });
  const [initialForm, setInitialForm] = useState<FormData>(form);
  const [paymentFlowError, setPaymentFlowError] = useState(false);

  useEffect(() => {
    const data: FormData = {
      title: job.title ?? "",
      description: job.description ?? "",
      scheduledAt: toLocalDateTimeValue(job.scheduledAt),
      amount: job.amount == null ? "" : String(job.amount),
      paymentFlow: job.paymentFlow ?? "",
      address: job.address ?? "",
      isRemote: job.isRemote ? "1" : "",
      countryCode: job.countryCode ?? "",
      countryName: job.countryName ?? "",
      city: job.city ?? "",
      note: job.note ?? "",
      quantity: String(job.quantity ?? 1),
    };
    setForm(data);
    setInitialForm(data);
  }, [job]);

  const hasAmount = form.amount.trim() !== "" && Number(form.amount) > 0;

  const isDirty = (Object.keys(form) as (keyof FormData)[]).some(
    (k) => form[k] !== initialForm[k],
  );

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

  /** Changing the country always clears the city; see profile-form.tsx. */
  const handleCountryChange = (code: string | null) => {
    const country = countries.data?.find((c) => c.code === code);
    setForm((prev) => ({
      ...prev,
      countryCode: country?.code ?? "",
      countryName: country?.name ?? "",
      city: "",
    }));
  };

  const updateField = (field: keyof FormData, value: string) => {
    if (field === "amount" && (value.trim() === "" || Number(value) <= 0)) {
      setForm((prev) => ({ ...prev, amount: value, paymentFlow: "" }));
      setPaymentFlowError(false);
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    if (hasAmount && !form.paymentFlow) {
      setPaymentFlowError(true);
      return;
    }
    setPaymentFlowError(false);

    const params: AdminUpdateJobOfferParams = {};
    if (form.title !== initialForm.title) params.title = form.title;
    if (form.description !== initialForm.description)
      params.description = form.description;
    if (form.scheduledAt !== initialForm.scheduledAt)
      params.scheduledAt = new Date(form.scheduledAt).toISOString();
    const isRemote = form.isRemote === "1";
    if (form.isRemote !== initialForm.isRemote) params.isRemote = isRemote;
    // A remote job sends no location: the server clears the columns, and
    // sending a stale address alongside isRemote would only be discarded.
    if (!isRemote) {
      if (form.address !== initialForm.address) params.address = form.address;
      if (form.countryCode !== initialForm.countryCode) {
        params.countryCode = form.countryCode;
        params.countryName = form.countryName;
      }
      if (form.city !== initialForm.city) params.city = form.city;
    }
    if (form.note !== initialForm.note) params.note = form.note;
    if (form.quantity !== initialForm.quantity)
      params.quantity = Number(form.quantity);

    applyAmountChanges(params, form, initialForm, hasAmount);

    await onSave(params);
    setInitialForm(form);
  };

  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div className="col-span-2 space-y-1.5">
            <FieldLabel>Title</FieldLabel>
            <Input
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="min-h-20 resize-none"
              rows={10}
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5 col-span-2">
            <FieldLabel>Indexing</FieldLabel>
            <div className="flex items-start gap-2 rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 px-3 py-2.5">
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${job.vectorIndexedAt ? 'bg-green-500' : 'bg-muted-foreground/40'}`}
              />
              <div className="space-y-0.5">
                {job.vectorIndexedAt ? (
                  <>
                    <p className="text-xs font-medium text-foreground">
                      Indexed
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Last indexed{' '}
                      {new Date(job.vectorIndexedAt).toLocaleString()}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium text-muted-foreground">
                      Not yet indexed
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Will be indexed automatically. Category is inferred from
                      job content and employer profile.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <Checkbox
              id="job-is-remote"
              checked={form.isRemote === "1"}
              onCheckedChange={(checked) => {
                const remote = checked === true;
                setForm((prev) => ({
                  ...prev,
                  isRemote: remote ? "1" : "",
                  // Cleared, not merely hidden: an address left in state would
                  // be sent again the moment someone unticked the box.
                  ...(remote
                    ? { address: "", countryCode: "", countryName: "", city: "" }
                    : {}),
                }));
              }}
              disabled={disabled}
            />
            <label htmlFor="job-is-remote" className="cursor-pointer text-sm">
              Remote job — done from anywhere, no address
            </label>
          </div>

          {/* The whole location block disappears for a remote job: there is no
              site, so a greyed-out address field is a question with no answer. */}
          {form.isRemote !== "1" && (
            <>
              <div className="space-y-1.5">
                <FieldLabel>Country</FieldLabel>
                <GeoCombobox
                  options={countryOptions}
                  value={form.countryCode || null}
                  onChange={handleCountryChange}
                  placeholder="Select a country"
                  searchPlaceholder="Search countries…"
                  disabled={disabled || countries.isPending}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>City</FieldLabel>
                <GeoCombobox
                  options={cityOptions}
                  value={form.city || null}
                  onChange={(city) => updateField("city", city ?? "")}
                  placeholder={
                    form.countryCode ? "Select a city" : "Select a country first"
                  }
                  searchPlaceholder="Search cities…"
                  disabled={disabled || !form.countryCode || cities.isPending}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <FieldLabel>Address</FieldLabel>
                <Input
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  disabled={disabled}
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <FieldLabel>Scheduled At</FieldLabel>
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => updateField("scheduledAt", e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Quantity</FieldLabel>
            <Input
              type="number"
              value={form.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
              min={1}
              max={100}
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Amount (FCFA)</FieldLabel>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => updateField("amount", e.target.value)}
              placeholder="Leave empty if no fixed price"
              disabled={disabled}
            />
            <p className="text-[11px] text-muted-foreground">
              Leave empty if no fixed price
            </p>
          </div>

          {hasAmount ? (
            <div className="space-y-1.5">
              <FieldLabel>Payment Flow</FieldLabel>
              <Select
                value={form.paymentFlow}
                onValueChange={(v) => {
                  updateField("paymentFlow", v);
                  setPaymentFlowError(false);
                }}
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOURLY">Hourly</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
              {paymentFlowError && (
                <p className="text-[11px] text-destructive">
                  Select a payment frequency
                </p>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="col-span-2 space-y-1.5">
            <FieldLabel>Note</FieldLabel>
            <Textarea
              value={form.note}
              onChange={(e) => updateField("note", e.target.value)}
              placeholder="Optional note..."
              className="min-h-16 resize-none"
              rows={3}
              disabled={disabled}
            />
          </div>
        </div>

        {!disabled && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="shrink-0"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
