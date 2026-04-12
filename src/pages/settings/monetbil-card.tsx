import { useState, useEffect } from "react";
import { IconCreditCard } from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";

type FormState = {
  "monetbil.service_key": string;
};

const EMPTY: FormState = {
  "monetbil.service_key": "",
};

function FieldLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {children}
    </label>
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
            <IconCreditCard className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Monetbil</CardTitle>
            <p className="text-muted-foreground text-xs">
              Service key for mobile money payments (MTN, Airtel)
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
        <div className="pt-6">
          <div className="space-y-1.5">
            <FieldLabel>Service Key</FieldLabel>
            <Input
              value={form["monetbil.service_key"]}
              onChange={(e) => set("monetbil.service_key", e.target.value)}
              placeholder="j9XjZzkFqjeL5fk34e1RNq98thRRwvYf"
            />
            <p className="text-muted-foreground text-xs">
              Found in your Monetbil dashboard under Service settings.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
