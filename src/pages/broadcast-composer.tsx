import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Send } from "lucide-react";

import { PageListHeader } from "#/components/page-list-header";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { AudienceBuilder } from "#/features/broadcasts/components/audience-builder";
import { AudienceSummary } from "#/features/broadcasts/components/audience-summary";
import { MessagePreview } from "#/features/broadcasts/components/message-preview";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  createBroadcast,
  previewBroadcastAudience,
  sendBroadcast,
  type AudienceFilters,
  type BroadcastChannel,
} from "#/lib/api/broadcasts-controller";
import { useRole } from "#/hooks/use-role";

/** Matches BROADCAST_MESSAGE_VAR_MAX on the server. */
const BODY_MAX = 700;

/**
 * Turn WhatsApp broadcasts back on by deleting this flag and the `disabled`
 * line below.
 *
 * Off for now at the team's request. The channel is left ON SCREEN rather than
 * removed on purpose: an option that vanishes looks like a missing feature,
 * while a disabled one with a reason tells the next admin what is going on and
 * that it is coming back. Nothing about the backend leg is removed — a
 * broadcast created through the API can still carry WHATSAPP.
 */
const WHATSAPP_ENABLED = false;

const CHANNELS: {
  value: BroadcastChannel;
  label: string;
  hint: string;
  disabled?: boolean;
  disabledReason?: string;
}[] = [
  {
    value: "IN_APP",
    label: "In-app",
    hint: "Everyone in the audience. Free.",
  },
  {
    value: "WHATSAPP",
    label: "WhatsApp",
    hint: "Free for anyone who wrote to us in the last 24h, billed for the rest.",
    disabled: !WHATSAPP_ENABLED,
    disabledReason: "Temporarily unavailable.",
  },
  {
    value: "EMAIL",
    label: "Email",
    hint: "Only reaches profiles that have an address. Free.",
  },
];

