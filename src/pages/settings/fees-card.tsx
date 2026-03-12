import { useState, useEffect } from "react";
import { IconCoin } from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";

type FormState = {
  "fees.late_cancellation_penalty_fcfa": string;
  "fees.late_cancellation_score_deduction": string;
  "fees.cancellation_threshold_hours": string;
  "fees.reliability_score_min": string;
  "fees.employer_cancel_score_deduction": string;
  "fees.employer_ghost_score_deduction": string;
  "fees.billing_block_threshold": string;
  "fees.job_posting_fee_fcfa": string;
  "fees.application_fee_fcfa": string;
};

const EMPTY: FormState = {
  "fees.late_cancellation_penalty_fcfa": "",
  "fees.late_cancellation_score_deduction": "",
  "fees.cancellation_threshold_hours": "",
  "fees.reliability_score_min": "",
  "fees.employer_cancel_score_deduction": "",
  "fees.employer_ghost_score_deduction": "",
  "fees.billing_block_threshold": "",
  "fees.job_posting_fee_fcfa": "",
  "fees.application_fee_fcfa": "",
};

function FieldLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {children}
    </label>
  );
}

function NumericInput({
  value,
  onChange,
  placeholder,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <div className="relative flex items-center">
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={suffix ? "pr-14" : undefined}
      />
      {suffix && (
        <span className="text-muted-foreground pointer-events-none absolute right-3 text-xs font-medium">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function FeesCard() {
  const { configs, isLoading, saveChanges, isSaving } =
    useSystemConfigCategory("FEES");

  const [form, setForm] = useState<FormState>(EMPTY);
  const [initial, setInitial] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (configs.length === 0) return;
    const data = { ...EMPTY };
    for (const item of configs) {
      if (item.key in data) {
        (data as Record<string, string>)[item.key] = item.value;
      }
    }
    setForm(data);
    setInitial(data);
  }, [configs]);

  const isDirty = (Object.keys(form) as (keyof FormState)[]).some(
    (k) => form[k] !== initial[k],
  );

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    await saveChanges(form);
    setInitial(form);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <IconCoin className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Frais & pénalités
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Montants, déductions de score et seuils de blocage
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || isSaving || isLoading}
        >
          {isSaving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">
        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Annulation tardive (travailleur)
        </p>
        <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <FieldLabel>Pénalité financière</FieldLabel>
            <NumericInput
              value={form["fees.late_cancellation_penalty_fcfa"]}
              onChange={(v) => set("fees.late_cancellation_penalty_fcfa", v)}
              suffix="FCFA"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Déduction score fiabilité</FieldLabel>
            <NumericInput
              value={form["fees.late_cancellation_score_deduction"]}
              onChange={(v) => set("fees.late_cancellation_score_deduction", v)}
              suffix="pts"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Délai sans pénalité</FieldLabel>
            <NumericInput
              value={form["fees.cancellation_threshold_hours"]}
              onChange={(v) => set("fees.cancellation_threshold_hours", v)}
              suffix="h"
            />
          </div>
        </div>

        <Separator className="mb-6" />

        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Pénalités employeur
        </p>
        <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel>Déduction (annulation travailleur accepté)</FieldLabel>
            <NumericInput
              value={form["fees.employer_cancel_score_deduction"]}
              onChange={(v) => set("fees.employer_cancel_score_deduction", v)}
              suffix="pts"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Déduction (offre expirée ghostée)</FieldLabel>
            <NumericInput
              value={form["fees.employer_ghost_score_deduction"]}
              onChange={(v) => set("fees.employer_ghost_score_deduction", v)}
              suffix="pts"
            />
          </div>
        </div>

        <Separator className="mb-6" />

        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Seuils & frais de plateforme
        </p>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <FieldLabel>Score fiabilité minimum</FieldLabel>
            <NumericInput
              value={form["fees.reliability_score_min"]}
              onChange={(v) => set("fees.reliability_score_min", v)}
              suffix="pts"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Pénalités impayées avant blocage</FieldLabel>
            <NumericInput
              value={form["fees.billing_block_threshold"]}
              onChange={(v) => set("fees.billing_block_threshold", v)}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Frais publication offre</FieldLabel>
            <NumericInput
              value={form["fees.job_posting_fee_fcfa"]}
              onChange={(v) => set("fees.job_posting_fee_fcfa", v)}
              suffix="FCFA"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Frais de candidature</FieldLabel>
            <NumericInput
              value={form["fees.application_fee_fcfa"]}
              onChange={(v) => set("fees.application_fee_fcfa", v)}
              suffix="FCFA"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
