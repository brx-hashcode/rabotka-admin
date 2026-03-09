import { useState, useEffect } from "react";

import type { AdminJobOfferDetailResponse } from "#/lib/api/jobs-controller";
import type { AdminUpdateJobOfferParams } from "#/lib/api/jobs-controller";
import {
  getJobOfferStatusLabel,
  getPaymentFlowLabel,
} from "#/lib/status-labels";

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

type Props = {
  job: AdminJobOfferDetailResponse;
  onSave: (data: AdminUpdateJobOfferParams) => Promise<void>;
  isSaving: boolean;
};

export function JobForm({ job, onSave, isSaving }: Readonly<Props>) {
  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    scheduledAt: "",
    amount: "",
    paymentFlow: "",
    address: "",
    note: "",
    quantity: "",
  });
  const [initialForm, setInitialForm] = useState<FormData>(form);

  useEffect(() => {
    const data: FormData = {
      title: job.title ?? "",
      description: job.description ?? "",
      scheduledAt: toLocalDateTimeValue(job.scheduledAt),
      amount: String(job.amount ?? ""),
      paymentFlow: job.paymentFlow ?? "",
      address: job.address ?? "",
      note: job.note ?? "",
      quantity: String(job.quantity ?? 1),
    };
    setForm(data);
    setInitialForm(data);
  }, [job]);

  const isDirty = (Object.keys(form) as (keyof FormData)[]).some(
    (k) => form[k] !== initialForm[k],
  );

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const params: AdminUpdateJobOfferParams = {};
    if (form.title !== initialForm.title) params.title = form.title;
    if (form.description !== initialForm.description)
      params.description = form.description;
    if (form.scheduledAt !== initialForm.scheduledAt)
      params.scheduledAt = new Date(form.scheduledAt).toISOString();
    if (form.amount !== initialForm.amount)
      params.amount = Number(form.amount);
    if (form.paymentFlow !== initialForm.paymentFlow)
      params.paymentFlow = form.paymentFlow;
    if (form.address !== initialForm.address) params.address = form.address;
    if (form.note !== initialForm.note) params.note = form.note;
    if (form.quantity !== initialForm.quantity)
      params.quantity = Number(form.quantity);

    await onSave(params);
    setInitialForm(form);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Details</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Editable fields */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div className="col-span-2 space-y-1.5">
            <FieldLabel>Title</FieldLabel>
            <Input
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="min-h-20 resize-none"
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Scheduled At</FieldLabel>
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => updateField("scheduledAt", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Amount (FCFA)</FieldLabel>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => updateField("amount", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Address</FieldLabel>
            <Input
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
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
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <FieldLabel>Note</FieldLabel>
            <Textarea
              value={form.note}
              onChange={(e) => updateField("note", e.target.value)}
              placeholder="Optional note..."
              className="min-h-16 resize-none"
              rows={2}
            />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Read-only fields */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="space-y-1.5">
            <FieldLabel>Payment Flow</FieldLabel>
            <Select
              value={form.paymentFlow}
              onValueChange={(v) => updateField("paymentFlow", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOURLY">Hourly</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Status</FieldLabel>
            <Select value={job.status} disabled>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="FILLED">Filled</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="shrink-0"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