export default function BroadcastComposerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canManageContent } = useRole();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [channels, setChannels] = useState<BroadcastChannel[]>(["IN_APP"]);
  const [audience, setAudience] = useState<AudienceFilters>({});
  const [confirming, setConfirming] = useState(false);
  const [confirmCounts, setConfirmCounts] = useState<{
    total: number;
    billable: number;
  } | null>(null);

  const ready = title.trim() && body.trim() && channels.length > 0;

  const toggleChannel = (channel: BroadcastChannel) => {
    // Belt and braces: the checkbox is disabled, and a disabled channel can
    // never enter the payload even if something else flips it.
    if (CHANNELS.find((c) => c.value === channel)?.disabled) return;

    setChannels((current) =>
      current.includes(channel)
        ? current.filter((c) => c !== channel)
        : [...current, channel],
    );
  };

  /**
   * Counted again at confirm time rather than reusing what the panel shows.
   *
   * The panel is debounced and may be a few hundred milliseconds stale; this
   * number is the one the admin is about to agree to, so it is worth a fresh
   * request.
   */
  const openConfirm = async () => {
    try {
      const preview = await previewBroadcastAudience(audience);
      setConfirmCounts({
        total: preview.total,
        billable: preview.billableWhatsapp,
      });
      setConfirming(true);
    } catch (err) {
      toast.error(friendlyError(err, "The audience could not be counted"));
    }
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      const broadcast = await createBroadcast({
        title: title.trim(),
        body: body.trim(),
        ...(link.trim() ? { link: link.trim() } : {}),
        channels,
        audience,
      });
      const result = await sendBroadcast(broadcast.id);
      return { broadcast, result };
    },
    onSuccess: async ({ broadcast, result }) => {
      toast.success(
        `Sending to ${result.recipientCount.toLocaleString("fr-FR")} deliveries`,
      );
      await queryClient.invalidateQueries({
        queryKey: ["admin", "broadcasts"],
      });
      void navigate({
        to: "/broadcasts/$broadcastId",
        params: { broadcastId: broadcast.id },
      });
    },
    onError: (err) => toast.error(friendlyError(err, "The broadcast was not sent")),
    onSettled: () => setConfirming(false),
  });

  const saveDraft = useMutation({
    mutationFn: () =>
      createBroadcast({
        title: title.trim(),
        body: body.trim(),
        ...(link.trim() ? { link: link.trim() } : {}),
        channels,
        audience,
      }),
    onSuccess: async () => {
      toast.success("Draft saved");
      await queryClient.invalidateQueries({
        queryKey: ["admin", "broadcasts"],
      });
      void navigate({ to: "/broadcasts" });
    },
    onError: (err) => toast.error(friendlyError(err, "The draft was not saved")),
  });

  return (
    <div>
      <PageListHeader
        title="New broadcast"
        description="One message to a segment. Everyone sees it in the app; WhatsApp and email reach further."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <section className="bg-card shadow-soft space-y-4 rounded-lg p-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                maxLength={120}
                placeholder="Maintenance planifiée"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={body}
                rows={7}
                maxLength={BODY_MAX}
                placeholder="Rabotka sera en maintenance dimanche de 8h à 10h…"
                onChange={(e) => setBody(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                {body.length}/{BODY_MAX} — the WhatsApp template caps here, so
                the limit applies even to an in-app-only send.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Opens (optional)</Label>
              <Input
                id="link"
                value={link}
                placeholder="recherche-offres"
                onChange={(e) => setLink(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                An app path without the host. Leave empty to open the home page.
              </p>
            </div>
          </section>

          <section className="bg-card shadow-soft space-y-3 rounded-lg p-4">
            <Label>Channels</Label>
            {CHANNELS.map((channel) => (
              <label
                key={channel.value}
                htmlFor={`channel-${channel.value}`}
                className={`bg-muted/40 flex items-start gap-3 rounded-lg p-3 ${
                  channel.disabled ? "opacity-50" : ""
                }`}
              >
                <Checkbox
                  id={`channel-${channel.value}`}
                  className="mt-0.5"
                  disabled={channel.disabled}
                  checked={
                    !channel.disabled && channels.includes(channel.value)
                  }
                  onCheckedChange={() => toggleChannel(channel.value)}
                />
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium">
                    {channel.label}
                    {channel.disabled ? (
                      <span className="text-muted-foreground ml-2 text-xs font-normal">
                        {channel.disabledReason}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {channel.hint}
                  </span>
                </span>
              </label>
            ))}
          </section>

          <section className="bg-card shadow-soft space-y-4 rounded-lg p-4">
            <AudienceBuilder value={audience} onChange={setAudience} />
          </section>
        </div>

        {/*
          Clears the sticky header block above it: SiteHeader is
          `--header-height` (3rem) and the breadcrumb row adds ~2.25rem, so the
          old `top-4` parked this card underneath both. 7rem leaves a gap
          rather than sitting flush against the breadcrumb.
        */}
        <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <AudienceSummary
            audience={audience}
            channels={channels}
            onClear={() => setAudience({})}
          />

          <MessagePreview
            title={title}
            body={body}
            link={link}
            channels={channels}
          />

          <div className="flex flex-col gap-2">
            <Button
              disabled={!ready || !canManageContent || sendMutation.isPending}
              onClick={openConfirm}
            >
              <Send className="size-4" />
              Send
            </Button>
            <Button
              variant="ghost"
              disabled={!ready || !canManageContent || saveDraft.isPending}
              onClick={() => saveDraft.mutate()}
            >
              Save as draft
            </Button>
            {canManageContent ? null : (
              <p className="text-muted-foreground text-xs">
                Your role can read broadcasts but not send them.
              </p>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Send to {(confirmCounts?.total ?? 0).toLocaleString("fr-FR")}{" "}
              people?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Channels: {channels.join(", ").toLowerCase().replace(/_/g, "-")}.
                </p>
                {channels.includes("WHATSAPP") &&
                (confirmCounts?.billable ?? 0) > 0 ? (
                  <p>
                    {confirmCounts?.billable.toLocaleString("fr-FR")} of them
                    are outside the free 24-hour window and will be sent as paid
                    templates.
                  </p>
                ) : null}
                <p>
                  Messages already delivered cannot be recalled — WhatsApp has
                  no unsend.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={sendMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                sendMutation.mutate();
              }}
            >
              {sendMutation.isPending ? "Sending…" : "Send now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
