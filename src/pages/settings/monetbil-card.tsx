import { useState, useEffect } from "react";
import { IconCreditCard, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";

type FormState = {
  "monetbil.mode": "PRODUCTION" | "SANDBOX";
  "monetbil.service_key": string;
  "monetbil.service_secret": string;
};

const EMPTY: FormState = {
  "monetbil.mode": "SANDBOX",
  "monetbil.service_key": "",
  "monetbil.service_secret": "",
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
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}>) {
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

export function MonetbilCard() {
  const { configs, isLoading, saveChanges, isSaving } =
    useSystemConfigCategory("MONETBIL");

  const [form, setForm] = useState<FormState>(EMPTY);
  const [initial, setInitial] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (configs.length === 0) return;
    const data = { ...EMPTY };
    for (const item of configs) {
      if (item.key in data) {
        if (item.key === "monetbil.mode") {
          (data as Record<string, string>)[item.key] =
            item.value === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
        } else {
          (data as Record<string, string>)[item.key] = item.isSecret
            ? ""
            : item.value;
        }
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
    const payload: Record<string, string> = {};
    for (const [key, value] of Object.entries(form)) {
      const cfg = configs.find((c) => c.key === key);
      if (cfg?.isSecret && value === "") continue;
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
            <IconCreditCard className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Monetbil</CardTitle>
            <p className="text-muted-foreground text-xs">
              Service key and secret for mobile money payments
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

      <CardContent>
        <div className="pt-6 space-y-5">
          <div className="space-y-1.5">
            <FieldLabel>Mode</FieldLabel>
            <div className="flex gap-2">
              {(["SANDBOX", "PRODUCTION"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => set("monetbil.mode", mode)}
                  className={[
                    "flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                    form["monetbil.mode"] === mode
                      ? mode === "PRODUCTION"
                        ? "border-green-600 bg-green-600/10 text-green-600"
                        : "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/40",
                  ].join(" ")}
                >
                  {mode === "PRODUCTION" ? "🟢 Production" : "🧪 Sandbox"}
                </button>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              {form["monetbil.mode"] === "PRODUCTION"
                ? "Live payments — real money will be charged."
                : "Sandbox mode — no real charges. Use test credentials."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel>Service Key</FieldLabel>
              <Input
                value={form["monetbil.service_key"]}
                onChange={(e) => set("monetbil.service_key", e.target.value)}
                placeholder="j9XjZzkFqjeL5fk34e1RNq98thRRwvYf"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Service Secret</FieldLabel>
              <SecretInput
                value={form["monetbil.service_secret"]}
                onChange={(v) => set("monetbil.service_secret", v)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
