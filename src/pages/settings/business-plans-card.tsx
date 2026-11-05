import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { IconStack2 } from "@tabler/icons-react";

import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { listBusinessPlans } from "#/lib/api/business-plans-controller";
import { BUSINESS_PLANS_KEY } from "#/hooks/use-business-plans-list";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Switch } from "#/components/ui/switch";
import { Separator } from "#/components/ui/separator";
import { GeoCombobox } from "#/components/geo-combobox";

type FormState = {
  "business.trial_days": string;
  "business.trial_plan_code": string;
  "business.trial_cv_analysis": string;
  "business.trial_cv_chat": string;
  "business.trial_offer_writer": string;
  "business.renewal_reminder_days": string;
  "business.offer_expiry_reminder_days": string;
};

const EMPTY: FormState = {
  "business.trial_days": "",
  "business.trial_plan_code": "",
  "business.trial_cv_analysis": "false",
  "business.trial_cv_chat": "false",
  "business.trial_offer_writer": "false",
  "business.renewal_reminder_days": "",
  "business.offer_expiry_reminder_days": "",
};

/** The AI features a trial may include; each is off unless switched on. */
const TRIAL_AI: { key: keyof FormState; label: string; hint: string }[] = [
  { key: "business.trial_cv_analysis", label: "CV analysis", hint: "Scoring CVs (« CV inclus »)" },
  { key: "business.trial_cv_chat", label: "CV questions & compare", hint: "« Interroger le CV » and « Comparer »" },
  { key: "business.trial_offer_writer", label: "AI offer writer", hint: "« Rédiger avec l'IA »" },
];

function FieldLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{children}</label>
  );
}

/**
 * The business trial and renewal reminders (SystemConfig `business.*`). The
 * plans themselves — prices, quotas — are edited on the Business plans page.
 */
export function BusinessPlansCard() {
  const { configs, isLoading, saveChanges, isSaving } = useSystemConfigCategory("FEES");
  const { data: plans } = useQuery({ queryKey: BUSINESS_PLANS_KEY, queryFn: listBusinessPlans });
  const [form, setForm] = useState<FormState>(EMPTY);
  const [initial, setInitial] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (configs.length === 0) return;
    const data = { ...EMPTY };
    for (const item of configs) {
      if (item.key in data) (data as Record<string, string>)[item.key] = item.value;
    }
    setForm(data);
    setInitial(data);
  }, [configs]);

  const isDirty = (Object.keys(form) as (keyof FormState)[]).some((k) => form[k] !== initial[k]);
  const set = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSave() {
    await saveChanges(form);
    setInitial(form);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <IconStack2 className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Business plans</CardTitle>
            <p className="text-muted-foreground text-xs">
              Trial and renewal reminders. Prices and quotas:{" "}
              <Link to="/business-plans" className="underline underline-offset-2">
                Business plans
              </Link>
              .
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!isDirty || isSaving || isLoading}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </CardHeader>

      <Separator />

      <CardContent>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 pt-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel>Free trial (days)</FieldLabel>
            <Input
              type="number"
              min={0}
              value={form["business.trial_days"]}
              onChange={(e) => set("business.trial_days", e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Offered when a business is approved (the admin may untick it). 0: no trial.
            </p>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Plan given during the trial</FieldLabel>
            <GeoCombobox
              // A custom plan is one business's: never the trial of every other.
              options={(plans ?? [])
                .filter((p) => !p.businessId)
                .map((p) => ({ value: p.code, label: `${p.name} (${p.code})` }))}
              value={form["business.trial_plan_code"] || null}
              onChange={(v) => set("business.trial_plan_code", v ?? "")}
              placeholder="No trial plan"
              searchPlaceholder="Search plans…"
            />
            <p className="text-muted-foreground text-xs">
              Its quotas and features apply during the trial, except the AI features below left off.
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <FieldLabel>AI during the trial</FieldLabel>
            <div className="grid gap-2 sm:grid-cols-3">
              {TRIAL_AI.map((f) => (
                <label key={f.key} className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-3">
                  <span>
                    <span className="block text-sm font-medium">{f.label}</span>
                    <span className="text-muted-foreground block text-xs">{f.hint}</span>
                  </span>
                  <Switch
                    checked={form[f.key] === "true"}
                    onCheckedChange={(on) => set(f.key, on ? "true" : "false")}
                  />
                </label>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              Off: the business sees the feature locked until it takes a paid plan. A paid period always gets its
              plan&apos;s AI.
            </p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <FieldLabel>Renewal reminders (days before the end)</FieldLabel>
            <Input
              value={form["business.renewal_reminder_days"]}
              onChange={(e) => set("business.renewal_reminder_days", e.target.value)}
              placeholder="7,1"
            />
            <p className="text-muted-foreground text-xs">
              Comma-separated. Sent by email and in-app, never WhatsApp.
            </p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <FieldLabel>Offer ending reminder (days before the end)</FieldLabel>
            <Input
              type="number"
              min={0}
              value={form["business.offer_expiry_reminder_days"]}
              onChange={(e) => set("business.offer_expiry_reminder_days", e.target.value)}
              placeholder="3"
            />
            <p className="text-muted-foreground text-xs">
              Sent by email and in-app, never WhatsApp. 0 turns it off.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
