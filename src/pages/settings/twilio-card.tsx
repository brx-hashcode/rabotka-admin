import { useState, useEffect } from "react";
import { IconBrandTwilio, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";

type FormState = {
  "twilio.account_sid": string;
  "twilio.auth_token": string;
  "twilio.whatsapp_from": string;
  "twilio.sms_from": string;
};

const EMPTY: FormState = {
  "twilio.account_sid": "",
  "twilio.auth_token": "",
  "twilio.whatsapp_from": "",
  "twilio.sms_from": "",
};

function FieldLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {children}
    </label>
  );
}

function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative flex items-center">
      <Input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Leave blank to keep unchanged"}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground hover:text-foreground absolute right-3 transition-colors"
        aria-label={visible ? "Hide" : "Show"}
      >
        {visible ? (
          <IconEyeOff className="size-4" />
        ) : (
          <IconEye className="size-4" />
        )}
      </button>
    </div>
  );
}

export function TwilioCard() {
  const { configs, isLoading, saveChanges, isSaving } =
    useSystemConfigCategory("TWILIO");

  const [form, setForm] = useState<FormState>(EMPTY);
  const [initial, setInitial] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (configs.length === 0) return;
    const data = { ...EMPTY };
    for (const item of configs) {
      if (item.key in data) {
        // Secret fields come back as '***' — show empty so user types new value
        (data as Record<string, string>)[item.key] = item.isSecret
          ? ""
          : item.value;
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
    // Only send keys that the user actually typed (skip blank secret fields)
    const payload: Record<string, string> = {};
    for (const [key, value] of Object.entries(form)) {
      const cfg = configs.find((c) => c.key === key);
      // For secret fields: only send if user typed something
      if (cfg?.isSecret && value === "") continue;
      // For non-secret fields: send regardless
      payload[key] = value;
    }
    await saveChanges(payload);
    setInitial(form);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <IconBrandTwilio className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Twilio</CardTitle>
            <p className="text-muted-foreground text-xs">
              Credentials and sender numbers for WhatsApp / SMS
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || isSaving || isLoading}
        >
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel>Account SID</FieldLabel>
            <Input
              value={form["twilio.account_sid"]}
              onChange={(e) => set("twilio.account_sid", e.target.value)}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Auth Token</FieldLabel>
            <SecretInput
              value={form["twilio.auth_token"]}
              onChange={(v) => set("twilio.auth_token", v)}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>WhatsApp Sender Number</FieldLabel>
            <Input
              value={form["twilio.whatsapp_from"]}
              onChange={(e) => set("twilio.whatsapp_from", e.target.value)}
              placeholder="whatsapp:+14155238886"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>SMS Sender Number</FieldLabel>
            <Input
              value={form["twilio.sms_from"]}
              onChange={(e) => set("twilio.sms_from", e.target.value)}
              placeholder="+14155238886"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
