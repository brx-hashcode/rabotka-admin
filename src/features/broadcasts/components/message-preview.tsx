import type { BroadcastChannel } from "#/lib/api/broadcasts-controller";

type Props = Readonly<{
  title: string;
  body: string;
  link: string;
  channels: BroadcastChannel[];
}>;

/**
 * The message as each selected channel will actually render it.
 *
 * Worth the few lines: an admin writing in a textarea sees a wall of text, and
 * what gets sent is a short notification. Seeing the shape is what stops a
 * three-paragraph announcement going out.
 *
 * One block per channel, because they do NOT look alike and pretending
 * otherwise misleads. The WhatsApp template wraps the message in a greeting, a
 * sign-off and a CTA button — none of which exist in the in-app feed, where the
 * row itself is the tap target and the title is the whole header.
 */
export function MessagePreview({ title, body, link, channels }: Props) {
  const empty = !title.trim() && !body.trim();

  if (empty) {
    return (
      <div className="bg-card shadow-soft space-y-2 rounded-lg p-4">
        <p className="text-muted-foreground text-xs font-medium">Preview</p>
        <div className="bg-muted rounded-lg p-3">
          <p className="text-muted-foreground text-sm">
            Your message appears here as it will be received.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card shadow-soft space-y-3 rounded-lg p-4">
      <p className="text-muted-foreground text-xs font-medium">Preview</p>

      {channels.includes("IN_APP") ? (
        <ChannelBlock label="In-app">
          <InAppPreview title={title} body={body} link={link} />
        </ChannelBlock>
      ) : null}

      {channels.includes("WHATSAPP") ? (
        <ChannelBlock
          label="WhatsApp"
          note="The greeting, sign-off and button come from the approved template."
        >
          <WhatsAppPreview title={title} body={body} />
        </ChannelBlock>
      ) : null}

      {channels.includes("EMAIL") ? (
        <ChannelBlock label="Email">
          <EmailPreview title={title} body={body} />
        </ChannelBlock>
      ) : null}

      {channels.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Pick a channel to see how the message will look.
        </p>
      ) : null}
    </div>
  );
}

function ChannelBlock({
  label,
  note,
  children,
}: Readonly<{ label: string; note?: string; children: React.ReactNode }>) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="bg-muted rounded-lg p-3">{children}</div>
      {note ? <p className="text-muted-foreground text-xs">{note}</p> : null}
    </div>
  );
}

/**
 * A row in the notification feed: title, body, and nothing else.
 *
 * No greeting and no button — the row is the tap target, and the destination is
 * a property of the row rather than something the reader has to aim at.
 */
function InAppPreview({
  title,
  body,
  link,
}: Readonly<{ title: string; body: string; link: string }>) {
  return (
    <div className="space-y-1 text-sm">
      {title.trim() ? <p className="font-semibold">{title}</p> : null}
      <p className="whitespace-pre-line">{body}</p>
      {link.trim() ? (
        <p className="text-muted-foreground text-xs">
          Tapping it opens /{link.trim().replace(/^\/+/, "")}
        </p>
      ) : null}
    </div>
  );
}

function WhatsAppPreview({
  title,
  body,
}: Readonly<{ title: string; body: string }>) {
  return (
    <div className="space-y-2 text-sm">
      <p>Bonjour Jean,</p>
      {title.trim() ? <p className="font-semibold">{title}</p> : null}
      {/* `whitespace-pre-line` because the paragraphs someone typed are part of
          the message, and WhatsApp keeps them. */}
      <p className="whitespace-pre-line">{body}</p>
      <p className="text-muted-foreground">L’équipe Rabotka</p>
      <div className="bg-background rounded-md px-3 py-1.5 text-center text-xs font-medium">
        Ouvrir Rabotka
      </div>
    </div>
  );
}

function EmailPreview({
  title,
  body,
}: Readonly<{ title: string; body: string }>) {
  return (
    <div className="space-y-2 text-sm">
      <p className="text-muted-foreground text-xs">
        Subject: <span className="text-foreground">{title}</span>
      </p>
      <p>Bonjour Jean,</p>
      <p className="whitespace-pre-line">{body}</p>
      <p className="text-muted-foreground">L’équipe Rabotka</p>
    </div>
  );
}
