import { useState, useEffect } from "react";
import { IconAddressBook } from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";

type FormState = {
  "contact.email": string;
  "contact.phone": string;
  "contact.address": string;
  "contact.orange_money_number": string;
  "contact.airtel_money_number": string;
};

const EMPTY: FormState = {
  "contact.email": "",
  "contact.phone": "",
  "contact.address": "",
  "contact.orange_money_number": "",
  "contact.airtel_money_number": "",
};

function FieldLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {children}
    </label>
  );
}

export function ContactCard() {
  const { configs, isLoading, saveChanges, isSaving } =
    useSystemConfigCategory("CONTACT");

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
            <IconAddressBook className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Contact Information
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Public contact details and mobile payment numbers
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
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 pt-6">
          <div className="space-y-1.5">
            <FieldLabel>Contact Email</FieldLabel>
            <Input
              type="email"
              value={form["contact.email"]}
              onChange={(e) => set("contact.email", e.target.value)}
              placeholder="contact@rabotka.com"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Phone</FieldLabel>
            <Input
              type="tel"
              value={form["contact.phone"]}
              onChange={(e) => set("contact.phone", e.target.value)}
              placeholder="+242 06 000 0000"
            />
          </div>

          <div className="col-span-full space-y-1.5">
            <FieldLabel>Physical Address</FieldLabel>
            <Input
              value={form["contact.address"]}
              onChange={(e) => set("contact.address", e.target.value)}
              placeholder="Brazzaville, Congo"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>MTN Money Number</FieldLabel>
            <Input
              value={form["contact.orange_money_number"]}
              onChange={(e) =>
                set("contact.orange_money_number", e.target.value)
              }
              placeholder="+242 06 000 0000"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Airtel Money Number</FieldLabel>
            <Input
              value={form["contact.airtel_money_number"]}
              onChange={(e) =>
                set("contact.airtel_money_number", e.target.value)
              }
              placeholder="+242 05 000 0000"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
