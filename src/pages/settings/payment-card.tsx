import { useState, useEffect } from "react";
import { IconCreditCard, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";

type PaymentGatewayDriver = "MONETBIL" | "MTN_MOMO";

const DRIVER_LABELS: Record<PaymentGatewayDriver, string> = {
  MONETBIL: "Monetbil",
  MTN_MOMO: "MTN Mobile Money",
};

const DRIVER_KEYS: Record<PaymentGatewayDriver, string[]> = {
  MONETBIL: ["payment.monetbil.service_key"],
  MTN_MOMO: [
    "payment.mtn_momo.base_url",
    "payment.mtn_momo.subscription_key",
    "payment.mtn_momo.api_user",
    "payment.mtn_momo.api_key",
    "payment.mtn_momo.environment",
    "payment.mtn_momo.currency",
  ],
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

export function PaymentCard() {
  const { configs, isLoading, saveChanges, isSaving } =
    useSystemConfigCategory("PAYMENT");

  const [form, setForm] = useState<Record<string, string>>({});
  const [initial, setInitial] = useState<Record<string, string>>({});
  const [driver, setDriver] = useState<PaymentGatewayDriver>("MONETBIL");
  const [initialDriver, setInitialDriver] =
    useState<PaymentGatewayDriver>("MONETBIL");

  useEffect(() => {
    if (configs.length === 0) return;
    const data: Record<string, string> = {};
    for (const item of configs) {
      if (item.key === "payment.gateway_driver") continue;
      data[item.key] = item.isSecret ? "" : item.value;
    }
    setForm(data);
    setInitial(data);

    const driverItem = configs.find((c) => c.key === "payment.gateway_driver");
    if (driverItem) {
      const d = driverItem.value.toUpperCase() as PaymentGatewayDriver;
      setDriver(d);
      setInitialDriver(d);
    }
  }, [configs]);

  const isDirty =
    driver !== initialDriver ||
    Object.keys(form).some((k) => form[k] !== initial[k]);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const payload: Record<string, string> = {
      "payment.gateway_driver": driver,
    };

    for (const key of DRIVER_KEYS[driver]) {
      const value = form[key] ?? "";
      const cfg = configs.find((c) => c.key === key);
      if (cfg?.isSecret && value === "") continue;
      payload[key] = value;
    }

    await saveChanges(payload);
    setInitial(form);
    setInitialDriver(driver);
  }

  const activeKeys = DRIVER_KEYS[driver];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <IconCreditCard className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Payment Gateway
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Active gateway and credentials
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
        <div className="mb-6 max-w-xs space-y-1.5 pt-6">
          <FieldLabel>Gateway</FieldLabel>
          <Select
            value={driver}
            onValueChange={(v) => setDriver(v as PaymentGatewayDriver)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(DRIVER_LABELS) as PaymentGatewayDriver[]).map(
                (d) => (
                  <SelectItem key={d} value={d}>
                    {DRIVER_LABELS[d]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <Separator className="mb-6" />

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          {activeKeys.map((key) => {
            const cfg = configs.find((c) => c.key === key);
            const label = cfg?.label ?? key;
            const isSecret = cfg?.isSecret ?? false;
            const value = form[key] ?? "";
            const fullSpan = activeKeys.length === 1;

            return (
              <div key={key} className={`space-y-1.5${fullSpan ? " sm:col-span-2" : ""}`}>
                <FieldLabel>{label}</FieldLabel>
                {isSecret ? (
                  <SecretInput value={value} onChange={(v) => set(key, v)} />
                ) : (
                  <Input
                    value={value}
                    onChange={(e) => set(key, e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
