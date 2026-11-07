import { useState, useEffect } from "react";
import {
  IconAddressBook,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconBrandWhatsapp,
  IconBrandX,
  IconBrandYoutube,
} from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";

/** The networks shown as icons at the foot of every email, in that order. */
const SOCIALS = [
  { key: "social.facebook", label: "Facebook", icon: IconBrandFacebook, placeholder: "https://www.facebook.com/…" },
  { key: "social.instagram", label: "Instagram", icon: IconBrandInstagram, placeholder: "https://www.instagram.com/…" },
  { key: "social.linkedin", label: "LinkedIn", icon: IconBrandLinkedin, placeholder: "https://www.linkedin.com/company/…" },
  { key: "social.tiktok", label: "TikTok", icon: IconBrandTiktok, placeholder: "https://www.tiktok.com/@…" },
  { key: "social.x", label: "X", icon: IconBrandX, placeholder: "https://x.com/…" },
  { key: "social.youtube", label: "YouTube", icon: IconBrandYoutube, placeholder: "https://www.youtube.com/@…" },
  { key: "social.whatsapp", label: "WhatsApp", icon: IconBrandWhatsapp, placeholder: "https://wa.me/…" },
] as const;

type SocialKey = (typeof SOCIALS)[number]["key"];

type FormState = {
  "contact.email": string;
  "contact.phone": string;
  "contact.address": string;
  "company.legal_name": string;
  "company.rccm": string;
} & Record<SocialKey, string>;

const EMPTY: FormState = {
  "contact.email": "",
  "contact.phone": "",
  "contact.address": "",
  "company.legal_name": "",
  "company.rccm": "",
  ...(Object.fromEntries(SOCIALS.map((s) => [s.key, ""])) as Record<SocialKey, string>),
};

/** A social link the emails can use: empty, or an http(s) address. */
const linkOk = (value: string) => !value.trim() || /^https?:\/\/\S+$/i.test(value.trim());

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
  const badLinks = SOCIALS.filter((s) => !linkOk(form[s.key]));

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
              Contact & company
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Public details, shown at the foot of every email
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || isSaving || isLoading || badLinks.length > 0}
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
        </div>

        <div className="space-y-4 pt-8">
          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <p className="text-muted-foreground text-xs">
              « Rabotka SARL · RCCM … » in the email footer. An empty RCCM is not shown.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel>Legal name</FieldLabel>
              <Input
                value={form["company.legal_name"]}
                onChange={(e) => set("company.legal_name", e.target.value)}
                placeholder="Rabotka SARL"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>RCCM</FieldLabel>
              <Input
                value={form["company.rccm"]}
                onChange={(e) => set("company.rccm", e.target.value)}
                placeholder="CG-BZV-01-2025-B12-00000"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-8">
          <div>
            <h3 className="text-sm font-semibold">Social links</h3>
            <p className="text-muted-foreground text-xs">
              Each link set shows its icon in the email footer. Leave empty to hide it.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            {SOCIALS.map(({ key, label, icon: Icon, placeholder }) => {
              const bad = !linkOk(form[key]);
              return (
                <div key={key} className="space-y-1.5">
                  <FieldLabel>{label}</FieldLabel>
                  <div className="relative">
                    <Icon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                      type="url"
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder={placeholder}
                      aria-invalid={bad}
                      className="pl-9"
                    />
                  </div>
                  {bad && (
                    <p className="text-destructive text-xs">Starts with https://</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
