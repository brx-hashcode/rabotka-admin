import { useState, useEffect } from "react";

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
    categoryId: "",
    address: "",
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
    if (form.categoryId !== initialForm.categoryId)
      params.categoryId = form.categoryId || null;
    if (form.address !== initialForm.address) params.address = form.address;
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

          <div className="space-y-1.5">
            <FieldLabel>Category</FieldLabel>
            <Select
              value={form.categoryId}
              onValueChange={(v) => updateField("categoryId", v)}
              disabled={disabled || categoriesQuery.isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesQuery.data?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Address</FieldLabel>
            <Input
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              disabled={disabled}
            />
          </div>

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
