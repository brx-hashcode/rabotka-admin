import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { IconMail, IconBrandWhatsapp } from "@tabler/icons-react";
import type { Advertisement } from "#/lib/api/advertisements-controller";

type Channel = "EMAIL" | "WHATSAPP";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advertisement: Advertisement;
};

function getDefaultChannel(hasEmail: boolean, hasWhatsApp: boolean): Channel {
  if (hasEmail) return "EMAIL";
  if (hasWhatsApp) return "WHATSAPP";
  return "EMAIL";
}

function getLineTypePrefix(
  isBold: boolean,
  isItalic: boolean,
): "b" | "i" | "t" {
  if (isBold) return "b";
  if (isItalic) return "i";
  return "t";
}

function formatDate(iso: string) {
  try {
    return format(new Date(iso), "EEEE d MMMM yyyy", { locale: fr });
  } catch {
    return iso;
  }
}

function EmailPreview({ ad }: Readonly<{ ad: Advertisement }>) {
  const name = "John Doe";
  const title = ad.title;
  const startDate = formatDate(ad.start_date);
  const endDate = formatDate(ad.end_date);
  const description = ad.description;
  const ctaUrl = ad.cta_url;
  const callToAction = ad.call_to_action ?? "En savoir plus";

  return (
    <div className="border rounded-lg overflow-hidden bg-white text-[#333] font-[Ubuntu,sans-serif] text-[15px] leading-relaxed max-w-[600px] mx-auto">
      <div className="bg-zinc-100 border-b px-4 py-2 flex items-center gap-3">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-yellow-400" />
          <span className="size-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded text-xs px-3 py-1 text-zinc-500 truncate">
          Rabotka – Nouvelle annonce : {title}
        </div>
      </div>

      <div className="px-6 pt-4 pb-3 text-xs text-zinc-400 border-b space-y-0.5">
        <div>
          <span className="font-medium text-zinc-600">De :</span>{" "}
          no-reply@rabotka.com
        </div>
        <div>
          <span className="font-medium text-zinc-600">À :</span>{" "}
          john.doe@example.com
        </div>
        <div>
          <span className="font-medium text-zinc-600">Objet :</span> Rabotka –
          Nouvelle annonce : {title}
        </div>
      </div>

      <div className="p-6 space-y-3">
        {ad.image_urls?.[0] && (
          <img
            src={ad.image_urls[0]}
            alt={title}
            className="w-full max-h-52 object-cover rounded mb-2"
          />
        )}

        <p>
          Bonjour <strong>{name}</strong>,
        </p>
        <p>Vous avez une nouvelle annonce sur Rabotka :</p>

        <p style={{ fontSize: 18, fontWeight: 700, margin: "8px 0 4px" }}>
          {title}
        </p>

        <p>
          <strong>Du</strong> {startDate} <strong>au</strong> {endDate}
        </p>

        {description && (
          <div
            style={{ color: "#555" }}
            className="
            [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-1
            [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1
            [&_p]:my-1
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
            [&_li]:my-0.5
            [&_strong]:font-bold
            [&_em]:italic
            [&_a]:text-indigo-600 [&_a]:underline
            [&_hr]:border-zinc-200 [&_hr]:my-3
          "
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {description}
            </ReactMarkdown>
          </div>
        )}

        {ctaUrl && (
          <p style={{ marginTop: 16 }}>
            Pour plus d'informations, cliquez sur ce lien :{" "}
            <a
              href={ctaUrl}
              style={{
                color: "#4f46e5",
                textDecoration: "underline",
                overflowWrap: "break-word",
                wordBreak: "break-all",
                display: "inline-block",
                maxWidth: "100%",
              }}
            >
              {callToAction}
            </a>
          </p>
        )}

        <p style={{ marginTop: 20 }}>
          Si vous avez des questions, n'hésitez pas à nous contacter.
        </p>
        <p>
          Cordialement,
          <br />
          <strong>L'équipe Rabotka</strong>
        </p>
      </div>
    </div>
  );
}

function WhatsAppPreview({ ad }: Readonly<{ ad: Advertisement }>) {
  const title = ad.title;
  const startDate = formatDate(ad.start_date);
  const endDate = formatDate(ad.end_date);
  const description = ad.description;
  const ctaUrl = ad.cta_url;
  const callToAction = ad.call_to_action ?? "En savoir plus";

  const lines = [
    `📢 *Nouvelle annonce Rabotka*`,
    ``,
    `*${title}*`,
    `📅 Du ${startDate} au ${endDate}`,
    description ? `\n${description}` : null,
    ctaUrl ? `\nPour plus d'informations :\n${callToAction} → ${ctaUrl}` : null,
    ``,
    `_L'équipe Rabotka_`,
  ].filter((l) => l !== null);

  const message = lines.join("\n");
  const now = format(new Date(), "HH:mm");

  return (
    <div className="w-full">
      <div className="rounded-xl overflow-hidden border shadow-lg">
        <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
          <div className="size-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
            R
          </div>
          <div>
            <p className="font-semibold text-sm">Rabotka</p>
            <p className="text-[11px] text-white/70">en ligne</p>
          </div>
        </div>

        <div
          className="px-4 py-5 min-h-40 flex flex-col justify-end gap-2"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23e5ddd5'/%3E%3C/svg%3E")`,
          }}
        >
          <div className="self-start w-full max-w-[85%]">
            <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm wrap-break-word overflow-hidden">
              {ad.image_urls?.[0] && (
                <img
                  src={ad.image_urls[0]}
                  alt={title}
                  className="w-full max-h-36 object-cover rounded mb-2"
                />
              )}
              <div className="text-[13px] text-[#111] leading-snug">
                {message.split("\n").map((line) => {
                  const bold = line.startsWith("*") && line.endsWith("*");
                  const italic = line.startsWith("_") && line.endsWith("_");
                  const clean = bold || italic ? line.slice(1, -1) : line;
                  const key = `${getLineTypePrefix(bold, italic)}-${line.slice(0, 20)}`;
                  return (
                    <p
                      key={key}
                      className={`${bold ? "font-bold" : ""} ${italic ? "italic text-zinc-500" : ""} ${line === "" ? "h-2" : ""}`}
                    >
                      {clean}
                    </p>
                  );
                })}
              </div>
              <p className="text-[10px] text-[#999] text-right mt-1">{now}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#f0f0f0] border-t px-3 py-2 flex items-center gap-2">
          <div className="flex-1    bg-white rounded-full px-4 py-1.5 text-xs text-zinc-400">
            Message
          </div>
          <div className="size-8 rounded-full bg-[#075E54] flex items-center justify-center">
            <IconBrandWhatsapp className="size-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdvertisementPreviewDialog({
  open,
  onOpenChange,
  advertisement,
}: Readonly<Props>) {
  const channels = advertisement.bundle?.allowed_channels ?? [];
  const hasEmail = channels.some((c) => c === "EMAIL" || c === "BOTH");
  const hasWhatsApp = channels.some((c) => c === "WHATSAPP" || c === "BOTH");

  const defaultChannel = getDefaultChannel(hasEmail, hasWhatsApp);

  const [activeChannel, setActiveChannel] = useState<Channel>(defaultChannel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-2xl flex flex-col gap-0 p-0 max-h-[90vh]">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>Preview — how users will see this ad</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 flex gap-2 shrink-0">
          {(hasEmail || channels.length === 0) && (
            <Button
              type="button"
              size="sm"
              variant={activeChannel === "EMAIL" ? "default" : "outline"}
              onClick={() => setActiveChannel("EMAIL")}
              className="gap-1.5"
            >
              <IconMail className="size-4" />
              Email
            </Button>
          )}
          {(hasWhatsApp || channels.length === 0) && (
            <Button
              type="button"
              size="sm"
              variant={activeChannel === "WHATSAPP" ? "default" : "outline"}
              onClick={() => setActiveChannel("WHATSAPP")}
              className="gap-1.5"
            >
              <IconBrandWhatsapp className="size-4" />
              WhatsApp
            </Button>
          )}
          <Badge variant="outline" className="ml-auto self-center text-[10px]">
            Preview only — placeholder recipient
          </Badge>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {activeChannel === "EMAIL" ? (
            <EmailPreview ad={advertisement} />
          ) : (
            <WhatsAppPreview ad={advertisement} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
