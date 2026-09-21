/**
 * The message as a WhatsApp bubble.
 *
 * Worth the few lines: an admin writing in a textarea sees a wall of text, and
 * the thing that gets sent is a short chat message with a button. Seeing the
 * shape is what stops a three-paragraph announcement going out.
 */
export function MessagePreview({
  title,
  body,
}: Readonly<{ title: string; body: string }>) {
  const empty = !title.trim() && !body.trim();

  return (
    <div className="bg-card shadow-soft space-y-2 rounded-lg p-4">
      <p className="text-muted-foreground text-xs font-medium">Preview</p>

      <div className="bg-muted rounded-lg p-3">
        {empty ? (
          <p className="text-muted-foreground text-sm">
            Your message appears here as it will be received.
          </p>
        ) : (
          <div className="space-y-2 text-sm">
            <p>Bonjour Jean,</p>
            {title.trim() ? <p className="font-semibold">{title}</p> : null}
            {/* `whitespace-pre-line` because the paragraphs someone typed are
                part of the message, and WhatsApp keeps them. */}
            <p className="whitespace-pre-line">{body}</p>
            <p className="text-muted-foreground">L’équipe Rabotka</p>
            <div className="bg-background rounded-md px-3 py-1.5 text-center text-xs font-medium">
              Ouvrir Rabotka
            </div>
          </div>
        )}
      </div>

      <p className="text-muted-foreground text-xs">
        The greeting and sign-off are added per recipient.
      </p>
    </div>
  );
}
