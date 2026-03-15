import { useState, useEffect } from "react";
import { IconCloud, IconEye, IconEyeOff } from "@tabler/icons-react";
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

type StorageDriver = "S3" | "CLOUDFLARE" | "CLOUDINARY" | "VERCEL_BLOB";

const DRIVER_LABELS: Record<StorageDriver, string> = {
  S3: "Amazon S3",
  CLOUDFLARE: "Cloudflare R2",
  CLOUDINARY: "Cloudinary",
  VERCEL_BLOB: "Vercel Blob",
};

// All keys that belong to each driver (excluding the storage.driver key itself)
const DRIVER_KEYS: Record<StorageDriver, string[]> = {
  S3: [
    "storage.s3.bucket",
    "storage.s3.region",
    "storage.s3.access_key_id",
    "storage.s3.secret_access_key",
    "storage.s3.endpoint",
  ],
  CLOUDFLARE: [
    "storage.cloudflare.account_id",
    "storage.cloudflare.bucket_name",
    "storage.cloudflare.access_key_id",
    "storage.cloudflare.secret_access_key",
  ],
  CLOUDINARY: [
    "storage.cloudinary.cloud_name",
    "storage.cloudinary.api_key",
    "storage.cloudinary.api_secret",
  ],
  VERCEL_BLOB: ["storage.vercel_blob.token"],
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

export function StorageCard() {
  const { configs, isLoading, saveChanges, isSaving } =
    useSystemConfigCategory("STORAGE");

  // form holds key → value for every storage key
  const [form, setForm] = useState<Record<string, string>>({});
  const [initial, setInitial] = useState<Record<string, string>>({});
  const [driver, setDriver] = useState<StorageDriver>("S3");
  const [initialDriver, setInitialDriver] = useState<StorageDriver>("S3");

  useEffect(() => {
    if (configs.length === 0) return;
    const data: Record<string, string> = {};
    for (const item of configs) {
      if (item.key === "storage.driver") continue;
      // Secret fields come as '***' — show empty so user types new value
      data[item.key] = item.isSecret ? "" : item.value;
    }
    setForm(data);
    setInitial(data);

    const driverItem = configs.find((c) => c.key === "storage.driver");
    if (driverItem) {
      const d = driverItem.value.toUpperCase() as StorageDriver;
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
    const payload: Record<string, string> = { "storage.driver": driver };

    for (const key of DRIVER_KEYS[driver]) {
      const value = form[key] ?? "";
      const cfg = configs.find((c) => c.key === key);
      // Skip blank secret inputs (means "don't change")
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
            <IconCloud className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              File Storage
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Active provider and access credentials
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
        {/* Provider selector */}
        <div className="mb-6 max-w-xs space-y-1.5">
          <FieldLabel>Provider</FieldLabel>
          <Select
            value={driver}
            onValueChange={(v) => setDriver(v as StorageDriver)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(DRIVER_LABELS) as StorageDriver[]).map((d) => (
                <SelectItem key={d} value={d}>
                  {DRIVER_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="mb-6" />

        {/* Dynamic credential fields */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          {activeKeys.map((key) => {
            const cfg = configs.find((c) => c.key === key);
            const label = cfg?.label ?? key;
            const isSecret = cfg?.isSecret ?? false;
            const value = form[key] ?? "";

            return (
              <div key={key} className="space-y-1.5">
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
