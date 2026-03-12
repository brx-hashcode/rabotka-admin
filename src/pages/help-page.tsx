import {
  IconMail,
  IconPhone,
  IconMapPin,
  IconDeviceMobile,
  IconBrandWhatsapp,
  IconHeadset,
  IconExternalLink,
  IconSettings,
} from "@tabler/icons-react";
import { useSystemConfigCategory } from "#/hooks/use-system-config";
import { Card, CardContent } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { Badge } from "#/components/ui/badge";

// ── types ────────────────────────────────────────────────────────────────────

type ContactTileProps = {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
  badge?: string;
};

// ── sub-components ────────────────────────────────────────────────────────────

function ContactTile({
  icon: Icon,
  label,
  value,
  href,
  badge,
}: Readonly<ContactTileProps>) {
  if (!value) return null;

  const inner = (
    <div className="group bg-card hover:bg-muted/50 relative flex items-start gap-4 rounded-xl border p-5 transition-colors">
      <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            {label}
          </p>
          {badge && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-foreground break-all text-sm font-medium">{value}</p>
      </div>
      {href && (
        <IconExternalLink className="text-muted-foreground/40 group-hover:text-muted-foreground absolute right-4 top-4 size-4 transition-colors" />
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {inner}
      </a>
    );
  }
  return inner;
}

function TileSkeleton() {
  return (
    <div className="rounded-xl border p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="size-11 rounded-lg shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const { configs, isLoading } = useSystemConfigCategory("CONTACT");

  function val(key: string) {
    return configs.find((c) => c.key === key)?.value ?? "";
  }

  const email = val("contact.email");
  const phone = val("contact.phone");
  const address = val("contact.address");
  const orange = val("contact.orange_money_number");
  const airtel = val("contact.airtel_money_number");

  return (
    <div className="space-y-8 pt-6">
      {/* ── Hero banner ─────────────────────────────────────────────────────── */}
      <div className="from-primary/10 to-primary/5 relative overflow-hidden rounded-2xl border bg-linear-to-br p-8">
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="bg-primary text-primary-foreground flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-lg">
              <IconHeadset className="size-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Need help?
              </h2>
              <p className="text-muted-foreground mt-1 max-w-lg text-sm">
                Find all Super Admin contact details here. This information is
                updated directly from the system settings.
              </p>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="bg-primary/5 absolute -right-10 -top-10 size-48 rounded-full" />
        <div className="bg-primary/5 absolute -bottom-8 right-24 size-32 rounded-full" />
      </div>

      {/* ── Contact grid ────────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Super Admin Contact Details
        </h3>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(5)].map((_, i) => (
              <TileSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ContactTile
              icon={IconMail}
              label="Email"
              value={email}
              href={email ? `mailto:${email}` : undefined}
            />
            <ContactTile
              icon={IconPhone}
              label="Phone"
              value={phone}
              href={phone ? `tel:${phone}` : undefined}
            />
            <ContactTile
              icon={IconBrandWhatsapp}
              label="WhatsApp"
              value={phone}
              href={
                phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : undefined
              }
              badge="Chat"
            />
            <ContactTile icon={IconMapPin} label="Address" value={address} />
            <ContactTile
              icon={IconDeviceMobile}
              label="Orange Money"
              value={orange}
              badge="Orange"
            />
            <ContactTile
              icon={IconDeviceMobile}
              label="Airtel Money"
              value={airtel}
              badge="Airtel"
            />
          </div>
        )}
      </div>

      <div>
        <Separator className="mb-4" />
        <Card className="border-dashed">
          <CardContent className="flex items-start gap-3 py-4">
            <IconSettings className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <p className="text-muted-foreground text-xs leading-relaxed">
              These settings are managed and secured by the Super Admin. Changes
              can only be made from the system administration panel.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
