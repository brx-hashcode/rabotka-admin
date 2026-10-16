import { Fragment, useEffect, useState } from "react";
import { IconBrandWhatsapp } from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Switch } from "#/components/ui/switch";
import { Label } from "#/components/ui/label";
import { Button } from "#/components/ui/button";

type Toggle = {
  group: string;
  label: string;
  hint: string;
  defaultOn: boolean;
};

const ESSENTIAL: Toggle[] = [
  {
    group: "job_recommendations",
    label: "Job recommendations",
    hint: "New offers that match a worker — the job alerts.",
    defaultOn: true,
  },
  {
    group: "new_application",
    label: "New application",
    hint: "Tells the employer someone applied.",
    defaultOn: true,
  },
  {
    group: "application_accepted",
    label: "Application accepted",
    hint: "Tells the worker they were chosen.",
    defaultOn: true,
  },
  {
    group: "contact_unlocked",
    label: "Contact unlocked",
    hint: "Delivers the other party's phone and email after payment.",
    defaultOn: true,
  },
];

const OTHERS: Toggle[] = [
  {
    group: "application_rejected",
    label: "Application not selected",
    hint: "Can be many at once when an offer fills.",
    defaultOn: false,
  },
  {
    group: "cancellations",
    label: "Cancellations",
    hint: "A worker or an employer cancelled a mission.",
    defaultOn: false,
  },
  {
    group: "offer_updates",
    label: "Offer changed",
    hint: "The employer changed the date, place or pay.",
    defaultOn: false,
  },
  {
    group: "mission_reminders",
    label: "Mission reminders",
    hint: "The day before, at start, mission started, and « is it finished? ».",
    defaultOn: false,
  },
  {
    group: "offer_expired",
    label: "Offer expired",
    hint: "To the employer and every pending applicant.",
    defaultOn: false,
  },
  {
    group: "account_status",
    label: "KYC refused, account suspended",
    hint: "An email is sent either way.",
    defaultOn: false,
  },
  {
    group: "unlock_credit",
    label: "Unlock converted to credit",
    hint: "An unpaid unlock turned into wallet credit.",
    defaultOn: false,
  },
  {
    group: "claim_replies",
    label: "Claim replies",
    hint: "The team answered a support claim.",
    defaultOn: false,
  },
  {
    group: "mission_contract_pdf",
    label: "Mission contract PDF",
    hint: "Sent to both parties after an unlock. Always downloadable in the app.",
    defaultOn: false,
  },
];

const ALL = [...ESSENTIAL, ...OTHERS];
const keyOf = (group: string) => `whatsapp.notify.${group}`;

type FormState = Record<string, boolean>;

const DEFAULTS: FormState = Object.fromEntries(
  ALL.map((t) => [t.group, t.defaultOn]),
);

export function WhatsAppNotificationsCard() {
  const { configs, isLoading, saveChanges, isSaving } =
    useSystemConfigCategory("MATCHING");

  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [initial, setInitial] = useState<FormState>(DEFAULTS);

  useEffect(() => {
    if (configs.length === 0) return;
    const data = { ...DEFAULTS };
    for (const item of configs) {
      const toggle = ALL.find((t) => keyOf(t.group) === item.key);
      if (toggle) data[toggle.group] = item.value === "true";
    }
    setForm(data);
    setInitial(data);
  }, [configs]);

  const isDirty = ALL.some((t) => form[t.group] !== initial[t.group]);
  const disabled = isLoading || isSaving;

  async function handleSave() {
    await saveChanges(
      Object.fromEntries(
        ALL.filter((t) => form[t.group] !== initial[t.group]).map((t) => [
          keyOf(t.group),
          String(form[t.group]),
        ]),
      ),
    );
    setInitial(form);
  }

  const section = (title: string, toggles: Toggle[]) => (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {title}
      </p>
      {toggles.map((t, i) => (
        <Fragment key={t.group}>
          {i > 0 && <Separator />}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor={`wa-${t.group}`} className="text-sm font-medium">
                {t.label}
              </Label>
              <p className="text-muted-foreground text-xs">{t.hint}</p>
            </div>
            <Switch
              id={`wa-${t.group}`}
              checked={form[t.group]}
              onCheckedChange={(v) =>
                setForm((prev) => ({ ...prev, [t.group]: v }))
              }
              disabled={disabled}
            />
          </div>
        </Fragment>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <IconBrandWhatsapp className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              WhatsApp notifications
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Which events are also sent on WhatsApp. The in-app notification
              is always sent. A message is free when the person wrote to us in
              the last 24h, and billed otherwise.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!isDirty || disabled}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-8 pt-6">
        {section("Essentials", ESSENTIAL)}
        {section("Others — in-app only when off", OTHERS)}
      </CardContent>
    </Card>
  );
}
