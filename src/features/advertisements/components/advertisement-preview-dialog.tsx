import { useState, useRef } from "react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toPng } from "html-to-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import {
  IconMail,
  IconBrandWhatsapp,
  IconDeviceMobile,
  IconDownload,
  IconX,
} from "@tabler/icons-react";
import type { Advertisement } from "#/lib/api/advertisements-controller";

type Channel = "EMAIL" | "WHATSAPP" | "IN_APP";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advertisement: Advertisement;
};

function getDefaultChannel(
  hasEmail: boolean,
  hasWhatsApp: boolean,
  hasInApp: boolean,
): Channel {
  if (hasEmail) return "EMAIL";
  if (hasWhatsApp) return "WHATSAPP";
  if (hasInApp) return "IN_APP";
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


function EmailPreview({ ad }: Readonly<{ ad: Advertisement }>) {
  const name = "John Doe";
  const title = ad.title;
  const description = ad.description;
  const ctaUrl = ad.cta_url;
  const callToAction = ad.call_to_action ?? "En savoir plus";
  const tags = ad.tags ?? [];

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

      {ad.image_urls?.[0] && (
        <img
          src={ad.image_urls[0]}
          alt={title}
          className="w-full max-h-64 object-cover"
        />
      )}

      <div className="p-6 space-y-3">
        <p>
          Bonjour <strong>{name}</strong>,
        </p>
        <p>Vous avez une nouvelle annonce sur Rabotka :</p>

        <p style={{ fontSize: 18, fontWeight: 700, margin: "8px 0 4px" }}>
          {title}
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

        {tags.length > 0 && (
          <p style={{ margin: "8px 0" }}>
            {tags.map((t) => (
              <span
                key={t}
                style={{
                  display: "inline-block",
                  margin: "2px 4px 2px 0",
                  padding: "2px 10px",
                  borderRadius: 9999,
                  border: "1px solid #6ee7b7",
                  color: "#059669",
                  fontSize: 12,
                }}
              >
                #{t}
              </span>
            ))}
          </p>
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
  const description = ad.description;
  const ctaUrl = ad.cta_url;
  const callToAction = ad.call_to_action ?? "En savoir plus";
  const tags = ad.tags ?? [];

  const lines = [
    `📢 *Nouvelle annonce Rabotka*`,
    ``,
    `*${title}*`,
    description ? `\n${description}` : null,
    tags.length ? `\n${tags.map((t) => `#${t}`).join("  ")}` : null,
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

/**
 * Mirrors the client's in-app popup (rabotka-client `features/ads/ad-popup`):
 * near-fullscreen card over a dimmed backdrop, plain-text body (the client does
 * not render markdown there) and the deliberately off-brand blue CTA.
 */
function InAppPreview({ ad }: Readonly<{ ad: Advertisement }>) {
  const callToAction = ad.call_to_action ?? "En savoir plus";
  const image = ad.banner_url ?? ad.image_urls?.[0];
  const tags = ad.tags ?? [];

  return (
    <div className="mx-auto w-full max-w-[320px]">
      <div className="relative h-150 overflow-hidden rounded-[2rem] bg-zinc-900 p-2 shadow-xl">
        {/* App screen behind the ad */}
        <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] bg-zinc-100">
          <div className="space-y-2 p-3">
            <div className="h-9 rounded-full bg-white" />
            <div className="h-16 rounded-xl bg-white" />
            <div className="h-24 rounded-xl bg-white" />
            <div className="h-24 rounded-xl bg-white" />
          </div>

          {/* Popup */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-2">
            <div className="relative flex h-[92%] w-full flex-col overflow-hidden rounded-2xl bg-white">
              <div className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-zinc-700">
                <IconX className="size-4" />
              </div>

              {image && (
                <div className="relative min-h-0 flex-1">
                  <img
                    src={image}
                    alt={ad.title}
                    className="size-full object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                    Publicité
                  </span>
                </div>
              )}

              <div className="flex max-h-[58%] min-h-0 shrink-0 flex-col gap-1.5 p-4 pb-3">
                {!image && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Publicité
                  </span>
                )}
                <p className="shrink-0 text-lg font-bold leading-tight text-zinc-900">
                  {ad.title}
                </p>
                <p className="min-h-0 flex-1 overflow-hidden text-sm leading-relaxed text-zinc-500">
                  {ad.description}
                </p>
                {tags.length > 0 && (
                  <ul className="flex shrink-0 flex-wrap gap-1">
                    {tags.map((t) => (
                      <li
                        key={t}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500"
                      >
                        #{t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {ad.cta_url && (
                <div className="shrink-0 px-4 pb-4">
                  {/* Matches the client's `outline` button: flat green tint. */}
                  <div className="flex h-11 w-full items-center justify-center rounded-md bg-whatsapp/10 text-sm font-semibold text-whatsapp">
                    {callToAction}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelPreview({
  channel,
  ad,
}: Readonly<{ channel: Channel; ad: Advertisement }>) {
  if (channel === "EMAIL") return <EmailPreview ad={ad} />;
  if (channel === "WHATSAPP") return <WhatsAppPreview ad={ad} />;
  return <InAppPreview ad={ad} />;
}

export function AdvertisementPreviewDialog({
  open,
  onOpenChange,
  advertisement,
}: Readonly<Props>) {
  const channels = advertisement.bundle?.allowed_channels ?? [];
  const hasEmail = channels.some((c) => c === "EMAIL" || c === "BOTH");
  const hasWhatsApp = channels.some((c) => c === "WHATSAPP" || c === "BOTH");
  const hasInApp = channels.includes("IN_APP");

  const defaultChannel = getDefaultChannel(hasEmail, hasWhatsApp, hasInApp);

  const [activeChannel, setActiveChannel] = useState<Channel>(defaultChannel);
  const [isSaving, setIsSaving] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleSaveImage = async () => {
    if (!previewRef.current) return;
    setIsSaving(true);
    try {
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      const slug = advertisement.title.toLowerCase().replace(/\s+/g, "-").slice(0, 40);
      link.download = `ad-preview-${activeChannel.toLowerCase()}-${slug}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // silent — user can retry
    } finally {
      setIsSaving(false);
    }
  };

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
          {(hasInApp || channels.length === 0) && (
            <Button
              type="button"
              size="sm"
              variant={activeChannel === "IN_APP" ? "default" : "outline"}
              onClick={() => setActiveChannel("IN_APP")}
              className="gap-1.5"
            >
              <IconDeviceMobile className="size-4" />
              In-app
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="self-center text-[10px]">
              Preview only — placeholder recipient
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSaveImage}
              disabled={isSaving}
              className="gap-1.5 shrink-0"
            >
              <IconDownload className="size-4" />
              {isSaving ? "Saving…" : "Save as image"}
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div ref={previewRef}>
            <ChannelPreview channel={activeChannel} ad={advertisement} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
